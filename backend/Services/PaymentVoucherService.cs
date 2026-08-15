using backend.Database;
using backend.DTOs;
using backend.Enums;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class PaymentVoucherService : IPaymentVoucherService
{
    private readonly AppDbContext _context;

    public PaymentVoucherService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PaymentVoucherResponseDto>> GetAllAsync()
    {
        var vouchers = await _context.PaymentVouchers
            .Include(v => v.Treasury)
            .Include(v => v.Supplier)
            .Include(v => v.Customer)
            .Include(v => v.CounterAccount)
            .OrderByDescending(v => v.VoucherDate)
            .ThenByDescending(v => v.Id)
            .ToListAsync();

        return vouchers.Select(MapToResponse);
    }

    public async Task<PaymentVoucherResponseDto> GetByIdAsync(int id)
    {
        var voucher = await _context.PaymentVouchers
            .Include(v => v.Treasury)
            .Include(v => v.Supplier)
            .Include(v => v.Customer)
            .Include(v => v.CounterAccount)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند الصرف بالمعرف {id} غير موجود.");

        return MapToResponse(voucher);
    }

    public async Task<PaymentVoucherResponseDto> CreateAsync(CreatePaymentVoucherDto dto)
    {
        ValidateDto(dto);

        var voucher = new PaymentVoucher
        {
            VoucherNumber = string.IsNullOrWhiteSpace(dto.VoucherNumber) 
                ? $"PV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}" 
                : dto.VoucherNumber.Trim(),
            VoucherDate = dto.VoucherDate == default ? DateTime.UtcNow : dto.VoucherDate,
            TreasuryId = dto.TreasuryId,
            SupplierId = dto.SupplierId,
            CustomerId = dto.CustomerId,
            CounterAccountId = dto.CounterAccountId,
            PartyName = dto.PartyName?.Trim(),
            Amount = dto.Amount,
            Description = dto.Description?.Trim(),
            Status = VoucherStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _context.PaymentVouchers.Add(voucher);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(voucher.Id);
    }

    public async Task<PaymentVoucherResponseDto> UpdateAsync(int id, UpdatePaymentVoucherDto dto)
    {
        var voucher = await _context.PaymentVouchers.FindAsync(id)
            ?? throw new NotFoundException($"سند الصرف بالمعرف {id} غير موجود.");

        if (voucher.Status != VoucherStatus.Draft)
            throw new BusinessRuleException("لا يمكن تعديل سند الصرف إلا إذا كان في حالة مسودة.");

        ValidateDto(dto);

        voucher.VoucherNumber = string.IsNullOrWhiteSpace(dto.VoucherNumber) ? voucher.VoucherNumber : dto.VoucherNumber.Trim();
        voucher.VoucherDate = dto.VoucherDate == default ? voucher.VoucherDate : dto.VoucherDate;
        voucher.TreasuryId = dto.TreasuryId;
        voucher.SupplierId = dto.SupplierId;
        voucher.CustomerId = dto.CustomerId;
        voucher.CounterAccountId = dto.CounterAccountId;
        voucher.PartyName = dto.PartyName?.Trim();
        voucher.Amount = dto.Amount;
        voucher.Description = dto.Description?.Trim();
        voucher.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(voucher.Id);
    }

    public async Task<PaymentVoucherResponseDto> ConfirmAsync(int id)
    {
        var voucher = await _context.PaymentVouchers
            .Include(v => v.Treasury)
            .Include(v => v.Supplier)
            .Include(v => v.Customer)
            .Include(v => v.CounterAccount)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند الصرف بالمعرف {id} غير موجود.");

        if (voucher.Status == VoucherStatus.Confirmed)
            throw new BusinessRuleException("سند الصرف مؤكد بالفعل.");
        if (voucher.Status == VoucherStatus.Cancelled)
            throw new BusinessRuleException("لا يمكن تأكيد سند صرف ملغى.");

        if (voucher.Amount <= 0)
            throw new BusinessRuleException("مبلغ السند يجب أن يكون أكبر من الصفر.");

        var treasuryAccount = await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Id == voucher.TreasuryId && a.AccountType == "Treasury" && a.IsActive);

        if (treasuryAccount == null)
            throw new BusinessRuleException("الخزنة المحددة غير موجودة أو غير نشطة.");

        // Check sufficient balance
        var currentTreasuryBalance = TreasuryService.CalculateBalance(treasuryAccount);
        if (currentTreasuryBalance < voucher.Amount)
            throw new BusinessRuleException("رصيد الخزنة غير كافٍ.");

        string resolvedParty = voucher.Supplier?.Name ?? voucher.Customer?.Name ?? voucher.CounterAccount?.Name ?? voucher.PartyName ?? "طرف عام";

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            voucher.Status = VoucherStatus.Confirmed;
            voucher.UpdatedAt = DateTime.UtcNow;

            // 1. Treasury Debit (Outflow)
            var treasuryTx = new AccountTransaction
            {
                AccountId = treasuryAccount.Id,
                TransactionType = TransactionType.Debit,
                Debit = voucher.Amount,
                Credit = 0,
                PaidAmount = voucher.Amount,
                Amount = voucher.Amount,
                PartyName = resolvedParty,
                Description = voucher.Description ?? $"سند صرف رقم {voucher.VoucherNumber} إلى ({resolvedParty})",
                ReferenceType = "PaymentVoucher",
                ReferenceId = voucher.Id,
                TransactionDate = voucher.VoucherDate,
                CreatedAt = DateTime.UtcNow
            };
            _context.AccountTransactions.Add(treasuryTx);

            // 2. Counter Account or Supplier or Customer Account Integration
            if (voucher.CounterAccountId.HasValue)
            {
                var counterAcc = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == voucher.CounterAccountId.Value && a.IsActive);
                if (counterAcc == null)
                    throw new BusinessRuleException("الحساب المقابل المحدد غير موجود أو غير نشطة.");

                var counterTx = new AccountTransaction
                {
                    AccountId = counterAcc.Id,
                    TransactionType = TransactionType.Debit,
                    Debit = voucher.Amount,
                    Credit = 0,
                    PaidAmount = voucher.Amount,
                    Amount = voucher.Amount,
                    PartyName = resolvedParty,
                    Description = voucher.Description ?? $"سند صرف رقم {voucher.VoucherNumber}",
                    ReferenceType = "PaymentVoucher",
                    ReferenceId = voucher.Id,
                    TransactionDate = voucher.VoucherDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(counterTx);
            }
            else if (voucher.SupplierId.HasValue)
            {
                var supplierAccount = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.SupplierId == voucher.SupplierId.Value);

                if (supplierAccount == null)
                {
                    supplierAccount = new Account
                    {
                        SupplierId = voucher.SupplierId.Value,
                        Name = voucher.Supplier?.Name ?? "Supplier",
                        Code = $"SUP-{voucher.SupplierId.Value}",
                        AccountType = "Supplier",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Accounts.Add(supplierAccount);
                    await _context.SaveChangesAsync();
                }

                var suppTx = new AccountTransaction
                {
                    AccountId = supplierAccount.Id,
                    TransactionType = TransactionType.Credit,
                    Debit = 0,
                    Credit = voucher.Amount,
                    PaidAmount = voucher.Amount,
                    Amount = voucher.Amount,
                    PartyName = resolvedParty,
                    Description = voucher.Description ?? $"سند صرف رقم {voucher.VoucherNumber}",
                    ReferenceType = "PaymentVoucher",
                    ReferenceId = voucher.Id,
                    TransactionDate = voucher.VoucherDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(suppTx);
            }
            else if (voucher.CustomerId.HasValue)
            {
                var customerAccount = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.CustomerId == voucher.CustomerId.Value);

                if (customerAccount == null)
                {
                    customerAccount = new Account
                    {
                        CustomerId = voucher.CustomerId.Value,
                        Name = voucher.Customer?.Name ?? "Customer",
                        Code = $"CUS-{voucher.CustomerId.Value}",
                        AccountType = "Customer",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Accounts.Add(customerAccount);
                    await _context.SaveChangesAsync();
                }

                var custTx = new AccountTransaction
                {
                    AccountId = customerAccount.Id,
                    TransactionType = TransactionType.Debit,
                    Debit = voucher.Amount,
                    Credit = 0,
                    PaidAmount = voucher.Amount,
                    Amount = voucher.Amount,
                    PartyName = resolvedParty,
                    Description = voucher.Description ?? $"سند صرف رقم {voucher.VoucherNumber}",
                    ReferenceType = "PaymentVoucher",
                    ReferenceId = voucher.Id,
                    TransactionDate = voucher.VoucherDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(custTx);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return await GetByIdAsync(voucher.Id);
    }

    public async Task<PaymentVoucherResponseDto> CancelAsync(int id)
    {
        var voucher = await _context.PaymentVouchers
            .Include(v => v.Supplier)
            .Include(v => v.Customer)
            .Include(v => v.CounterAccount)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند الصرف بالمعرف {id} غير موجود.");

        if (voucher.Status == VoucherStatus.Cancelled)
            throw new BusinessRuleException("سند الصرف ملغى بالفعل.");
        if (voucher.Status != VoucherStatus.Confirmed)
            throw new BusinessRuleException("يمكن إلغاء السندات المؤكدة فقط.");

        string resolvedParty = voucher.Supplier?.Name ?? voucher.Customer?.Name ?? voucher.CounterAccount?.Name ?? voucher.PartyName ?? "طرف عام";

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            voucher.Status = VoucherStatus.Cancelled;
            voucher.UpdatedAt = DateTime.UtcNow;

            // Reverse Treasury
            var treasuryTx = new AccountTransaction
            {
                AccountId = voucher.TreasuryId,
                TransactionType = TransactionType.Credit,
                Debit = 0,
                Credit = voucher.Amount,
                PaidAmount = voucher.Amount,
                Amount = voucher.Amount,
                PartyName = resolvedParty,
                Description = $"إلغاء سند صرف رقم {voucher.VoucherNumber}",
                ReferenceType = "PaymentVoucherCancellation",
                ReferenceId = voucher.Id,
                TransactionDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.AccountTransactions.Add(treasuryTx);

            // Reverse Counter/Supplier/Customer account
            if (voucher.CounterAccountId.HasValue)
            {
                var counterRev = new AccountTransaction
                {
                    AccountId = voucher.CounterAccountId.Value,
                    TransactionType = TransactionType.Credit,
                    Debit = 0,
                    Credit = voucher.Amount,
                    PaidAmount = voucher.Amount,
                    Amount = voucher.Amount,
                    PartyName = resolvedParty,
                    Description = $"إلغاء سند صرف رقم {voucher.VoucherNumber}",
                    ReferenceType = "PaymentVoucherCancellation",
                    ReferenceId = voucher.Id,
                    TransactionDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(counterRev);
            }
            else if (voucher.SupplierId.HasValue)
            {
                var suppAcc = await _context.Accounts.FirstOrDefaultAsync(a => a.SupplierId == voucher.SupplierId.Value);
                if (suppAcc != null)
                {
                    var suppRev = new AccountTransaction
                    {
                        AccountId = suppAcc.Id,
                        TransactionType = TransactionType.Debit,
                        Debit = voucher.Amount,
                        Credit = 0,
                        PaidAmount = voucher.Amount,
                        Amount = voucher.Amount,
                        PartyName = resolvedParty,
                        Description = $"إلغاء سند صرف رقم {voucher.VoucherNumber}",
                        ReferenceType = "PaymentVoucherCancellation",
                        ReferenceId = voucher.Id,
                        TransactionDate = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.AccountTransactions.Add(suppRev);
                }
            }
            else if (voucher.CustomerId.HasValue)
            {
                var custAcc = await _context.Accounts.FirstOrDefaultAsync(a => a.CustomerId == voucher.CustomerId.Value);
                if (custAcc != null)
                {
                    var custRev = new AccountTransaction
                    {
                        AccountId = custAcc.Id,
                        TransactionType = TransactionType.Credit,
                        Debit = 0,
                        Credit = voucher.Amount,
                        PaidAmount = voucher.Amount,
                        Amount = voucher.Amount,
                        PartyName = resolvedParty,
                        Description = $"إلغاء سند صرف رقم {voucher.VoucherNumber}",
                        ReferenceType = "PaymentVoucherCancellation",
                        ReferenceId = voucher.Id,
                        TransactionDate = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.AccountTransactions.Add(custRev);
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return await GetByIdAsync(voucher.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var voucher = await _context.PaymentVouchers.FindAsync(id)
            ?? throw new NotFoundException($"سند الصرف بالمعرف {id} غير موجود.");

        if (voucher.Status != VoucherStatus.Draft)
            throw new BusinessRuleException("لا يمكن حذف سند صرف غير مسودة.");

        _context.PaymentVouchers.Remove(voucher);
        await _context.SaveChangesAsync();
    }

    private static void ValidateDto(CreatePaymentVoucherDto dto)
    {
        if (dto.TreasuryId <= 0)
            throw new BusinessRuleException("الخزنة مطلوبة.");
        if (dto.Amount <= 0)
            throw new BusinessRuleException("المبلغ يجب أن يكون أكبر من الصفر.");
    }

    private static PaymentVoucherResponseDto MapToResponse(PaymentVoucher v)
    {
        string resolved = v.Supplier?.Name ?? v.Customer?.Name ?? v.CounterAccount?.Name ?? v.PartyName ?? "-";
        return new PaymentVoucherResponseDto
        {
            Id = v.Id,
            VoucherNumber = v.VoucherNumber,
            VoucherDate = v.VoucherDate,
            TreasuryId = v.TreasuryId,
            TreasuryName = v.Treasury?.Name ?? string.Empty,
            SupplierId = v.SupplierId,
            SupplierName = v.Supplier?.Name,
            CustomerId = v.CustomerId,
            CustomerName = v.Customer?.Name,
            CounterAccountId = v.CounterAccountId,
            CounterAccountCode = v.CounterAccount?.Code,
            CounterAccountName = v.CounterAccount?.Name,
            PartyName = v.PartyName,
            ResolvedPartyName = resolved,
            Amount = v.Amount,
            Description = v.Description,
            Status = v.Status,
            StatusName = v.Status switch
            {
                VoucherStatus.Draft => "مسودة",
                VoucherStatus.Confirmed => "مؤكد",
                VoucherStatus.Cancelled => "ملغي",
                _ => v.Status.ToString()
            },
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }
}

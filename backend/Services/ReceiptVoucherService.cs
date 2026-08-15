using backend.Database;
using backend.DTOs;
using backend.Enums;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class ReceiptVoucherService : IReceiptVoucherService
{
    private readonly AppDbContext _context;

    public ReceiptVoucherService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ReceiptVoucherResponseDto>> GetAllAsync()
    {
        var vouchers = await _context.ReceiptVouchers
            .Include(v => v.Treasury)
            .Include(v => v.Customer)
            .Include(v => v.Supplier)
            .Include(v => v.CounterAccount)
            .OrderByDescending(v => v.VoucherDate)
            .ThenByDescending(v => v.Id)
            .ToListAsync();

        return vouchers.Select(MapToResponse);
    }

    public async Task<ReceiptVoucherResponseDto> GetByIdAsync(int id)
    {
        var voucher = await _context.ReceiptVouchers
            .Include(v => v.Treasury)
            .Include(v => v.Customer)
            .Include(v => v.Supplier)
            .Include(v => v.CounterAccount)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند القبض بالمعرف {id} غير موجود.");

        return MapToResponse(voucher);
    }

    public async Task<ReceiptVoucherResponseDto> CreateAsync(CreateReceiptVoucherDto dto)
    {
        ValidateDto(dto);

        var voucher = new ReceiptVoucher
        {
            VoucherNumber = string.IsNullOrWhiteSpace(dto.VoucherNumber) 
                ? $"RV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}" 
                : dto.VoucherNumber.Trim(),
            VoucherDate = dto.VoucherDate == default ? DateTime.UtcNow : dto.VoucherDate,
            TreasuryId = dto.TreasuryId,
            CustomerId = dto.CustomerId,
            SupplierId = dto.SupplierId,
            CounterAccountId = dto.CounterAccountId,
            PartyName = dto.PartyName?.Trim(),
            Amount = dto.Amount,
            Description = dto.Description?.Trim(),
            Status = VoucherStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _context.ReceiptVouchers.Add(voucher);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(voucher.Id);
    }

    public async Task<ReceiptVoucherResponseDto> UpdateAsync(int id, UpdateReceiptVoucherDto dto)
    {
        var voucher = await _context.ReceiptVouchers.FindAsync(id)
            ?? throw new NotFoundException($"سند القبض بالمعرف {id} غير موجود.");

        if (voucher.Status != VoucherStatus.Draft)
            throw new BusinessRuleException("لا يمكن تعديل سند القبض إلا إذا كان في حالة مسودة.");

        ValidateDto(dto);

        voucher.VoucherNumber = string.IsNullOrWhiteSpace(dto.VoucherNumber) ? voucher.VoucherNumber : dto.VoucherNumber.Trim();
        voucher.VoucherDate = dto.VoucherDate == default ? voucher.VoucherDate : dto.VoucherDate;
        voucher.TreasuryId = dto.TreasuryId;
        voucher.CustomerId = dto.CustomerId;
        voucher.SupplierId = dto.SupplierId;
        voucher.CounterAccountId = dto.CounterAccountId;
        voucher.PartyName = dto.PartyName?.Trim();
        voucher.Amount = dto.Amount;
        voucher.Description = dto.Description?.Trim();
        voucher.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(voucher.Id);
    }

    public async Task<ReceiptVoucherResponseDto> ConfirmAsync(int id)
    {
        var voucher = await _context.ReceiptVouchers
            .Include(v => v.Treasury)
            .Include(v => v.Customer)
            .Include(v => v.Supplier)
            .Include(v => v.CounterAccount)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند القبض بالمعرف {id} غير موجود.");

        if (voucher.Status == VoucherStatus.Confirmed)
            throw new BusinessRuleException("سند القبض مؤكد بالفعل.");
        if (voucher.Status == VoucherStatus.Cancelled)
            throw new BusinessRuleException("لا يمكن تأكيد سند قبض ملغى.");

        if (voucher.Amount <= 0)
            throw new BusinessRuleException("مبلغ السند يجب أن يكون أكبر من الصفر.");

        var treasury = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == voucher.TreasuryId && a.AccountType == "Treasury" && a.IsActive);
        if (treasury == null)
            throw new BusinessRuleException("الخزنة المحددة غير موجودة أو غير نشطة.");

        string resolvedParty = voucher.Customer?.Name ?? voucher.Supplier?.Name ?? voucher.CounterAccount?.Name ?? voucher.PartyName ?? "طرف عام";

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            voucher.Status = VoucherStatus.Confirmed;
            voucher.UpdatedAt = DateTime.UtcNow;

            // 1. Treasury Credit (Inflow)
            var treasuryTx = new AccountTransaction
            {
                AccountId = treasury.Id,
                TransactionType = TransactionType.Credit,
                Debit = 0,
                Credit = voucher.Amount,
                PaidAmount = voucher.Amount,
                Amount = voucher.Amount,
                PartyName = resolvedParty,
                Description = voucher.Description ?? $"سند قبض رقم {voucher.VoucherNumber} من ({resolvedParty})",
                ReferenceType = "ReceiptVoucher",
                ReferenceId = voucher.Id,
                TransactionDate = voucher.VoucherDate,
                CreatedAt = DateTime.UtcNow
            };
            _context.AccountTransactions.Add(treasuryTx);

            // 2. Counter Account or Customer or Supplier Account Integration
            if (voucher.CounterAccountId.HasValue)
            {
                var counterAcc = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == voucher.CounterAccountId.Value && a.IsActive);
                if (counterAcc == null)
                    throw new BusinessRuleException("الحساب المقابل المحدد غير موجود أو غير نشط.");

                var counterTx = new AccountTransaction
                {
                    AccountId = counterAcc.Id,
                    TransactionType = TransactionType.Credit,
                    Debit = 0,
                    Credit = voucher.Amount,
                    PaidAmount = voucher.Amount,
                    Amount = voucher.Amount,
                    PartyName = resolvedParty,
                    Description = voucher.Description ?? $"سند قبض رقم {voucher.VoucherNumber}",
                    ReferenceType = "ReceiptVoucher",
                    ReferenceId = voucher.Id,
                    TransactionDate = voucher.VoucherDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(counterTx);
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
                    TransactionType = TransactionType.Credit,
                    Debit = 0,
                    Credit = voucher.Amount,
                    PaidAmount = voucher.Amount,
                    Amount = voucher.Amount,
                    PartyName = resolvedParty,
                    Description = voucher.Description ?? $"سند قبض رقم {voucher.VoucherNumber}",
                    ReferenceType = "ReceiptVoucher",
                    ReferenceId = voucher.Id,
                    TransactionDate = voucher.VoucherDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(custTx);
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
                    TransactionType = TransactionType.Debit,
                    Debit = voucher.Amount,
                    Credit = 0,
                    PaidAmount = voucher.Amount,
                    Amount = voucher.Amount,
                    PartyName = resolvedParty,
                    Description = voucher.Description ?? $"سند قبض رقم {voucher.VoucherNumber}",
                    ReferenceType = "ReceiptVoucher",
                    ReferenceId = voucher.Id,
                    TransactionDate = voucher.VoucherDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(suppTx);
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

    public async Task<ReceiptVoucherResponseDto> CancelAsync(int id)
    {
        var voucher = await _context.ReceiptVouchers
            .Include(v => v.Customer)
            .Include(v => v.Supplier)
            .Include(v => v.CounterAccount)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند القبض بالمعرف {id} غير موجود.");

        if (voucher.Status == VoucherStatus.Cancelled)
            throw new BusinessRuleException("سند القبض ملغى بالفعل.");
        if (voucher.Status != VoucherStatus.Confirmed)
            throw new BusinessRuleException("يمكن إلغاء السندات المؤكدة فقط.");

        string resolvedParty = voucher.Customer?.Name ?? voucher.Supplier?.Name ?? voucher.CounterAccount?.Name ?? voucher.PartyName ?? "طرف عام";

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            voucher.Status = VoucherStatus.Cancelled;
            voucher.UpdatedAt = DateTime.UtcNow;

            // Reverse Treasury
            var treasuryTx = new AccountTransaction
            {
                AccountId = voucher.TreasuryId,
                TransactionType = TransactionType.Debit,
                Debit = voucher.Amount,
                Credit = 0,
                PaidAmount = voucher.Amount,
                Amount = voucher.Amount,
                PartyName = resolvedParty,
                Description = $"إلغاء سند قبض رقم {voucher.VoucherNumber}",
                ReferenceType = "ReceiptVoucherCancellation",
                ReferenceId = voucher.Id,
                TransactionDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.AccountTransactions.Add(treasuryTx);

            // Reverse Counter/Customer/Supplier account
            if (voucher.CounterAccountId.HasValue)
            {
                var counterRev = new AccountTransaction
                {
                    AccountId = voucher.CounterAccountId.Value,
                    TransactionType = TransactionType.Debit,
                    Debit = voucher.Amount,
                    Credit = 0,
                    PaidAmount = voucher.Amount,
                    Amount = voucher.Amount,
                    PartyName = resolvedParty,
                    Description = $"إلغاء سند قبض رقم {voucher.VoucherNumber}",
                    ReferenceType = "ReceiptVoucherCancellation",
                    ReferenceId = voucher.Id,
                    TransactionDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(counterRev);
            }
            else if (voucher.CustomerId.HasValue)
            {
                var custAcc = await _context.Accounts.FirstOrDefaultAsync(a => a.CustomerId == voucher.CustomerId.Value);
                if (custAcc != null)
                {
                    var custRev = new AccountTransaction
                    {
                        AccountId = custAcc.Id,
                        TransactionType = TransactionType.Debit,
                        Debit = voucher.Amount,
                        Credit = 0,
                        PaidAmount = voucher.Amount,
                        Amount = voucher.Amount,
                        PartyName = resolvedParty,
                        Description = $"إلغاء سند قبض رقم {voucher.VoucherNumber}",
                        ReferenceType = "ReceiptVoucherCancellation",
                        ReferenceId = voucher.Id,
                        TransactionDate = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.AccountTransactions.Add(custRev);
                }
            }
            else if (voucher.SupplierId.HasValue)
            {
                var suppAcc = await _context.Accounts.FirstOrDefaultAsync(a => a.SupplierId == voucher.SupplierId.Value);
                if (suppAcc != null)
                {
                    var suppRev = new AccountTransaction
                    {
                        AccountId = suppAcc.Id,
                        TransactionType = TransactionType.Credit,
                        Debit = 0,
                        Credit = voucher.Amount,
                        PaidAmount = voucher.Amount,
                        Amount = voucher.Amount,
                        PartyName = resolvedParty,
                        Description = $"إلغاء سند قبض رقم {voucher.VoucherNumber}",
                        ReferenceType = "ReceiptVoucherCancellation",
                        ReferenceId = voucher.Id,
                        TransactionDate = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.AccountTransactions.Add(suppRev);
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
        var voucher = await _context.ReceiptVouchers.FindAsync(id)
            ?? throw new NotFoundException($"سند القبض بالمعرف {id} غير موجود.");

        if (voucher.Status != VoucherStatus.Draft)
            throw new BusinessRuleException("لا يمكن حذف سند قبض غير مسودة.");

        _context.ReceiptVouchers.Remove(voucher);
        await _context.SaveChangesAsync();
    }

    private static void ValidateDto(CreateReceiptVoucherDto dto)
    {
        if (dto.TreasuryId <= 0)
            throw new BusinessRuleException("الخزنة مطلوبة.");
        if (dto.Amount <= 0)
            throw new BusinessRuleException("المبلغ يجب أن يكون أكبر من الصفر.");
    }

    private static ReceiptVoucherResponseDto MapToResponse(ReceiptVoucher v)
    {
        string resolved = v.Customer?.Name ?? v.Supplier?.Name ?? v.CounterAccount?.Name ?? v.PartyName ?? "-";
        return new ReceiptVoucherResponseDto
        {
            Id = v.Id,
            VoucherNumber = v.VoucherNumber,
            VoucherDate = v.VoucherDate,
            TreasuryId = v.TreasuryId,
            TreasuryName = v.Treasury?.Name ?? string.Empty,
            CustomerId = v.CustomerId,
            CustomerName = v.Customer?.Name,
            SupplierId = v.SupplierId,
            SupplierName = v.Supplier?.Name,
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

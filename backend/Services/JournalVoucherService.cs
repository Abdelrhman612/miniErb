using backend.Database;
using backend.DTOs;
using backend.Enums;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class JournalVoucherService : IJournalVoucherService
{
    private readonly AppDbContext _context;

    public JournalVoucherService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<JournalVoucherResponseDto>> GetAllAsync()
    {
        var vouchers = await _context.JournalVouchers
            .Include(v => v.Items)
            .ThenInclude(i => i.Account)
            .OrderByDescending(v => v.VoucherDate)
            .ThenByDescending(v => v.Id)
            .ToListAsync();

        return vouchers.Select(MapToResponse);
    }

    public async Task<JournalVoucherResponseDto> GetByIdAsync(int id)
    {
        var voucher = await _context.JournalVouchers
            .Include(v => v.Items)
            .ThenInclude(i => i.Account)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند القيد بالمعرف {id} غير موجود.");

        return MapToResponse(voucher);
    }

    public async Task<JournalVoucherResponseDto> CreateAsync(CreateJournalVoucherDto dto)
    {
        ValidateDto(dto);

        var voucher = new JournalVoucher
        {
            VoucherNumber = string.IsNullOrWhiteSpace(dto.VoucherNumber) 
                ? $"JV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}" 
                : dto.VoucherNumber.Trim(),
            VoucherDate = dto.VoucherDate == default ? DateTime.UtcNow : dto.VoucherDate,
            Description = dto.Description?.Trim(),
            Status = VoucherStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new JournalVoucherItem
            {
                AccountId = i.AccountId,
                Debit = i.Debit,
                Credit = i.Credit,
                Description = i.Description?.Trim()
            }).ToList()
        };

        _context.JournalVouchers.Add(voucher);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(voucher.Id);
    }

    public async Task<JournalVoucherResponseDto> UpdateAsync(int id, UpdateJournalVoucherDto dto)
    {
        var voucher = await _context.JournalVouchers
            .Include(v => v.Items)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند القيد بالمعرف {id} غير موجود.");

        if (voucher.Status != VoucherStatus.Draft)
            throw new BusinessRuleException("لا يمكن تعديل سند القيد إلا إذا كان في حالة مسودة.");

        ValidateDto(dto);

        voucher.VoucherNumber = string.IsNullOrWhiteSpace(dto.VoucherNumber) ? voucher.VoucherNumber : dto.VoucherNumber.Trim();
        voucher.VoucherDate = dto.VoucherDate == default ? voucher.VoucherDate : dto.VoucherDate;
        voucher.Description = dto.Description?.Trim();
        voucher.UpdatedAt = DateTime.UtcNow;

        voucher.Items.Clear();
        foreach (var i in dto.Items)
        {
            voucher.Items.Add(new JournalVoucherItem
            {
                JournalVoucherId = voucher.Id,
                AccountId = i.AccountId,
                Debit = i.Debit,
                Credit = i.Credit,
                Description = i.Description?.Trim()
            });
        }

        await _context.SaveChangesAsync();
        return await GetByIdAsync(voucher.Id);
    }

    public async Task<JournalVoucherResponseDto> ConfirmAsync(int id)
    {
        var voucher = await _context.JournalVouchers
            .Include(v => v.Items)
            .ThenInclude(i => i.Account)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند القيد بالمعرف {id} غير موجود.");

        if (voucher.Status == VoucherStatus.Confirmed)
            throw new BusinessRuleException("سند القيد مؤكد بالفعل.");
        if (voucher.Status == VoucherStatus.Cancelled)
            throw new BusinessRuleException("لا يمكن تأكيد سند قيد ملغى.");

        decimal totalDebit = voucher.Items.Sum(i => i.Debit);
        decimal totalCredit = voucher.Items.Sum(i => i.Credit);

        if (totalDebit <= 0 || totalCredit <= 0 || Math.Abs(totalDebit - totalCredit) > 0.01m)
            throw new BusinessRuleException("إجمالي المدين يجب أن يساوي إجمالي الدائن.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            voucher.Status = VoucherStatus.Confirmed;
            voucher.UpdatedAt = DateTime.UtcNow;

            foreach (var item in voucher.Items)
            {
                if ((item.Debit > 0 && item.Credit > 0) || (item.Debit == 0 && item.Credit == 0))
                    throw new BusinessRuleException("كل بند يجب أن يكون إما مدين أو دائن وليس كلاهما ولا صفراً.");

                var accountTx = new AccountTransaction
                {
                    AccountId = item.AccountId,
                    TransactionType = item.Debit > 0 ? TransactionType.Debit : TransactionType.Credit,
                    Debit = item.Debit,
                    Credit = item.Credit,
                    PaidAmount = item.Debit > 0 ? item.Debit : item.Credit,
                    Amount = item.Debit > 0 ? item.Debit : item.Credit,
                    Description = item.Description ?? voucher.Description ?? $"سند قيد رقم {voucher.VoucherNumber}",
                    ReferenceType = "JournalVoucher",
                    ReferenceId = voucher.Id,
                    TransactionDate = voucher.VoucherDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(accountTx);
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

    public async Task<JournalVoucherResponseDto> CancelAsync(int id)
    {
        var voucher = await _context.JournalVouchers
            .Include(v => v.Items)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException($"سند القيد بالمعرف {id} غير موجود.");

        if (voucher.Status == VoucherStatus.Cancelled)
            throw new BusinessRuleException("سند القيد ملغى بالفعل.");
        if (voucher.Status != VoucherStatus.Confirmed)
            throw new BusinessRuleException("يمكن إلغاء السندات المؤكدة فقط.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            voucher.Status = VoucherStatus.Cancelled;
            voucher.UpdatedAt = DateTime.UtcNow;

            foreach (var item in voucher.Items)
            {
                // Reversal: swap Debit and Credit
                var revTx = new AccountTransaction
                {
                    AccountId = item.AccountId,
                    TransactionType = item.Credit > 0 ? TransactionType.Debit : TransactionType.Credit,
                    Debit = item.Credit,
                    Credit = item.Debit,
                    PaidAmount = item.Credit > 0 ? item.Credit : item.Debit,
                    Amount = item.Credit > 0 ? item.Credit : item.Debit,
                    Description = $"إلغاء سند قيد رقم {voucher.VoucherNumber}",
                    ReferenceType = "JournalVoucherCancellation",
                    ReferenceId = voucher.Id,
                    TransactionDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(revTx);
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
        var voucher = await _context.JournalVouchers.FindAsync(id)
            ?? throw new NotFoundException($"سند القيد بالمعرف {id} غير موجود.");

        if (voucher.Status != VoucherStatus.Draft)
            throw new BusinessRuleException("لا يمكن حذف سند قيد غير مسودة.");

        _context.JournalVouchers.Remove(voucher);
        await _context.SaveChangesAsync();
    }

    private static void ValidateDto(CreateJournalVoucherDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            throw new BusinessRuleException("سند القيد يجب أن يحتوي على بند واحد على الأقل.");

        decimal debitSum = 0;
        decimal creditSum = 0;

        foreach (var item in dto.Items)
        {
            if (item.AccountId <= 0)
                throw new BusinessRuleException("الحساب مطلوب لكل بند.");
            if (item.Debit < 0 || item.Credit < 0)
                throw new BusinessRuleException("المبالغ لا يمكن أن تكون سالبة.");
            if (item.Debit > 0 && item.Credit > 0)
                throw new BusinessRuleException("البند لا يمكن أن يكون مدين ودائن في نفس الوقت.");
            if (item.Debit == 0 && item.Credit == 0)
                throw new BusinessRuleException("يجب أن يكون للبند مبلغ مدين أو دائن.");

            debitSum += item.Debit;
            creditSum += item.Credit;
        }

        if (Math.Abs(debitSum - creditSum) > 0.01m)
            throw new BusinessRuleException("إجمالي المدين يجب أن يساوي إجمالي الدائن.");
    }

    private static JournalVoucherResponseDto MapToResponse(JournalVoucher v)
    {
        decimal totalDebit = v.Items?.Sum(i => i.Debit) ?? 0;
        decimal totalCredit = v.Items?.Sum(i => i.Credit) ?? 0;

        return new JournalVoucherResponseDto
        {
            Id = v.Id,
            VoucherNumber = v.VoucherNumber,
            VoucherDate = v.VoucherDate,
            Description = v.Description,
            Status = v.Status,
            StatusName = v.Status switch
            {
                VoucherStatus.Draft => "مسودة",
                VoucherStatus.Confirmed => "مؤكد",
                VoucherStatus.Cancelled => "ملغي",
                _ => v.Status.ToString()
            },
            TotalDebit = totalDebit,
            TotalCredit = totalCredit,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt,
            Items = v.Items?.Select(i => new JournalVoucherItemResponseDto
            {
                Id = i.Id,
                AccountId = i.AccountId,
                AccountCode = i.Account?.Code ?? string.Empty,
                AccountName = i.Account?.Name ?? string.Empty,
                Debit = i.Debit,
                Credit = i.Credit,
                Description = i.Description
            }).ToList() ?? new()
        };
    }
}

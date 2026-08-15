using backend.Database;
using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class AccountService : IAccountService
{
    private readonly AppDbContext _context;

    public AccountService(AppDbContext context)
    {
        _context = context;
    }

    public async Task SeedDefaultChartOfAccountsAsync()
    {
        if (await _context.Accounts.AnyAsync(a => a.Code == "1000"))
        {
            // Already seeded, but ensure customers/suppliers/treasuries are linked to correct parent accounts
            await EnsureAccountLinksAsync();
            return;
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Root Accounts
            var assets = new Account { Code = "1000", Name = "الأصول", AccountType = "Asset", IsGroup = true, IsActive = true };
            var liabilities = new Account { Code = "2000", Name = "الالتزامات", AccountType = "Liability", IsGroup = true, IsActive = true };
            var equity = new Account { Code = "3000", Name = "حقوق الملكية", AccountType = "Equity", IsGroup = true, IsActive = true };
            var revenue = new Account { Code = "4000", Name = "الإيرادات", AccountType = "Revenue", IsGroup = true, IsActive = true };
            var expenses = new Account { Code = "5000", Name = "المصروفات", AccountType = "Expense", IsGroup = true, IsActive = true };

            _context.Accounts.AddRange(assets, liabilities, equity, revenue, expenses);
            await _context.SaveChangesAsync();

            // Level 2 & 3 Under Assets
            var currentAssets = new Account { Code = "1100", Name = "الأصول المتداولة", AccountType = "Asset", ParentAccountId = assets.Id, IsGroup = true, IsActive = true };
            _context.Accounts.Add(currentAssets);
            await _context.SaveChangesAsync();

            var treasuriesGroup = new Account { Code = "1110", Name = "الخزائن", AccountType = "Asset", ParentAccountId = currentAssets.Id, IsGroup = true, IsActive = true };
            var customersGroup = new Account { Code = "1120", Name = "العملاء", AccountType = "Asset", ParentAccountId = currentAssets.Id, IsGroup = true, IsActive = true };
            var inventoryAccount = new Account { Code = "1130", Name = "المخزون", AccountType = "Asset", ParentAccountId = currentAssets.Id, IsGroup = false, IsActive = true };
            _context.Accounts.AddRange(treasuriesGroup, customersGroup, inventoryAccount);
            await _context.SaveChangesAsync();

            // Level 2 Under Liabilities
            var suppliersGroup = new Account { Code = "2100", Name = "الموردون", AccountType = "Liability", ParentAccountId = liabilities.Id, IsGroup = true, IsActive = true };
            _context.Accounts.Add(suppliersGroup);
            await _context.SaveChangesAsync();

            // Level 2 Under Equity
            var capital = new Account { Code = "3100", Name = "رأس المال", AccountType = "Equity", ParentAccountId = equity.Id, IsGroup = false, IsActive = true };
            var pnl = new Account { Code = "3200", Name = "الأرباح والخسائر", AccountType = "Equity", ParentAccountId = equity.Id, IsGroup = false, IsActive = true };
            _context.Accounts.AddRange(capital, pnl);
            await _context.SaveChangesAsync();

            // Level 2 Under Revenue
            var salesAccount = new Account { Code = "4100", Name = "المبيعات", AccountType = "Revenue", ParentAccountId = revenue.Id, IsGroup = false, IsActive = true };
            _context.Accounts.Add(salesAccount);
            await _context.SaveChangesAsync();

            // Level 2 Under Expenses
            var opExpenses = new Account { Code = "5100", Name = "مصروفات تشغيلية", AccountType = "Expense", ParentAccountId = expenses.Id, IsGroup = true, IsActive = true };
            var salaries = new Account { Code = "5200", Name = "الرواتب", AccountType = "Expense", ParentAccountId = expenses.Id, IsGroup = false, IsActive = true };
            var adminExpenses = new Account { Code = "5300", Name = "مصروفات إدارية", AccountType = "Expense", ParentAccountId = expenses.Id, IsGroup = false, IsActive = true };
            var employeeAdvances = new Account { Code = "5400", Name = "سلف الموظفين", AccountType = "Asset", ParentAccountId = expenses.Id, IsGroup = false, IsActive = true };
            _context.Accounts.AddRange(opExpenses, salaries, adminExpenses, employeeAdvances);
            await _context.SaveChangesAsync();

            // Level 3 under Operating Expenses
            var electricity = new Account { Code = "510001", Name = "كهرباء", AccountType = "Expense", ParentAccountId = opExpenses.Id, IsGroup = false, IsActive = true };
            var water = new Account { Code = "510002", Name = "مياه", AccountType = "Expense", ParentAccountId = opExpenses.Id, IsGroup = false, IsActive = true };
            var rent = new Account { Code = "510003", Name = "إيجار", AccountType = "Expense", ParentAccountId = opExpenses.Id, IsGroup = false, IsActive = true };
            var internet = new Account { Code = "510004", Name = "إنترنت", AccountType = "Expense", ParentAccountId = opExpenses.Id, IsGroup = false, IsActive = true };
            _context.Accounts.AddRange(electricity, water, rent, internet);
            await _context.SaveChangesAsync();

            await EnsureAccountLinksAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task EnsureAccountLinksAsync()
    {
        var treasuriesGroup = await _context.Accounts.FirstOrDefaultAsync(a => a.Code == "1110");
        var customersGroup = await _context.Accounts.FirstOrDefaultAsync(a => a.Code == "1120");
        var suppliersGroup = await _context.Accounts.FirstOrDefaultAsync(a => a.Code == "2100");

        var accounts = await _context.Accounts.ToListAsync();
        foreach (var acc in accounts)
        {
            if (acc.AccountType == "Treasury" && treasuriesGroup != null && acc.ParentAccountId == null)
            {
                acc.ParentAccountId = treasuriesGroup.Id;
            }
            else if (acc.CustomerId.HasValue && customersGroup != null && acc.ParentAccountId == null)
            {
                acc.ParentAccountId = customersGroup.Id;
            }
            else if (acc.SupplierId.HasValue && suppliersGroup != null && acc.ParentAccountId == null)
            {
                acc.ParentAccountId = suppliersGroup.Id;
            }
        }
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<AccountResponseDto>> GetAllAsync()
    {
        await SeedDefaultChartOfAccountsAsync();
        var accounts = await _context.Accounts
            .Include(a => a.ParentAccount)
            .Include(a => a.Transactions)
            .OrderBy(a => a.Code)
            .ToListAsync();

        return accounts.Select(MapToResponse);
    }

    public async Task<IEnumerable<AccountNodeDto>> GetTreeAsync()
    {
        await SeedDefaultChartOfAccountsAsync();
        var accounts = await _context.Accounts
            .Include(a => a.Transactions)
            .OrderBy(a => a.Code)
            .ToListAsync();

        var lookup = accounts.ToDictionary(a => a.Id, a => new AccountNodeDto
        {
            Id = a.Id,
            Code = a.Code,
            Name = a.Name,
            AccountType = a.AccountType,
            ParentAccountId = a.ParentAccountId,
            IsGroup = a.IsGroup,
            IsActive = a.IsActive,
            Balance = CalculateBalance(a)
        });

        var roots = new List<AccountNodeDto>();
        foreach (var acc in accounts)
        {
            var node = lookup[acc.Id];
            if (acc.ParentAccountId.HasValue && lookup.TryGetValue(acc.ParentAccountId.Value, out var parentNode))
            {
                parentNode.Children.Add(node);
            }
            else
            {
                roots.Add(node);
            }
        }

        return roots;
    }

    public async Task<AccountResponseDto> GetByIdAsync(int id)
    {
        await SeedDefaultChartOfAccountsAsync();
        var account = await _context.Accounts
            .Include(a => a.ParentAccount)
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new NotFoundException($"الحساب بالمعرف {id} غير موجود.");

        return MapToResponse(account);
    }

    public async Task<IEnumerable<AccountResponseDto>> GetChildrenAsync(int id)
    {
        var children = await _context.Accounts
            .Include(a => a.ParentAccount)
            .Include(a => a.Transactions)
            .Where(a => a.ParentAccountId == id)
            .OrderBy(a => a.Code)
            .ToListAsync();

        return children.Select(MapToResponse);
    }

    public async Task<IEnumerable<AccountTransactionResponseDto>> GetTransactionsAsync(int id, DateTime? fromDate, DateTime? toDate)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new NotFoundException($"الحساب بالمعرف {id} غير موجود.");

        var query = _context.AccountTransactions
            .Where(at => at.AccountId == id);

        if (fromDate.HasValue)
        {
            query = query.Where(at => at.TransactionDate >= fromDate.Value.Date);
        }
        if (toDate.HasValue)
        {
            var endDate = toDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(at => at.TransactionDate <= endDate);
        }

        var transactions = await query
            .OrderBy(at => at.TransactionDate)
            .ThenBy(at => at.Id)
            .ToListAsync();

        decimal runningBalance = 0;
        if (fromDate.HasValue)
        {
            var priorTransactions = await _context.AccountTransactions
                .Where(at => at.AccountId == id && at.TransactionDate < fromDate.Value.Date)
                .ToListAsync();

            foreach (var tx in priorTransactions)
            {
                var d = tx.Debit > 0 ? tx.Debit : (tx.TransactionType == TransactionType.Debit ? tx.Amount : 0);
                var c = tx.Credit > 0 ? tx.Credit : (tx.TransactionType == TransactionType.Credit ? tx.Amount : 0);
                runningBalance += (d - c);
            }
        }

        var result = new List<AccountTransactionResponseDto>();
        foreach (var tx in transactions)
        {
            var d = tx.Debit > 0 ? tx.Debit : (tx.TransactionType == TransactionType.Debit ? tx.Amount : 0);
            var c = tx.Credit > 0 ? tx.Credit : (tx.TransactionType == TransactionType.Credit ? tx.Amount : 0);
            runningBalance += (d - c);

            result.Add(new AccountTransactionResponseDto
            {
                Id = tx.Id,
                AccountId = tx.AccountId,
                TransactionType = tx.TransactionType,
                TransactionTypeName = tx.TransactionType == TransactionType.Debit ? "مدين" : "دائن",
                Amount = tx.Amount,
                Debit = d,
                Credit = c,
                PaidAmount = tx.PaidAmount,
                Description = tx.Description,
                PartyName = tx.PartyName,
                ReferenceType = tx.ReferenceType,
                ReferenceId = tx.ReferenceId,
                RunningBalance = runningBalance,
                TransactionDate = tx.TransactionDate,
                CreatedAt = tx.CreatedAt
            });
        }

        return result.OrderByDescending(t => t.TransactionDate).ThenByDescending(t => t.Id);
    }

    public async Task<AccountResponseDto> CreateAsync(CreateAccountDto dto)
    {
        ValidateDto(dto);

        var codeExists = await _context.Accounts.AnyAsync(a => a.Code == dto.Code.Trim());
        if (codeExists)
            throw new BusinessRuleException($"كود الحساب '{dto.Code}' مستخدم بالفعل.");

        if (dto.ParentAccountId.HasValue)
        {
            var parent = await _context.Accounts.FindAsync(dto.ParentAccountId.Value)
                ?? throw new NotFoundException("الحساب الأب غير موجود.");
            if (!parent.IsGroup)
                throw new BusinessRuleException("لا يمكن اختيار حساب فرعي (ليس مجموعة) كحساب أب.");
        }

        var account = new Account
        {
            Code = dto.Code.Trim(),
            Name = dto.Name.Trim(),
            AccountType = dto.AccountType.Trim(),
            ParentAccountId = dto.ParentAccountId,
            IsGroup = dto.IsGroup,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(account.Id);
    }

    public async Task<AccountResponseDto> UpdateAsync(int id, UpdateAccountDto dto)
    {
        var account = await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new NotFoundException($"الحساب بالمعرف {id} غير موجود.");

        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessRuleException("اسم الحساب مطلوب.");

        if (dto.ParentAccountId.HasValue)
        {
            if (dto.ParentAccountId.Value == id)
                throw new BusinessRuleException("لا يمكن جعل الحساب أب لنفسه.");

            var parent = await _context.Accounts.FindAsync(dto.ParentAccountId.Value)
                ?? throw new NotFoundException("الحساب الأب غير موجود.");

            // Check circular
            int? currentParent = parent.ParentAccountId;
            while (currentParent.HasValue)
            {
                if (currentParent.Value == id)
                    throw new BusinessRuleException("لا يمكن إنشاء هرمية دائرية للحسابات.");
                var pAccount = await _context.Accounts.FindAsync(currentParent.Value);
                currentParent = pAccount?.ParentAccountId;
            }
        }

        if (account.Transactions.Any() && account.IsGroup != dto.IsGroup)
        {
            throw new BusinessRuleException("لا يمكن تغيير طبيعة الحساب (مجموعة/فرعي) لوجود حركات مالية مسجلة عليه.");
        }

        account.Name = dto.Name.Trim();
        account.AccountType = dto.AccountType.Trim();
        account.ParentAccountId = dto.ParentAccountId;
        account.IsGroup = dto.IsGroup;
        account.IsActive = dto.IsActive;
        account.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(account.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var account = await _context.Accounts
            .Include(a => a.Transactions)
            .Include(a => a.Children)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new NotFoundException($"الحساب بالمعرف {id} غير موجود.");

        if (account.Children.Any())
            throw new BusinessRuleException("لا يمكن حذف حساب يحتوي على حسابات فرعية.");

        if (account.Transactions.Any())
        {
            account.IsActive = false;
            account.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return;
        }

        _context.Accounts.Remove(account);
        await _context.SaveChangesAsync();
    }

    private static decimal CalculateBalance(Account account)
    {
        if (account.Transactions == null || !account.Transactions.Any()) return 0;
        var debits = account.Transactions.Sum(t => t.Debit > 0 ? t.Debit : (t.TransactionType == TransactionType.Debit ? t.Amount : 0));
        var credits = account.Transactions.Sum(t => t.Credit > 0 ? t.Credit : (t.TransactionType == TransactionType.Credit ? t.Amount : 0));
        // For asset/expense normal debit balance: debits - credits. For liability/equity/revenue normal credit balance: credits - debits.
        // But let's return general balance or standard asset balance (debits - credits) or credits - debits based on type.
        if (account.AccountType == "Liability" || account.AccountType == "Equity" || account.AccountType == "Revenue" || account.AccountType == "Supplier")
        {
            return credits - debits;
        }
        return debits - credits;
    }

    private static void ValidateDto(CreateAccountDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
            throw new BusinessRuleException("كود الحساب مطلوب.");
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessRuleException("اسم الحساب مطلوب.");
        if (string.IsNullOrWhiteSpace(dto.AccountType))
            throw new BusinessRuleException("نوع الحساب مطلوب.");
    }

    private static AccountResponseDto MapToResponse(Account a) => new()
    {
        Id = a.Id,
        Code = a.Code,
        Name = a.Name,
        AccountType = a.AccountType,
        ParentAccountId = a.ParentAccountId,
        ParentAccountName = a.ParentAccount?.Name,
        IsGroup = a.IsGroup,
        IsActive = a.IsActive,
        Balance = CalculateBalance(a),
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };
}

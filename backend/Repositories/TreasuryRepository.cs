using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class TreasuryRepository : ITreasuryRepository
{
    private readonly AppDbContext _context;

    public TreasuryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Account>> GetAllTreasuriesAsync()
    {
        return await _context.Accounts
            .Include(a => a.Transactions)
            .Where(a => a.AccountType == "Treasury")
            .OrderBy(a => a.Id)
            .ToListAsync();
    }

    public async Task<Account?> GetByIdAsync(int id)
    {
        return await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Id == id && a.AccountType == "Treasury");
    }

    public async Task<Account?> GetByCodeAsync(string code)
    {
        return await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Code == code && a.AccountType == "Treasury");
    }

    public async Task<Account> CreateAsync(Account account, AccountTransaction? initialTransaction)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            if (initialTransaction != null)
            {
                initialTransaction.AccountId = account.Id;
                _context.AccountTransactions.Add(initialTransaction);
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return await GetByIdAsync(account.Id) ?? account;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<AccountTransaction>> GetTransactionsAsync(int accountId)
    {
        return await _context.AccountTransactions
            .Where(at => at.AccountId == accountId)
            .OrderByDescending(at => at.TransactionDate)
            .ThenByDescending(at => at.Id)
            .ToListAsync();
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null)
    {
        var query = _context.Accounts.Where(a => a.Code == code);
        if (excludeId.HasValue)
        {
            query = query.Where(a => a.Id != excludeId.Value);
        }
        return await query.AnyAsync();
    }
}

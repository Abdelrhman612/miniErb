using backend.Models;

namespace backend.Interfaces;

public interface ITreasuryRepository
{
    Task<IEnumerable<Account>> GetAllTreasuriesAsync();
    Task<Account?> GetByIdAsync(int id);
    Task<Account?> GetByCodeAsync(string code);
    Task<Account> CreateAsync(Account account, AccountTransaction? initialTransaction);
    Task<IEnumerable<AccountTransaction>> GetTransactionsAsync(int accountId);
    Task<bool> CodeExistsAsync(string code, int? excludeId = null);
}

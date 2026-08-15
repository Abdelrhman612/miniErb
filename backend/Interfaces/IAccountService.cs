using backend.DTOs;

namespace backend.Interfaces;

public interface IAccountService
{
    Task<IEnumerable<AccountResponseDto>> GetAllAsync();
    Task<IEnumerable<AccountNodeDto>> GetTreeAsync();
    Task<AccountResponseDto> GetByIdAsync(int id);
    Task<IEnumerable<AccountResponseDto>> GetChildrenAsync(int id);
    Task<IEnumerable<AccountTransactionResponseDto>> GetTransactionsAsync(int id, DateTime? fromDate, DateTime? toDate);
    Task<AccountResponseDto> CreateAsync(CreateAccountDto dto);
    Task<AccountResponseDto> UpdateAsync(int id, UpdateAccountDto dto);
    Task DeleteAsync(int id);
    Task SeedDefaultChartOfAccountsAsync();
}

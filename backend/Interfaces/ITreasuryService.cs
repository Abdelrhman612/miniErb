using backend.DTOs;

namespace backend.Interfaces;

public interface ITreasuryService
{
    Task<IEnumerable<TreasuryResponseDto>> GetAllAsync();
    Task<TreasuryResponseDto> GetByIdAsync(int id);
    Task<IEnumerable<AccountTransactionResponseDto>> GetTransactionsAsync(int id);
    Task<TreasuryResponseDto> CreateAsync(CreateTreasuryDto dto);
}

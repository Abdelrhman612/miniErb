using backend.DTOs;

namespace backend.Interfaces;

public interface ISupplierService
{
    Task<IEnumerable<SupplierResponseDto>> GetAllAsync();
    Task<SupplierResponseDto> GetByIdAsync(int id);
    Task<SupplierResponseDto> CreateAsync(CreateSupplierDto dto);
    Task<SupplierResponseDto> UpdateAsync(int id, UpdateSupplierDto dto);
    Task DeleteAsync(int id);
    Task HardDeleteAsync(int id);
    Task<SupplierAccountResponseDto> GetAccountAsync(int supplierId);
    Task<IEnumerable<AccountTransactionResponseDto>> GetAccountTransactionsAsync(int supplierId, DateTime? fromDate, DateTime? toDate);
}

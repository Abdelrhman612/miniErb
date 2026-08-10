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
}

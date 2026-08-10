using backend.DTOs;

namespace backend.Interfaces;

public interface IWarehouseService
{
    Task<IEnumerable<WarehouseResponseDto>> GetAllAsync();
    Task<WarehouseResponseDto> GetByIdAsync(int id);
    Task<WarehouseResponseDto> CreateAsync(CreateWarehouseDto dto);
    Task<WarehouseResponseDto> UpdateAsync(int id, UpdateWarehouseDto dto);
    Task DeleteAsync(int id);
}

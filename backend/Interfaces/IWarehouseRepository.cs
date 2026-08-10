using backend.Models;

namespace backend.Interfaces;

public interface IWarehouseRepository
{
    Task<IEnumerable<Warehouse>> GetAllAsync();
    Task<Warehouse?> GetByIdAsync(int id);
    Task<Warehouse?> GetByCodeAsync(string code);
    Task<Warehouse> CreateAsync(Warehouse warehouse);
    Task<Warehouse> UpdateAsync(Warehouse warehouse);
    Task DeleteAsync(Warehouse warehouse);
}

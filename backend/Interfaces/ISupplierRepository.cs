using backend.Models;

namespace backend.Interfaces;

public interface ISupplierRepository
{
    Task<IEnumerable<Supplier>> GetAllAsync();
    Task<Supplier?> GetByIdAsync(int id);
    Task<Supplier> CreateAsync(Supplier supplier);
    Task<Supplier> UpdateAsync(Supplier supplier);
    Task DeleteAsync(Supplier supplier);
}

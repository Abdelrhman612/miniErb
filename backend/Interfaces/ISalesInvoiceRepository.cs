using backend.Models;

namespace backend.Interfaces;

public interface ISalesInvoiceRepository
{
    Task<IEnumerable<SalesInvoice>> GetAllAsync();
    Task<SalesInvoice?> GetByIdAsync(int id);
    Task<SalesInvoice> CreateAsync(SalesInvoice invoice);
    Task<SalesInvoice> UpdateAsync(SalesInvoice invoice);
    Task DeleteAsync(SalesInvoice invoice);
    Task<bool> CustomerExistsAndActiveAsync(int customerId);
    Task<bool> WarehouseExistsAndActiveAsync(int warehouseId);
    Task<bool> ProductExistsAndActiveAsync(int productId);
}

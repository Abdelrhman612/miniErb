using backend.Models;

namespace backend.Interfaces;

public interface IPurchaseInvoiceRepository
{
    Task<IEnumerable<PurchaseInvoice>> GetAllAsync();
    Task<PurchaseInvoice?> GetByIdAsync(int id);
    Task<PurchaseInvoice> CreateAsync(PurchaseInvoice invoice);
    Task<PurchaseInvoice> UpdateAsync(PurchaseInvoice invoice);
    Task DeleteAsync(PurchaseInvoice invoice);
    Task<bool> SupplierExistsAsync(int supplierId);
    Task<bool> WarehouseExistsAsync(int warehouseId);
    Task<bool> ProductExistsAsync(int productId);
}

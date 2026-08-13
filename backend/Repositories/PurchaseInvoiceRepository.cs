using backend.Database;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class PurchaseInvoiceRepository : IPurchaseInvoiceRepository
{
    private readonly AppDbContext _context;

    public PurchaseInvoiceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PurchaseInvoice>> GetAllAsync()
    {
        return await _context.PurchaseInvoices
            .Include(pi => pi.Supplier)
            .Include(pi => pi.Warehouse)
            .Include(pi => pi.Items)
                .ThenInclude(item => item.Product)
            .OrderByDescending(pi => pi.InvoiceDate)
            .ThenByDescending(pi => pi.Id)
            .ToListAsync();
    }

    public async Task<PurchaseInvoice?> GetByIdAsync(int id)
    {
        return await _context.PurchaseInvoices
            .Include(pi => pi.Supplier)
            .Include(pi => pi.Warehouse)
            .Include(pi => pi.Items)
                .ThenInclude(item => item.Product)
            .FirstOrDefaultAsync(pi => pi.Id == id);
    }

    public async Task<PurchaseInvoice> CreateAsync(PurchaseInvoice invoice)
    {
        _context.PurchaseInvoices.Add(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<PurchaseInvoice> UpdateAsync(PurchaseInvoice invoice)
    {
        _context.PurchaseInvoices.Update(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task DeleteAsync(PurchaseInvoice invoice)
    {
        _context.PurchaseInvoices.Remove(invoice);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> SupplierExistsAsync(int supplierId)
    {
        return await _context.Suppliers.AnyAsync(s => s.Id == supplierId);
    }

    public async Task<bool> WarehouseExistsAsync(int warehouseId)
    {
        return await _context.Warehouses.AnyAsync(w => w.Id == warehouseId);
    }

    public async Task<bool> ProductExistsAsync(int productId)
    {
        return await _context.Products.AnyAsync(p => p.Id == productId);
    }
}

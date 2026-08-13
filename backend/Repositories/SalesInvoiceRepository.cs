using backend.Database;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class SalesInvoiceRepository : ISalesInvoiceRepository
{
    private readonly AppDbContext _context;

    public SalesInvoiceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SalesInvoice>> GetAllAsync()
    {
        return await _context.SalesInvoices
            .Include(si => si.Customer)
            .Include(si => si.Warehouse)
            .Include(si => si.Items)
                .ThenInclude(item => item.Product)
            .OrderByDescending(si => si.InvoiceDate)
            .ThenByDescending(si => si.Id)
            .ToListAsync();
    }

    public async Task<SalesInvoice?> GetByIdAsync(int id)
    {
        return await _context.SalesInvoices
            .Include(si => si.Customer)
            .Include(si => si.Warehouse)
            .Include(si => si.Items)
                .ThenInclude(item => item.Product)
            .FirstOrDefaultAsync(si => si.Id == id);
    }

    public async Task<SalesInvoice> CreateAsync(SalesInvoice invoice)
    {
        _context.SalesInvoices.Add(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<SalesInvoice> UpdateAsync(SalesInvoice invoice)
    {
        _context.SalesInvoices.Update(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task DeleteAsync(SalesInvoice invoice)
    {
        _context.SalesInvoices.Remove(invoice);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> CustomerExistsAndActiveAsync(int customerId)
    {
        return await _context.Customers.AnyAsync(c => c.Id == customerId && c.IsActive);
    }

    public async Task<bool> WarehouseExistsAndActiveAsync(int warehouseId)
    {
        return await _context.Warehouses.AnyAsync(w => w.Id == warehouseId && w.IsActive);
    }

    public async Task<bool> ProductExistsAndActiveAsync(int productId)
    {
        return await _context.Products.AnyAsync(p => p.Id == productId && p.IsActive);
    }
}

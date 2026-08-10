using backend.Database;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class WarehouseRepository : IWarehouseRepository
{
    private readonly AppDbContext _context;

    public WarehouseRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Warehouse>> GetAllAsync()
    {
        return await _context.Warehouses
            .OrderBy(w => w.Name)
            .ToListAsync();
    }

    public async Task<Warehouse?> GetByIdAsync(int id)
    {
        return await _context.Warehouses.FindAsync(id);
    }

    public async Task<Warehouse?> GetByCodeAsync(string code)
    {
        return await _context.Warehouses
            .FirstOrDefaultAsync(w => w.Code == code);
    }

    public async Task<Warehouse> CreateAsync(Warehouse warehouse)
    {
        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();
        return warehouse;
    }

    public async Task<Warehouse> UpdateAsync(Warehouse warehouse)
    {
        _context.Warehouses.Update(warehouse);
        await _context.SaveChangesAsync();
        return warehouse;
    }

    public async Task DeleteAsync(Warehouse warehouse)
    {
        _context.Warehouses.Remove(warehouse);
        await _context.SaveChangesAsync();
    }
}

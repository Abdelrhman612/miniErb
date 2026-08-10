using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;

namespace backend.Services;

public class WarehouseService : IWarehouseService
{
    private readonly IWarehouseRepository _warehouseRepository;

    public WarehouseService(IWarehouseRepository warehouseRepository)
    {
        _warehouseRepository = warehouseRepository;
    }

    public async Task<IEnumerable<WarehouseResponseDto>> GetAllAsync()
    {
        var warehouses = await _warehouseRepository.GetAllAsync();
        return warehouses.Select(MapToResponse);
    }

    public async Task<WarehouseResponseDto> GetByIdAsync(int id)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المخزن بالمعرف {id} غير موجود.");

        return MapToResponse(warehouse);
    }

    public async Task<WarehouseResponseDto> CreateAsync(CreateWarehouseDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
            throw new BusinessRuleException("كود المخزن مطلوب.");
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessRuleException("اسم المخزن مطلوب.");

        var existing = await _warehouseRepository.GetByCodeAsync(dto.Code.Trim());
        if (existing is not null)
            throw new BusinessRuleException($"يوجد مخزن بالكود '{dto.Code}' بالفعل.");

        var warehouse = new Warehouse
        {
            Code = dto.Code.Trim(),
            Name = dto.Name.Trim(),
            Address = dto.Address?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _warehouseRepository.CreateAsync(warehouse);
        return MapToResponse(created);
    }

    public async Task<WarehouseResponseDto> UpdateAsync(int id, UpdateWarehouseDto dto)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المخزن بالمعرف {id} غير موجود.");

        if (string.IsNullOrWhiteSpace(dto.Code))
            throw new BusinessRuleException("كود المخزن مطلوب.");
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessRuleException("اسم المخزن مطلوب.");

        var existing = await _warehouseRepository.GetByCodeAsync(dto.Code.Trim());
        if (existing is not null && existing.Id != id)
            throw new BusinessRuleException($"يوجد مخزن بالكود '{dto.Code}' بالفعل.");

        warehouse.Code = dto.Code.Trim();
        warehouse.Name = dto.Name.Trim();
        warehouse.Address = dto.Address?.Trim();
        warehouse.IsActive = dto.IsActive;

        var updated = await _warehouseRepository.UpdateAsync(warehouse);
        return MapToResponse(updated);
    }

    public async Task DeleteAsync(int id)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المخزن بالمعرف {id} غير موجود.");

        // Soft delete
        warehouse.IsActive = false;
        await _warehouseRepository.UpdateAsync(warehouse);
    }

    private static WarehouseResponseDto MapToResponse(Warehouse w) => new()
    {
        Id = w.Id,
        Code = w.Code,
        Name = w.Name,
        Address = w.Address,
        IsActive = w.IsActive,
        CreatedAt = w.CreatedAt
    };
}

using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;

namespace backend.Services;

public class SupplierService : ISupplierService
{
    private readonly ISupplierRepository _supplierRepository;

    public SupplierService(ISupplierRepository supplierRepository)
    {
        _supplierRepository = supplierRepository;
    }

    public async Task<IEnumerable<SupplierResponseDto>> GetAllAsync()
    {
        var suppliers = await _supplierRepository.GetAllAsync();
        return suppliers.Select(MapToResponse);
    }

    public async Task<SupplierResponseDto> GetByIdAsync(int id)
    {
        var supplier = await _supplierRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المورد بالمعرف {id} غير موجود.");

        return MapToResponse(supplier);
    }

    public async Task<SupplierResponseDto> CreateAsync(CreateSupplierDto dto)
    {
        Validate(dto.Name, dto.Phone);

        var supplier = new Supplier
        {
            Name = dto.Name.Trim(),
            Phone = dto.Phone.Trim(),
            Phone2 = dto.Phone2?.Trim(),
            Address = dto.Address?.Trim(),
            Notes = dto.Notes?.Trim(),
            OpeningBalance = dto.OpeningBalance,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _supplierRepository.CreateAsync(supplier);
        return MapToResponse(created);
    }

    public async Task<SupplierResponseDto> UpdateAsync(int id, UpdateSupplierDto dto)
    {
        var supplier = await _supplierRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المورد بالمعرف {id} غير موجود.");

        Validate(dto.Name, dto.Phone);

        supplier.Name = dto.Name.Trim();
        supplier.Phone = dto.Phone.Trim();
        supplier.Phone2 = dto.Phone2?.Trim();
        supplier.Address = dto.Address?.Trim();
        supplier.Notes = dto.Notes?.Trim();
        supplier.OpeningBalance = dto.OpeningBalance;
        supplier.IsActive = dto.IsActive;
        supplier.UpdatedAt = DateTime.UtcNow;

        var updated = await _supplierRepository.UpdateAsync(supplier);
        return MapToResponse(updated);
    }

    public async Task DeleteAsync(int id)
    {
        var supplier = await _supplierRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المورد بالمعرف {id} غير موجود.");

        supplier.IsActive = false;
        supplier.UpdatedAt = DateTime.UtcNow;
        await _supplierRepository.UpdateAsync(supplier);
    }

    public async Task HardDeleteAsync(int id)
    {
        var supplier = await _supplierRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المورد بالمعرف {id} غير موجود.");

        await _supplierRepository.DeleteAsync(supplier);
    }

    private static void Validate(string name, string phone)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleException("اسم المورد مطلوب.");

        if (string.IsNullOrWhiteSpace(phone))
            throw new BusinessRuleException("رقم الهاتف مطلوب.");
    }

    private static SupplierResponseDto MapToResponse(Supplier supplier) => new()
    {
        Id = supplier.Id,
        Name = supplier.Name,
        Phone = supplier.Phone,
        Phone2 = supplier.Phone2,
        Address = supplier.Address,
        Notes = supplier.Notes,
        OpeningBalance = supplier.OpeningBalance,
        IsActive = supplier.IsActive,
        CreatedAt = supplier.CreatedAt,
        UpdatedAt = supplier.UpdatedAt
    };
}

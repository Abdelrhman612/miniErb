using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;

namespace backend.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<IEnumerable<ProductResponseDto>> GetAllAsync()
    {
        var products = await _productRepository.GetAllAsync();
        return products.Select(MapToResponse);
    }

    public async Task<ProductResponseDto> GetByIdAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المنتج بالمعرف {id} غير موجود.");

        return MapToResponse(product);
    }

    public async Task<ProductResponseDto> CreateAsync(CreateProductDto dto)
    {
        ValidateProductDto(dto.Code, dto.Name, dto.PurchasePrice, dto.SellingPrice, dto.MinimumStock, dto.Unit);

        var existingCode = await _productRepository.GetByCodeAsync(dto.Code.Trim());
        if (existingCode is not null)
            throw new BusinessRuleException($"يوجد منتج بالكود '{dto.Code}' بالفعل.");

        var categoryExists = await _productRepository.CategoryExistsAsync(dto.CategoryId);
        if (!categoryExists)
            throw new BusinessRuleException($"الفئة بالمعرف {dto.CategoryId} غير موجودة.");

        var product = new Product
        {
            Code = dto.Code.Trim(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Barcode = dto.Barcode?.Trim(),
            PurchasePrice = dto.PurchasePrice,
            SellingPrice = dto.SellingPrice,
            MinimumStock = dto.MinimumStock,
            Unit = dto.Unit.Trim(),
            CategoryId = dto.CategoryId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _productRepository.CreateAsync(product);
        // Reload with category navigation
        var result = await _productRepository.GetByIdAsync(created.Id);
        return MapToResponse(result!);
    }

    public async Task<ProductResponseDto> UpdateAsync(int id, UpdateProductDto dto)
    {
        var product = await _productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المنتج بالمعرف {id} غير موجود.");

        ValidateProductDto(dto.Code, dto.Name, dto.PurchasePrice, dto.SellingPrice, dto.MinimumStock, dto.Unit);

        // Check duplicate code (excluding self)
        var existingCode = await _productRepository.GetByCodeAsync(dto.Code.Trim());
        if (existingCode is not null && existingCode.Id != id)
            throw new BusinessRuleException($"يوجد منتج بالكود '{dto.Code}' بالفعل.");

        var categoryExists = await _productRepository.CategoryExistsAsync(dto.CategoryId);
        if (!categoryExists)
            throw new BusinessRuleException($"الفئة بالمعرف {dto.CategoryId} غير موجودة.");

        product.Code = dto.Code.Trim();
        product.Name = dto.Name.Trim();
        product.Description = dto.Description?.Trim();
        product.Barcode = dto.Barcode?.Trim();
        product.PurchasePrice = dto.PurchasePrice;
        product.SellingPrice = dto.SellingPrice;
        product.MinimumStock = dto.MinimumStock;
        product.Unit = dto.Unit.Trim();
        product.CategoryId = dto.CategoryId;
        product.IsActive = dto.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepository.UpdateAsync(product);
        var result = await _productRepository.GetByIdAsync(product.Id);
        return MapToResponse(result!);
    }

    public async Task DeleteAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المنتج بالمعرف {id} غير موجود.");

        // Soft delete: deactivate instead of hard delete
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _productRepository.UpdateAsync(product);
    }

    public async Task HardDeleteAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المنتج بالمعرف {id} غير موجود.");

        await _productRepository.DeleteAsync(product);
    }

    private static void ValidateProductDto(
        string code, string name, decimal purchasePrice,
        decimal sellingPrice, decimal minimumStock, string unit)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleException("كود المنتج مطلوب.");
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleException("اسم المنتج مطلوب.");
        if (string.IsNullOrWhiteSpace(unit))
            throw new BusinessRuleException("وحدة القياس مطلوبة.");
        if (purchasePrice < 0)
            throw new BusinessRuleException("سعر الشراء لا يمكن أن يكون سالباً.");
        if (sellingPrice < 0)
            throw new BusinessRuleException("سعر البيع لا يمكن أن يكون سالباً.");
        if (minimumStock < 0)
            throw new BusinessRuleException("الحد الأدنى للمخزون لا يمكن أن يكون سالباً.");
    }

    private static ProductResponseDto MapToResponse(Product p) => new()
    {
        Id = p.Id,
        Code = p.Code,
        Name = p.Name,
        Description = p.Description,
        Barcode = p.Barcode,
        PurchasePrice = p.PurchasePrice,
        SellingPrice = p.SellingPrice,
        MinimumStock = p.MinimumStock,
        Unit = p.Unit,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? string.Empty,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}

using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;

namespace backend.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<IEnumerable<CategoryResponseDto>> GetAllAsync()
    {
        var categories = await _categoryRepository.GetAllAsync();
        return categories.Select(MapToResponse);
    }

    public async Task<CategoryResponseDto> GetByIdAsync(int id)
    {
        var category = await _categoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"الفئة بالمعرف {id} غير موجودة.");

        return MapToResponse(category);
    }

    public async Task<CategoryResponseDto> CreateAsync(CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessRuleException("اسم الفئة مطلوب.");

        var existing = await _categoryRepository.GetByNameAsync(dto.Name.Trim());
        if (existing is not null)
            throw new BusinessRuleException($"توجد فئة بالاسم '{dto.Name}' بالفعل.");

        var category = new Category
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _categoryRepository.CreateAsync(category);
        return MapToResponse(created);
    }

    public async Task<CategoryResponseDto> UpdateAsync(int id, UpdateCategoryDto dto)
    {
        var category = await _categoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"الفئة بالمعرف {id} غير موجودة.");

        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessRuleException("اسم الفئة مطلوب.");

        // Check duplicate name (excluding self)
        var existing = await _categoryRepository.GetByNameAsync(dto.Name.Trim());
        if (existing is not null && existing.Id != id)
            throw new BusinessRuleException($"توجد فئة بالاسم '{dto.Name}' بالفعل.");

        category.Name = dto.Name.Trim();
        category.Description = dto.Description?.Trim();
        category.IsActive = dto.IsActive;

        var updated = await _categoryRepository.UpdateAsync(category);
        return MapToResponse(updated);
    }

    public async Task DeleteAsync(int id)
    {
        var category = await _categoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"الفئة بالمعرف {id} غير موجودة.");

        var hasProducts = await _categoryRepository.HasProductsAsync(id);
        if (hasProducts)
            throw new ConflictException("لا يمكن حذف الفئة لأنها مرتبطة بمنتجات. يرجى إلغاء تفعيلها بدلاً من حذفها.");

        await _categoryRepository.DeleteAsync(category);
    }

    private static CategoryResponseDto MapToResponse(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        IsActive = c.IsActive,
        CreatedAt = c.CreatedAt
    };
}

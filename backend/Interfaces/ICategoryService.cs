using backend.DTOs;

namespace backend.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryResponseDto>> GetAllAsync();
    Task<CategoryResponseDto> GetByIdAsync(int id);
    Task<CategoryResponseDto> CreateAsync(CreateCategoryDto dto);
    Task<CategoryResponseDto> UpdateAsync(int id, UpdateCategoryDto dto);
    Task DeleteAsync(int id);
}

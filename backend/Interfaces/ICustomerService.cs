using backend.DTOs;

namespace backend.Interfaces;

public interface ICustomerService
{
    Task<IEnumerable<CustomerResponseDto>> GetAllAsync();
    Task<CustomerResponseDto> GetByIdAsync(int id);
    Task<CustomerResponseDto> CreateAsync(CreateCustomerDto dto);
    Task<CustomerResponseDto> UpdateAsync(int id, UpdateCustomerDto dto);
    Task DeleteAsync(int id);
    Task HardDeleteAsync(int id);
}

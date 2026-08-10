using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;

namespace backend.Services;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _customerRepository;

    public CustomerService(ICustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<IEnumerable<CustomerResponseDto>> GetAllAsync()
    {
        var customers = await _customerRepository.GetAllAsync();
        return customers.Select(MapToResponse);
    }

    public async Task<CustomerResponseDto> GetByIdAsync(int id)
    {
        var customer = await _customerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"العميل بالمعرف {id} غير موجود.");

        return MapToResponse(customer);
    }

    public async Task<CustomerResponseDto> CreateAsync(CreateCustomerDto dto)
    {
        Validate(dto.Name, dto.Phone);

        var customer = new Customer
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

        var created = await _customerRepository.CreateAsync(customer);
        return MapToResponse(created);
    }

    public async Task<CustomerResponseDto> UpdateAsync(int id, UpdateCustomerDto dto)
    {
        var customer = await _customerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"العميل بالمعرف {id} غير موجود.");

        Validate(dto.Name, dto.Phone);

        customer.Name = dto.Name.Trim();
        customer.Phone = dto.Phone.Trim();
        customer.Phone2 = dto.Phone2?.Trim();
        customer.Address = dto.Address?.Trim();
        customer.Notes = dto.Notes?.Trim();
        customer.OpeningBalance = dto.OpeningBalance;
        customer.IsActive = dto.IsActive;
        customer.UpdatedAt = DateTime.UtcNow;

        var updated = await _customerRepository.UpdateAsync(customer);
        return MapToResponse(updated);
    }

    public async Task DeleteAsync(int id)
    {
        var customer = await _customerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"العميل بالمعرف {id} غير موجود.");

        customer.IsActive = false;
        customer.UpdatedAt = DateTime.UtcNow;
        await _customerRepository.UpdateAsync(customer);
    }

    public async Task HardDeleteAsync(int id)
    {
        var customer = await _customerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"العميل بالمعرف {id} غير موجود.");

        await _customerRepository.DeleteAsync(customer);
    }

    private static void Validate(string name, string phone)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleException("اسم العميل مطلوب.");

        if (string.IsNullOrWhiteSpace(phone))
            throw new BusinessRuleException("رقم الهاتف مطلوب.");
    }

    private static CustomerResponseDto MapToResponse(Customer customer) => new()
    {
        Id = customer.Id,
        Name = customer.Name,
        Phone = customer.Phone,
        Phone2 = customer.Phone2,
        Address = customer.Address,
        Notes = customer.Notes,
        OpeningBalance = customer.OpeningBalance,
        IsActive = customer.IsActive,
        CreatedAt = customer.CreatedAt,
        UpdatedAt = customer.UpdatedAt
    };
}

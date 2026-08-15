using backend.DTOs;

namespace backend.Interfaces;

public interface IPaymentVoucherService
{
    Task<IEnumerable<PaymentVoucherResponseDto>> GetAllAsync();
    Task<PaymentVoucherResponseDto> GetByIdAsync(int id);
    Task<PaymentVoucherResponseDto> CreateAsync(CreatePaymentVoucherDto dto);
    Task<PaymentVoucherResponseDto> UpdateAsync(int id, UpdatePaymentVoucherDto dto);
    Task<PaymentVoucherResponseDto> ConfirmAsync(int id);
    Task<PaymentVoucherResponseDto> CancelAsync(int id);
    Task DeleteAsync(int id);
}

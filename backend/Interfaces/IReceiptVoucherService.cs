using backend.DTOs;

namespace backend.Interfaces;

public interface IReceiptVoucherService
{
    Task<IEnumerable<ReceiptVoucherResponseDto>> GetAllAsync();
    Task<ReceiptVoucherResponseDto> GetByIdAsync(int id);
    Task<ReceiptVoucherResponseDto> CreateAsync(CreateReceiptVoucherDto dto);
    Task<ReceiptVoucherResponseDto> UpdateAsync(int id, UpdateReceiptVoucherDto dto);
    Task<ReceiptVoucherResponseDto> ConfirmAsync(int id);
    Task<ReceiptVoucherResponseDto> CancelAsync(int id);
    Task DeleteAsync(int id);
}

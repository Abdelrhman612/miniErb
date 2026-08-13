using backend.DTOs;

namespace backend.Interfaces;

public interface IPurchaseInvoiceService
{
    Task<IEnumerable<PurchaseInvoiceResponseDto>> GetAllAsync();
    Task<PurchaseInvoiceResponseDto> GetByIdAsync(int id);
    Task<PurchaseInvoiceResponseDto> CreateAsync(CreatePurchaseInvoiceDto dto);
    Task<PurchaseInvoiceResponseDto> UpdateAsync(int id, UpdatePurchaseInvoiceDto dto);
    Task<PurchaseInvoiceResponseDto> ConfirmAsync(int id);
    Task<PurchaseInvoiceResponseDto> CancelAsync(int id);
    Task DeleteAsync(int id);
}

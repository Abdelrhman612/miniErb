using backend.DTOs;

namespace backend.Interfaces;

public interface ISalesInvoiceService
{
    Task<IEnumerable<SalesInvoiceResponseDto>> GetAllAsync();
    Task<SalesInvoiceResponseDto> GetByIdAsync(int id);
    Task<SalesInvoiceResponseDto> CreateAsync(CreateSalesInvoiceDto dto);
    Task<SalesInvoiceResponseDto> UpdateAsync(int id, UpdateSalesInvoiceDto dto);
    Task<SalesInvoiceResponseDto> ConfirmAsync(int id);
    Task<SalesInvoiceResponseDto> CancelAsync(int id);
    Task DeleteAsync(int id);
}

using backend.DTOs;

namespace backend.Interfaces;

public interface IJournalVoucherService
{
    Task<IEnumerable<JournalVoucherResponseDto>> GetAllAsync();
    Task<JournalVoucherResponseDto> GetByIdAsync(int id);
    Task<JournalVoucherResponseDto> CreateAsync(CreateJournalVoucherDto dto);
    Task<JournalVoucherResponseDto> UpdateAsync(int id, UpdateJournalVoucherDto dto);
    Task<JournalVoucherResponseDto> ConfirmAsync(int id);
    Task<JournalVoucherResponseDto> CancelAsync(int id);
    Task DeleteAsync(int id);
}

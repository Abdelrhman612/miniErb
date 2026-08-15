using backend.Enums;

namespace backend.Models;

public class JournalVoucher
{
    public int Id { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public DateTime VoucherDate { get; set; } = DateTime.UtcNow;
    public string? Description { get; set; }
    public VoucherStatus Status { get; set; } = VoucherStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<JournalVoucherItem> Items { get; set; } = new List<JournalVoucherItem>();
}

using backend.Enums;

namespace backend.Models;

public class ReceiptVoucher
{
    public int Id { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public DateTime VoucherDate { get; set; } = DateTime.UtcNow;
    public int TreasuryId { get; set; }
    public Account? Treasury { get; set; }
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public int? CounterAccountId { get; set; }
    public Account? CounterAccount { get; set; }
    public string? PartyName { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public VoucherStatus Status { get; set; } = VoucherStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

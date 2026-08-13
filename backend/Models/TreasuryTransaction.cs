namespace backend.Models;

public class TreasuryTransaction
{
    public int Id { get; set; }
    public int? PurchaseInvoiceId { get; set; }
    public int? SalesInvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public PurchaseInvoice? PurchaseInvoice { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
}

using backend.Enums;

namespace backend.Models;

public class SalesInvoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int WarehouseId { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public PaymentType PaymentType { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public PurchaseInvoiceStatus Status { get; set; } = PurchaseInvoiceStatus.Draft;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<SalesInvoiceItem> Items { get; set; } = new List<SalesInvoiceItem>();
}

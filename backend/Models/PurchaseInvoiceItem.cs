namespace backend.Models;

public class PurchaseInvoiceItem
{
    public int Id { get; set; }
    public int PurchaseInvoiceId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal Total { get; set; }

    // Navigation
    public PurchaseInvoice PurchaseInvoice { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

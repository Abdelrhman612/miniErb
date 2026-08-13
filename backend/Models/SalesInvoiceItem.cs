namespace backend.Models;

public class SalesInvoiceItem
{
    public int Id { get; set; }
    public int SalesInvoiceId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }

    // Navigation
    public SalesInvoice SalesInvoice { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

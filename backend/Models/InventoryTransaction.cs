namespace backend.Models;

public class InventoryTransaction
{
    public int Id { get; set; }
    public int? PurchaseInvoiceId { get; set; }
    public int? SalesInvoiceId { get; set; }
    public int WarehouseId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public PurchaseInvoice? PurchaseInvoice { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

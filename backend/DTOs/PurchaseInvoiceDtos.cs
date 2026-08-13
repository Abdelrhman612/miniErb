using backend.Enums;

namespace backend.DTOs;

public class CreatePurchaseInvoiceDto
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public int WarehouseId { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public PaymentType PaymentType { get; set; }
    public decimal PaidAmount { get; set; }
    public string? Notes { get; set; }
    public List<CreatePurchaseInvoiceItemDto> Items { get; set; } = new();
}

public class CreatePurchaseInvoiceItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
}

public class UpdatePurchaseInvoiceDto
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public int WarehouseId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public PaymentType PaymentType { get; set; }
    public decimal PaidAmount { get; set; }
    public string? Notes { get; set; }
    public List<CreatePurchaseInvoiceItemDto> Items { get; set; } = new();
}

public class PurchaseInvoiceResponseDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public PaymentType PaymentType { get; set; }
    public string PaymentTypeName { get; set; } = string.Empty;
    public decimal PaidAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public PurchaseInvoiceStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<PurchaseInvoiceItemResponseDto> Items { get; set; } = new();
}

public class PurchaseInvoiceItemResponseDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal Total { get; set; }
}

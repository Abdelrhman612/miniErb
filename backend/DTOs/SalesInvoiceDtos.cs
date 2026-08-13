using backend.Enums;

namespace backend.DTOs;

public class CreateSalesInvoiceDto
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int WarehouseId { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public PaymentType PaymentType { get; set; }
    public decimal PaidAmount { get; set; }
    public string? Notes { get; set; }
    public List<CreateSalesInvoiceItemDto> Items { get; set; } = new();
}

public class CreateSalesInvoiceItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class UpdateSalesInvoiceDto
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int WarehouseId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public PaymentType PaymentType { get; set; }
    public decimal PaidAmount { get; set; }
    public string? Notes { get; set; }
    public List<CreateSalesInvoiceItemDto> Items { get; set; } = new();
}

public class SalesInvoiceResponseDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
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
    public List<SalesInvoiceItemResponseDto> Items { get; set; } = new();
}

public class SalesInvoiceItemResponseDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}

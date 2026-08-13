namespace backend.Models;

public enum TransactionType
{
    Debit = 1,
    Credit = 2
}

public class AccountTransaction
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public TransactionType TransactionType { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? ReferenceType { get; set; } // "InitialBalance", "PurchaseInvoice", "SalesInvoice", etc.
    public int? ReferenceId { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Account Account { get; set; } = null!;
}

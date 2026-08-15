namespace backend.Models;

public class Account
{
    public int Id { get; set; }
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty; // "Asset", "Liability", "Equity", "Revenue", "Expense", "Treasury", "Customer", "Supplier"
    public int? ParentAccountId { get; set; }
    public Account? ParentAccount { get; set; }
    public bool IsGroup { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Account> Children { get; set; } = new List<Account>();
    public ICollection<AccountTransaction> Transactions { get; set; } = new List<AccountTransaction>();
}

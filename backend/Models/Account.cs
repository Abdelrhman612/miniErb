namespace backend.Models;

public class Account
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty; // "Treasury", "Customer", "Supplier"
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<AccountTransaction> Transactions { get; set; } = new List<AccountTransaction>();
}

namespace backend.Models;

public class JournalVoucherItem
{
    public int Id { get; set; }
    public int JournalVoucherId { get; set; }
    public JournalVoucher? JournalVoucher { get; set; }
    public int AccountId { get; set; }
    public Account? Account { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public string? Description { get; set; }
}

using backend.Enums;

namespace backend.DTOs;

public class CreateReceiptVoucherDto
{
    public string? VoucherNumber { get; set; }
    public DateTime VoucherDate { get; set; }
    public int TreasuryId { get; set; }
    public int? CustomerId { get; set; }
    public int? SupplierId { get; set; }
    public int? CounterAccountId { get; set; }
    public string? PartyName { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
}

public class UpdateReceiptVoucherDto : CreateReceiptVoucherDto {}

public class ReceiptVoucherResponseDto
{
    public int Id { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public DateTime VoucherDate { get; set; }
    public int TreasuryId { get; set; }
    public string TreasuryName { get; set; } = string.Empty;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public int? CounterAccountId { get; set; }
    public string? CounterAccountCode { get; set; }
    public string? CounterAccountName { get; set; }
    public string? PartyName { get; set; }
    public string ResolvedPartyName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public VoucherStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreatePaymentVoucherDto
{
    public string? VoucherNumber { get; set; }
    public DateTime VoucherDate { get; set; }
    public int TreasuryId { get; set; }
    public int? SupplierId { get; set; }
    public int? CustomerId { get; set; }
    public int? CounterAccountId { get; set; }
    public string? PartyName { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
}

public class UpdatePaymentVoucherDto : CreatePaymentVoucherDto {}

public class PaymentVoucherResponseDto
{
    public int Id { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public DateTime VoucherDate { get; set; }
    public int TreasuryId { get; set; }
    public string TreasuryName { get; set; } = string.Empty;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int? CounterAccountId { get; set; }
    public string? CounterAccountCode { get; set; }
    public string? CounterAccountName { get; set; }
    public string? PartyName { get; set; }
    public string ResolvedPartyName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public VoucherStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateJournalVoucherItemDto
{
    public int AccountId { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public string? Description { get; set; }
}

public class JournalVoucherItemResponseDto
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public string? Description { get; set; }
}

public class CreateJournalVoucherDto
{
    public string? VoucherNumber { get; set; }
    public DateTime VoucherDate { get; set; }
    public string? Description { get; set; }
    public List<CreateJournalVoucherItemDto> Items { get; set; } = new();
}

public class UpdateJournalVoucherDto : CreateJournalVoucherDto {}

public class JournalVoucherResponseDto
{
    public int Id { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public DateTime VoucherDate { get; set; }
    public string? Description { get; set; }
    public VoucherStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<JournalVoucherItemResponseDto> Items { get; set; } = new();
}

namespace backend.DTOs;

public class AccountResponseDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public int? ParentAccountId { get; set; }
    public string? ParentAccountName { get; set; }
    public bool IsGroup { get; set; }
    public bool IsActive { get; set; }
    public decimal Balance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class AccountNodeDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public int? ParentAccountId { get; set; }
    public bool IsGroup { get; set; }
    public bool IsActive { get; set; }
    public decimal Balance { get; set; }
    public List<AccountNodeDto> Children { get; set; } = new();
}

public class CreateAccountDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public int? ParentAccountId { get; set; }
    public bool IsGroup { get; set; }
}

public class UpdateAccountDto
{
    public string Name { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public int? ParentAccountId { get; set; }
    public bool IsGroup { get; set; }
    public bool IsActive { get; set; }
}

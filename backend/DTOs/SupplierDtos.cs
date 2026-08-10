namespace backend.DTOs;

public class CreateSupplierDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Phone2 { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public decimal OpeningBalance { get; set; }
}

public class UpdateSupplierDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Phone2 { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public decimal OpeningBalance { get; set; }
    public bool IsActive { get; set; }
}

public class SupplierResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Phone2 { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public decimal OpeningBalance { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

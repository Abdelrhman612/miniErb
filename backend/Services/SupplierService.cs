using backend.Database;
using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SupplierService : ISupplierService
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly AppDbContext _context;

    public SupplierService(ISupplierRepository supplierRepository, AppDbContext context)
    {
        _supplierRepository = supplierRepository;
        _context = context;
    }

    public async Task<IEnumerable<SupplierResponseDto>> GetAllAsync()
    {
        var suppliers = await _supplierRepository.GetAllAsync();
        return suppliers.Select(MapToResponse);
    }

    public async Task<SupplierResponseDto> GetByIdAsync(int id)
    {
        var supplier = await _supplierRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المورد بالمعرف {id} غير موجود.");

        return MapToResponse(supplier);
    }

    public async Task<SupplierResponseDto> CreateAsync(CreateSupplierDto dto)
    {
        Validate(dto.Name, dto.Phone);
        if (dto.OpeningBalance < 0)
            throw new BusinessRuleException("الرصيد الافتتاحي لا يمكن أن يكون سالباً.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var supplier = new Supplier
            {
                Name = dto.Name.Trim(),
                Phone = dto.Phone.Trim(),
                Phone2 = dto.Phone2?.Trim(),
                Address = dto.Address?.Trim(),
                Notes = dto.Notes?.Trim(),
                OpeningBalance = dto.OpeningBalance,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _supplierRepository.CreateAsync(supplier);

            var account = new Account
            {
                SupplierId = created.Id,
                Name = created.Name,
                Code = $"SUP-{created.Id}",
                AccountType = "Supplier",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            if (dto.OpeningBalance > 0)
            {
                var openingTx = new AccountTransaction
                {
                    AccountId = account.Id,
                    TransactionType = TransactionType.Credit,
                    Debit = 0,
                    Credit = dto.OpeningBalance,
                    PaidAmount = 0,
                    Amount = dto.OpeningBalance,
                    Description = "الرصيد الافتتاحي",
                    ReferenceType = "OpeningBalance",
                    TransactionDate = supplier.CreatedAt,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(openingTx);
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return MapToResponse(created);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<SupplierResponseDto> UpdateAsync(int id, UpdateSupplierDto dto)
    {
        var supplier = await _supplierRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المورد بالمعرف {id} غير موجود.");

        Validate(dto.Name, dto.Phone);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            supplier.Name = dto.Name.Trim();
            supplier.Phone = dto.Phone.Trim();
            supplier.Phone2 = dto.Phone2?.Trim();
            supplier.Address = dto.Address?.Trim();
            supplier.Notes = dto.Notes?.Trim();
            supplier.OpeningBalance = dto.OpeningBalance;
            supplier.IsActive = dto.IsActive;
            supplier.UpdatedAt = DateTime.UtcNow;

            var updated = await _supplierRepository.UpdateAsync(supplier);

            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.SupplierId == supplier.Id);

            if (account == null)
            {
                account = new Account
                {
                    SupplierId = supplier.Id,
                    Name = supplier.Name,
                    Code = $"SUP-{supplier.Id}",
                    AccountType = "Supplier",
                    IsActive = supplier.IsActive,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Accounts.Add(account);
            }
            else
            {
                account.Name = supplier.Name;
                account.IsActive = supplier.IsActive;
                account.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return MapToResponse(updated);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task DeleteAsync(int id)
    {
        var supplier = await _supplierRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المورد بالمعرف {id} غير موجود.");

        supplier.IsActive = false;
        supplier.UpdatedAt = DateTime.UtcNow;
        await _supplierRepository.UpdateAsync(supplier);

        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.SupplierId == supplier.Id);
        if (account != null)
        {
            account.IsActive = false;
            account.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task HardDeleteAsync(int id)
    {
        var supplier = await _supplierRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"المورد بالمعرف {id} غير موجود.");

        await _supplierRepository.DeleteAsync(supplier);
    }

    public async Task<SupplierAccountResponseDto> GetAccountAsync(int supplierId)
    {
        var supplier = await _supplierRepository.GetByIdAsync(supplierId)
            ?? throw new NotFoundException($"المورد بالمعرف {supplierId} غير موجود.");

        var account = await GetOrCreateAccountAsync(supplier);

        var transactions = await _context.AccountTransactions
            .Where(at => at.AccountId == account.Id)
            .ToListAsync();

        var balance = CalculateSupplierBalance(account);
        var totalPurchases = transactions
            .Where(t => t.ReferenceType == "PurchaseInvoice")
            .Sum(t => t.Credit > 0 ? t.Credit : t.Amount);
        var totalPaid = transactions
            .Where(t => t.ReferenceType == "PurchaseInvoice")
            .Sum(t => t.PaidAmount);
        var totalOutstanding = Math.Max(0, totalPurchases - totalPaid);

        return new SupplierAccountResponseDto
        {
            SupplierId = supplier.Id,
            SupplierName = supplier.Name,
            Phone = supplier.Phone,
            Address = supplier.Address,
            AccountId = account.Id,
            Code = account.Code,
            OpeningBalance = supplier.OpeningBalance,
            Balance = balance,
            TotalPurchases = totalPurchases,
            TotalPaid = totalPaid,
            TotalOutstanding = totalOutstanding,
            IsActive = account.IsActive
        };
    }

    public async Task<IEnumerable<AccountTransactionResponseDto>> GetAccountTransactionsAsync(int supplierId, DateTime? fromDate, DateTime? toDate)
    {
        var supplier = await _supplierRepository.GetByIdAsync(supplierId)
            ?? throw new NotFoundException($"المورد بالمعرف {supplierId} غير موجود.");

        var account = await GetOrCreateAccountAsync(supplier);

        var query = _context.AccountTransactions
            .Where(at => at.AccountId == account.Id);

        if (fromDate.HasValue)
        {
            query = query.Where(at => at.TransactionDate >= fromDate.Value.Date);
        }
        if (toDate.HasValue)
        {
            var endDate = toDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(at => at.TransactionDate <= endDate);
        }

        var transactions = await query
            .OrderBy(at => at.TransactionDate)
            .ThenBy(at => at.Id)
            .ToListAsync();

        decimal runningBalance = 0;
        if (fromDate.HasValue)
        {
            var priorTransactions = await _context.AccountTransactions
                .Where(at => at.AccountId == account.Id && at.TransactionDate < fromDate.Value.Date)
                .ToListAsync();

            foreach (var tx in priorTransactions)
            {
                var d = tx.Debit > 0 ? tx.Debit : (tx.TransactionType == TransactionType.Debit ? tx.Amount : 0);
                var c = tx.Credit > 0 ? tx.Credit : (tx.TransactionType == TransactionType.Credit ? tx.Amount : 0);
                runningBalance += (c - d); // Supplier balance: credit increases, debit decreases
            }
        }

        var purchaseInvoiceIds = transactions
            .Where(t => t.ReferenceType == "PurchaseInvoice" && t.ReferenceId.HasValue)
            .Select(t => t.ReferenceId!.Value)
            .Distinct()
            .ToList();

        var purchaseInvoices = await _context.PurchaseInvoices
            .Include(pi => pi.Items)
            .ThenInclude(i => i.Product)
            .Where(pi => purchaseInvoiceIds.Contains(pi.Id))
            .ToDictionaryAsync(pi => pi.Id);

        var result = new List<AccountTransactionResponseDto>();

        foreach (var tx in transactions)
        {
            var d = tx.Debit > 0 ? tx.Debit : (tx.TransactionType == TransactionType.Debit ? tx.Amount : 0);
            var c = tx.Credit > 0 ? tx.Credit : (tx.TransactionType == TransactionType.Credit ? tx.Amount : 0);
            runningBalance += (c - d);

            string? invoiceNumber = null;
            string debtorName = "شركتنا";
            string creditorName = supplier.Name;
            var products = new List<AccountProductDetailDto>();

            if (tx.ReferenceType == "PurchaseInvoice" && tx.ReferenceId.HasValue && purchaseInvoices.TryGetValue(tx.ReferenceId.Value, out var pi))
            {
                invoiceNumber = pi.InvoiceNumber;
                debtorName = "شركتنا";
                creditorName = supplier.Name;
                foreach (var item in pi.Items)
                {
                    products.Add(new AccountProductDetailDto
                    {
                        ProductName = item.Product?.Name ?? string.Empty,
                        ProductCode = item.Product?.Code ?? string.Empty,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitCost,
                        Total = item.Total
                    });
                }
            }
            else if (tx.ReferenceType == "PurchaseInvoiceCancellation" && tx.ReferenceId.HasValue && purchaseInvoices.TryGetValue(tx.ReferenceId.Value, out var piCanc))
            {
                invoiceNumber = piCanc.InvoiceNumber;
                debtorName = supplier.Name;
                creditorName = "شركتنا";
            }
            else if (tx.ReferenceType == "OpeningBalance")
            {
                invoiceNumber = "-";
                debtorName = "شركتنا";
                creditorName = supplier.Name;
            }

            var outstanding = tx.ReferenceType == "PurchaseInvoice" && tx.ReferenceId.HasValue && purchaseInvoices.TryGetValue(tx.ReferenceId.Value, out var inv) ? Math.Max(0, inv.TotalAmount - inv.PaidAmount) : Math.Abs(c - d);

            result.Add(new AccountTransactionResponseDto
            {
                Id = tx.Id,
                AccountId = tx.AccountId,
                TransactionType = tx.TransactionType,
                TransactionTypeName = tx.TransactionType == TransactionType.Debit ? "مدين" : "دائن",
                Amount = tx.Amount,
                Debit = d,
                Credit = c,
                PaidAmount = tx.PaidAmount,
                OutstandingAmount = outstanding,
                Description = tx.Description,
                ReferenceType = tx.ReferenceType,
                ReferenceId = tx.ReferenceId,
                InvoiceNumber = invoiceNumber,
                DebtorName = debtorName,
                CreditorName = creditorName,
                Products = products,
                RunningBalance = runningBalance,
                TransactionDate = tx.TransactionDate,
                CreatedAt = tx.CreatedAt
            });
        }

        return result.OrderByDescending(t => t.TransactionDate).ThenByDescending(t => t.Id);
    }

    private async Task<Account> GetOrCreateAccountAsync(Supplier supplier)
    {
        var account = await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.SupplierId == supplier.Id);

        if (account == null)
        {
            account = new Account
            {
                SupplierId = supplier.Id,
                Name = supplier.Name,
                Code = $"SUP-{supplier.Id}",
                AccountType = "Supplier",
                IsActive = supplier.IsActive,
                CreatedAt = DateTime.UtcNow
            };
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            if (supplier.OpeningBalance > 0)
            {
                var openingTx = new AccountTransaction
                {
                    AccountId = account.Id,
                    TransactionType = TransactionType.Credit,
                    Debit = 0,
                    Credit = supplier.OpeningBalance,
                    PaidAmount = 0,
                    Amount = supplier.OpeningBalance,
                    Description = "الرصيد الافتتاحي",
                    ReferenceType = "OpeningBalance",
                    TransactionDate = supplier.CreatedAt,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(openingTx);
                await _context.SaveChangesAsync();
                await _context.Entry(account).Collection(a => a.Transactions).LoadAsync();
            }
        }
        return account;
    }

    public static decimal CalculateSupplierBalance(Account account)
    {
        if (account.Transactions == null) return 0;
        var credits = account.Transactions.Sum(t => t.Credit > 0 ? t.Credit : (t.TransactionType == TransactionType.Credit ? t.Amount : 0));
        var debits = account.Transactions.Sum(t => t.Debit > 0 ? t.Debit : (t.TransactionType == TransactionType.Debit ? t.Amount : 0));
        return credits - debits;
    }

    private static void Validate(string name, string phone)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleException("اسم المورد مطلوب.");

        if (string.IsNullOrWhiteSpace(phone))
            throw new BusinessRuleException("رقم الهاتف مطلوب.");
    }

    private static SupplierResponseDto MapToResponse(Supplier supplier) => new()
    {
        Id = supplier.Id,
        Name = supplier.Name,
        Phone = supplier.Phone,
        Phone2 = supplier.Phone2,
        Address = supplier.Address,
        Notes = supplier.Notes,
        OpeningBalance = supplier.OpeningBalance,
        IsActive = supplier.IsActive,
        CreatedAt = supplier.CreatedAt,
        UpdatedAt = supplier.UpdatedAt
    };

    private static AccountTransactionResponseDto MapToTransactionResponse(AccountTransaction at) => new()
    {
        Id = at.Id,
        AccountId = at.AccountId,
        TransactionType = at.TransactionType,
        TransactionTypeName = at.TransactionType switch
        {
            TransactionType.Debit => "مدين",
            TransactionType.Credit => "دائن",
            _ => at.TransactionType.ToString()
        },
        Amount = at.Amount,
        Debit = at.Debit > 0 ? at.Debit : (at.TransactionType == TransactionType.Debit ? at.Amount : 0),
        Credit = at.Credit > 0 ? at.Credit : (at.TransactionType == TransactionType.Credit ? at.Amount : 0),
        PaidAmount = at.PaidAmount,
        Description = at.Description,
        ReferenceType = at.ReferenceType,
        ReferenceId = at.ReferenceId,
        TransactionDate = at.TransactionDate,
        CreatedAt = at.CreatedAt
    };
}

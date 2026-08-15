using backend.Database;
using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _customerRepository;
    private readonly AppDbContext _context;

    public CustomerService(ICustomerRepository customerRepository, AppDbContext context)
    {
        _customerRepository = customerRepository;
        _context = context;
    }

    public async Task<IEnumerable<CustomerResponseDto>> GetAllAsync()
    {
        var customers = await _customerRepository.GetAllAsync();
        return customers.Select(MapToResponse);
    }

    public async Task<CustomerResponseDto> GetByIdAsync(int id)
    {
        var customer = await _customerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"العميل بالمعرف {id} غير موجود.");

        return MapToResponse(customer);
    }

    public async Task<CustomerResponseDto> CreateAsync(CreateCustomerDto dto)
    {
        Validate(dto.Name, dto.Phone);
        if (dto.OpeningBalance < 0)
            throw new BusinessRuleException("الرصيد الافتتاحي لا يمكن أن يكون سالباً.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var customer = new Customer
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

            var created = await _customerRepository.CreateAsync(customer);

            var account = new Account
            {
                CustomerId = created.Id,
                Name = created.Name,
                Code = $"CUS-{created.Id}",
                AccountType = "Customer",
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
                    TransactionType = TransactionType.Debit,
                    Debit = dto.OpeningBalance,
                    Credit = 0,
                    PaidAmount = 0,
                    Amount = dto.OpeningBalance,
                    Description = "الرصيد الافتتاحي",
                    ReferenceType = "OpeningBalance",
                    TransactionDate = customer.CreatedAt,
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

    public async Task<CustomerResponseDto> UpdateAsync(int id, UpdateCustomerDto dto)
    {
        var customer = await _customerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"العميل بالمعرف {id} غير موجود.");

        Validate(dto.Name, dto.Phone);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            customer.Name = dto.Name.Trim();
            customer.Phone = dto.Phone.Trim();
            customer.Phone2 = dto.Phone2?.Trim();
            customer.Address = dto.Address?.Trim();
            customer.Notes = dto.Notes?.Trim();
            customer.OpeningBalance = dto.OpeningBalance;
            customer.IsActive = dto.IsActive;
            customer.UpdatedAt = DateTime.UtcNow;

            var updated = await _customerRepository.UpdateAsync(customer);

            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.CustomerId == customer.Id);

            if (account == null)
            {
                account = new Account
                {
                    CustomerId = customer.Id,
                    Name = customer.Name,
                    Code = $"CUS-{customer.Id}",
                    AccountType = "Customer",
                    IsActive = customer.IsActive,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Accounts.Add(account);
            }
            else
            {
                account.Name = customer.Name;
                account.IsActive = customer.IsActive;
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
        var customer = await _customerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"العميل بالمعرف {id} غير موجود.");

        customer.IsActive = false;
        customer.UpdatedAt = DateTime.UtcNow;
        await _customerRepository.UpdateAsync(customer);

        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.CustomerId == customer.Id);
        if (account != null)
        {
            account.IsActive = false;
            account.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task HardDeleteAsync(int id)
    {
        var customer = await _customerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"العميل بالمعرف {id} غير موجود.");

        await _customerRepository.DeleteAsync(customer);
    }

    public async Task<CustomerAccountResponseDto> GetAccountAsync(int customerId)
    {
        var customer = await _customerRepository.GetByIdAsync(customerId)
            ?? throw new NotFoundException($"العميل بالمعرف {customerId} غير موجود.");

        var account = await GetOrCreateAccountAsync(customer);

        var transactions = await _context.AccountTransactions
            .Where(at => at.AccountId == account.Id)
            .ToListAsync();

        var balance = CalculateCustomerBalance(account);
        var totalSales = transactions
            .Where(t => t.ReferenceType == "SalesInvoice")
            .Sum(t => t.Debit > 0 ? t.Debit : t.Amount);
        var totalPaid = transactions
            .Where(t => t.ReferenceType == "SalesInvoice")
            .Sum(t => t.PaidAmount);
        var totalOutstanding = Math.Max(0, totalSales - totalPaid);

        return new CustomerAccountResponseDto
        {
            CustomerId = customer.Id,
            CustomerName = customer.Name,
            Phone = customer.Phone,
            Address = customer.Address,
            AccountId = account.Id,
            Code = account.Code,
            OpeningBalance = customer.OpeningBalance,
            Balance = balance,
            TotalSales = totalSales,
            TotalPaid = totalPaid,
            TotalOutstanding = totalOutstanding,
            IsActive = account.IsActive
        };
    }

    public async Task<IEnumerable<AccountTransactionResponseDto>> GetAccountTransactionsAsync(int customerId, DateTime? fromDate, DateTime? toDate)
    {
        var customer = await _customerRepository.GetByIdAsync(customerId)
            ?? throw new NotFoundException($"العميل بالمعرف {customerId} غير موجود.");

        var account = await GetOrCreateAccountAsync(customer);

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
                runningBalance += (d - c);
            }
        }

        var salesInvoiceIds = transactions
            .Where(t => t.ReferenceType == "SalesInvoice" && t.ReferenceId.HasValue)
            .Select(t => t.ReferenceId!.Value)
            .Distinct()
            .ToList();

        var salesInvoices = await _context.SalesInvoices
            .Include(si => si.Items)
            .ThenInclude(i => i.Product)
            .Where(si => salesInvoiceIds.Contains(si.Id))
            .ToDictionaryAsync(si => si.Id);

        var result = new List<AccountTransactionResponseDto>();

        foreach (var tx in transactions)
        {
            var d = tx.Debit > 0 ? tx.Debit : (tx.TransactionType == TransactionType.Debit ? tx.Amount : 0);
            var c = tx.Credit > 0 ? tx.Credit : (tx.TransactionType == TransactionType.Credit ? tx.Amount : 0);
            runningBalance += (d - c);

            string? invoiceNumber = null;
            string debtorName = customer.Name;
            string creditorName = "شركتنا";
            var products = new List<AccountProductDetailDto>();

            if (tx.ReferenceType == "SalesInvoice" && tx.ReferenceId.HasValue && salesInvoices.TryGetValue(tx.ReferenceId.Value, out var si))
            {
                invoiceNumber = si.InvoiceNumber;
                debtorName = customer.Name;
                creditorName = "شركتنا";
                foreach (var item in si.Items)
                {
                    products.Add(new AccountProductDetailDto
                    {
                        ProductName = item.Product?.Name ?? string.Empty,
                        ProductCode = item.Product?.Code ?? string.Empty,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        Total = item.Total
                    });
                }
            }
            else if (tx.ReferenceType == "SalesInvoiceCancellation" && tx.ReferenceId.HasValue && salesInvoices.TryGetValue(tx.ReferenceId.Value, out var siCanc))
            {
                invoiceNumber = siCanc.InvoiceNumber;
                debtorName = "شركتنا";
                creditorName = customer.Name;
            }
            else if (tx.ReferenceType == "OpeningBalance")
            {
                invoiceNumber = "-";
                debtorName = customer.Name;
                creditorName = "الرصيد الافتتاحي";
            }

            var outstanding = tx.ReferenceType == "SalesInvoice" && tx.ReferenceId.HasValue && salesInvoices.TryGetValue(tx.ReferenceId.Value, out var inv) ? Math.Max(0, inv.TotalAmount - inv.PaidAmount) : Math.Abs(d - c);

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

    private async Task<Account> GetOrCreateAccountAsync(Customer customer)
    {
        var account = await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.CustomerId == customer.Id);

        if (account == null)
        {
            account = new Account
            {
                CustomerId = customer.Id,
                Name = customer.Name,
                Code = $"CUS-{customer.Id}",
                AccountType = "Customer",
                IsActive = customer.IsActive,
                CreatedAt = DateTime.UtcNow
            };
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            if (customer.OpeningBalance > 0)
            {
                var openingTx = new AccountTransaction
                {
                    AccountId = account.Id,
                    TransactionType = TransactionType.Debit,
                    Debit = customer.OpeningBalance,
                    Credit = 0,
                    PaidAmount = 0,
                    Amount = customer.OpeningBalance,
                    Description = "الرصيد الافتتاحي",
                    ReferenceType = "OpeningBalance",
                    TransactionDate = customer.CreatedAt,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(openingTx);
                await _context.SaveChangesAsync();
                // Reload transactions
                await _context.Entry(account).Collection(a => a.Transactions).LoadAsync();
            }
        }
        return account;
    }

    public static decimal CalculateCustomerBalance(Account account)
    {
        if (account.Transactions == null) return 0;
        var debits = account.Transactions.Sum(t => t.Debit > 0 ? t.Debit : (t.TransactionType == TransactionType.Debit ? t.Amount : 0));
        var credits = account.Transactions.Sum(t => t.Credit > 0 ? t.Credit : (t.TransactionType == TransactionType.Credit ? t.Amount : 0));
        return debits - credits;
    }

    private static void Validate(string name, string phone)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleException("اسم العميل مطلوب.");

        if (string.IsNullOrWhiteSpace(phone))
            throw new BusinessRuleException("رقم الهاتف مطلوب.");
    }

    private static CustomerResponseDto MapToResponse(Customer customer) => new()
    {
        Id = customer.Id,
        Name = customer.Name,
        Phone = customer.Phone,
        Phone2 = customer.Phone2,
        Address = customer.Address,
        Notes = customer.Notes,
        OpeningBalance = customer.OpeningBalance,
        IsActive = customer.IsActive,
        CreatedAt = customer.CreatedAt,
        UpdatedAt = customer.UpdatedAt
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

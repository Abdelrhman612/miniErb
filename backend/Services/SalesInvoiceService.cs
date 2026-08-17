using backend.DTOs;
using backend.Enums;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SalesInvoiceService : ISalesInvoiceService
{
    private readonly ISalesInvoiceRepository _invoiceRepository;
    private readonly AppDbContext _context;

    public SalesInvoiceService(ISalesInvoiceRepository invoiceRepository, AppDbContext context)
    {
        _invoiceRepository = invoiceRepository;
        _context = context;
    }

    public async Task<IEnumerable<SalesInvoiceResponseDto>> GetAllAsync()
    {
        var invoices = await _invoiceRepository.GetAllAsync();
        return invoices.Select(MapToResponse);
    }

    public async Task<SalesInvoiceResponseDto> GetByIdAsync(int id)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المبيعات بالمعرف {id} غير موجودة.");
        return MapToResponse(invoice);
    }

    public async Task<SalesInvoiceResponseDto> CreateAsync(CreateSalesInvoiceDto dto)
    {
        await ValidateDtoAsync(dto);

        var invoice = new SalesInvoice
        {
            InvoiceNumber = string.IsNullOrWhiteSpace(dto.InvoiceNumber) ? $"SI-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}" : dto.InvoiceNumber.Trim(),
            CustomerId = dto.CustomerId,
            WarehouseId = dto.WarehouseId,
            InvoiceDate = dto.InvoiceDate == default ? DateTime.UtcNow : dto.InvoiceDate,
            PaymentType = dto.PaymentType,
            PaidAmount = dto.PaidAmount,
            Notes = dto.Notes?.Trim(),
            Status = PurchaseInvoiceStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new SalesInvoiceItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Total = i.Quantity * i.UnitPrice
            }).ToList()
        };

        invoice.TotalAmount = invoice.Items.Sum(i => i.Total);
        ValidatePaymentAmount(invoice.PaymentType, invoice.PaidAmount, invoice.TotalAmount);

        var created = await _invoiceRepository.CreateAsync(invoice);
        var result = await _invoiceRepository.GetByIdAsync(created.Id);
        return MapToResponse(result!);
    }

    public async Task<SalesInvoiceResponseDto> UpdateAsync(int id, UpdateSalesInvoiceDto dto)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المبيعات بالمعرف {id} غير موجودة.");

        if (invoice.Status != PurchaseInvoiceStatus.Draft)
            throw new BusinessRuleException("لا يمكن تعديل الفاتورة إلا إذا كانت في حالة مسودة (Draft).");

        await ValidateDtoAsync(new CreateSalesInvoiceDto
        {
            InvoiceNumber = dto.InvoiceNumber,
            CustomerId = dto.CustomerId,
            WarehouseId = dto.WarehouseId,
            InvoiceDate = dto.InvoiceDate,
            PaymentType = dto.PaymentType,
            PaidAmount = dto.PaidAmount,
            Notes = dto.Notes,
            Items = dto.Items
        });

        invoice.InvoiceNumber = string.IsNullOrWhiteSpace(dto.InvoiceNumber) ? invoice.InvoiceNumber : dto.InvoiceNumber.Trim();
        invoice.CustomerId = dto.CustomerId;
        invoice.WarehouseId = dto.WarehouseId;
        invoice.InvoiceDate = dto.InvoiceDate;
        invoice.PaymentType = dto.PaymentType;
        invoice.PaidAmount = dto.PaidAmount;
        invoice.Notes = dto.Notes?.Trim();
        invoice.UpdatedAt = DateTime.UtcNow;

        invoice.Items.Clear();
        foreach (var itemDto in dto.Items)
        {
            invoice.Items.Add(new SalesInvoiceItem
            {
                SalesInvoiceId = invoice.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Total = itemDto.Quantity * itemDto.UnitPrice
            });
        }

        invoice.TotalAmount = invoice.Items.Sum(i => i.Total);
        ValidatePaymentAmount(invoice.PaymentType, invoice.PaidAmount, invoice.TotalAmount);

        await _invoiceRepository.UpdateAsync(invoice);
        var result = await _invoiceRepository.GetByIdAsync(invoice.Id);
        return MapToResponse(result!);
    }

    public async Task<SalesInvoiceResponseDto> ConfirmAsync(int id)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المبيعات بالمعرف {id} غير موجودة.");

        if (invoice.Status == PurchaseInvoiceStatus.Confirmed)
            throw new BusinessRuleException("الفاتورة مؤكدة بالفعل.");

        if (invoice.Status == PurchaseInvoiceStatus.Cancelled)
            throw new BusinessRuleException("لا يمكن تأكيد فاتورة ملغاة.");

        // 1. Validate Customer exists and active
        var customerActive = await _invoiceRepository.CustomerExistsAndActiveAsync(invoice.CustomerId);
        if (!customerActive)
            throw new BusinessRuleException("العميل غير موجود أو غير نشط.");

        // 2. Validate Warehouse exists and active
        var warehouseActive = await _invoiceRepository.WarehouseExistsAndActiveAsync(invoice.WarehouseId);
        if (!warehouseActive)
            throw new BusinessRuleException("المستودع غير موجود أو غير نشط.");

        // 3. Validate Products and stock availability
        foreach (var item in invoice.Items)
        {
            if (item.Quantity <= 0)
                throw new BusinessRuleException("كمية المنتج يجب أن تكون أكبر من الصفر.");
            if (item.UnitPrice < 0)
                throw new BusinessRuleException("سعر الوحدة لا يمكن أن يكون سالباً.");

            var productActive = await _invoiceRepository.ProductExistsAndActiveAsync(item.ProductId);
            if (!productActive)
                throw new BusinessRuleException($"المنتج بالمعرف {item.ProductId} غير موجود أو غير نشط.");

            // Check sufficient stock in warehouse
            var stock = await _context.WarehouseStocks
                .FirstOrDefaultAsync(s => s.WarehouseId == invoice.WarehouseId && s.ProductId == item.ProductId);

            var availableStock = stock?.Quantity ?? 0;
            if (availableStock < item.Quantity)
                throw new BusinessRuleException($"الكمية غير متوفرة في المستودع للمنتج (المتوفر: {availableStock}، المطلوب: {item.Quantity}).");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            invoice.Status = PurchaseInvoiceStatus.Confirmed;
            invoice.UpdatedAt = DateTime.UtcNow;

            // 4. Decrease inventory & create inventory transactions
            foreach (var item in invoice.Items)
            {
                var stock = await _context.WarehouseStocks
                    .FirstAsync(s => s.WarehouseId == invoice.WarehouseId && s.ProductId == item.ProductId);

                stock.Quantity -= item.Quantity;
                stock.UpdatedAt = DateTime.UtcNow;

                var invTx = new InventoryTransaction
                {
                    SalesInvoiceId = invoice.Id,
                    WarehouseId = invoice.WarehouseId,
                    ProductId = item.ProductId,
                    Quantity = -item.Quantity,
                    MovementType = "OUT",
                    CreatedAt = DateTime.UtcNow
                };
                _context.InventoryTransactions.Add(invTx);
            }

            // 5. Create Treasury Transaction if PaidAmount > 0 (Inflow)
            if (invoice.PaidAmount > 0)
            {
                var treasury = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountType == "Treasury" && a.IsActive);
                if (treasury == null)
                {
                    treasury = new Account
                    {
                        Name = "الخزنة الرئيسية",
                        Code = "CASH-001",
                        AccountType = "Treasury",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Accounts.Add(treasury);
                    await _context.SaveChangesAsync();
                }

                var customer = await _context.Customers.FindAsync(invoice.CustomerId);
                var accountTx = new AccountTransaction
                {
                    AccountId = treasury.Id,
                    TransactionType = TransactionType.Debit,
                    Debit = invoice.PaidAmount,
                    Credit = 0,
                    PaidAmount = invoice.PaidAmount,
                    Amount = invoice.PaidAmount,
                    PartyName = customer?.Name ?? string.Empty,
                    Description = $"قبض نقدي من العميل ({customer?.Name ?? "العميل"}) - فاتورة مبيعات رقم {invoice.InvoiceNumber}",
                    ReferenceType = "SalesInvoice",
                    ReferenceId = invoice.Id,
                    TransactionDate = invoice.InvoiceDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(accountTx);
            }

            // 6. Create Sales Revenue Transaction
            {
                var salesAccount = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.Code == "4100" || a.AccountType == "Revenue");
                if (salesAccount == null)
                {
                    var revenueRoot = await _context.Accounts.FirstOrDefaultAsync(a => a.Code == "4000");
                    salesAccount = new Account
                    {
                        Code = "4100",
                        Name = "المبيعات",
                        AccountType = "Revenue",
                        ParentAccountId = revenueRoot?.Id,
                        IsGroup = false,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Accounts.Add(salesAccount);
                    await _context.SaveChangesAsync();
                }

                var customer = await _context.Customers.FindAsync(invoice.CustomerId);
                var salesTx = new AccountTransaction
                {
                    AccountId = salesAccount.Id,
                    TransactionType = TransactionType.Credit,
                    Debit = 0,
                    Credit = invoice.TotalAmount,
                    PaidAmount = invoice.PaidAmount,
                    Amount = invoice.TotalAmount,
                    PartyName = customer?.Name ?? string.Empty,
                    Description = $"فاتورة مبيعات رقم {invoice.InvoiceNumber}",
                    ReferenceType = "SalesInvoice",
                    ReferenceId = invoice.Id,
                    TransactionDate = invoice.InvoiceDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(salesTx);
            }

            // 7. Create Customer Account Transaction if unpaid amount > 0
            if (invoice.TotalAmount > invoice.PaidAmount)
            {
                var customerAccount = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.CustomerId == invoice.CustomerId);
                if (customerAccount == null)
                {
                    var customer = await _context.Customers.FindAsync(invoice.CustomerId);
                    customerAccount = new Account
                    {
                        CustomerId = invoice.CustomerId,
                        Name = customer?.Name ?? "Customer",
                        Code = $"CUS-{invoice.CustomerId}",
                        AccountType = "Customer",
                        IsActive = customer?.IsActive ?? true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Accounts.Add(customerAccount);
                    await _context.SaveChangesAsync();
                }

                var custTx = new AccountTransaction
                {
                    AccountId = customerAccount.Id,
                    TransactionType = TransactionType.Debit,
                    Debit = invoice.TotalAmount - invoice.PaidAmount,
                    Credit = 0,
                    PaidAmount = invoice.PaidAmount,
                    Amount = invoice.TotalAmount - invoice.PaidAmount,
                    Description = $"فاتورة مبيعات آجل رقم {invoice.InvoiceNumber}",
                    ReferenceType = "SalesInvoice",
                    ReferenceId = invoice.Id,
                    TransactionDate = invoice.InvoiceDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AccountTransactions.Add(custTx);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        var result = await _invoiceRepository.GetByIdAsync(invoice.Id);
        return MapToResponse(result!);
    }

    public async Task<SalesInvoiceResponseDto> CancelAsync(int id)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المبيعات بالمعرف {id} غير موجودة.");

        if (invoice.Status == PurchaseInvoiceStatus.Cancelled)
            throw new BusinessRuleException("الفاتورة ملغاة بالفعل ولا يمكن إلغاؤها مرة أخرى.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var wasConfirmed = invoice.Status == PurchaseInvoiceStatus.Confirmed;
            invoice.Status = PurchaseInvoiceStatus.Cancelled;
            invoice.UpdatedAt = DateTime.UtcNow;

            if (wasConfirmed)
            {
                // Reverse inventory
                foreach (var item in invoice.Items)
                {
                    var stock = await _context.WarehouseStocks
                        .FirstOrDefaultAsync(s => s.WarehouseId == invoice.WarehouseId && s.ProductId == item.ProductId);

                    if (stock == null)
                    {
                        stock = new WarehouseStock
                        {
                            WarehouseId = invoice.WarehouseId,
                            ProductId = item.ProductId,
                            Quantity = item.Quantity,
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.WarehouseStocks.Add(stock);
                    }
                    else
                    {
                        stock.Quantity += item.Quantity;
                        stock.UpdatedAt = DateTime.UtcNow;
                    }

                    var invTx = new InventoryTransaction
                    {
                        SalesInvoiceId = invoice.Id,
                        WarehouseId = invoice.WarehouseId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        MovementType = "IN",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.InventoryTransactions.Add(invTx);
                }

                // Reverse treasury if paid amount > 0
                if (invoice.PaidAmount > 0)
                {
                    var treasury = await _context.Accounts
                        .FirstOrDefaultAsync(a => a.AccountType == "Treasury" && a.IsActive);
                    if (treasury != null)
                    {
                        var accountTx = new AccountTransaction
                        {
                            AccountId = treasury.Id,
                            TransactionType = TransactionType.Credit,
                            Debit = 0,
                            Credit = invoice.PaidAmount,
                            PaidAmount = invoice.PaidAmount,
                            Amount = invoice.PaidAmount,
                            Description = $"رد مبلغ إلغاء فاتورة مبيعات رقم {invoice.InvoiceNumber}",
                            ReferenceType = "SalesInvoiceCancellation",
                            ReferenceId = invoice.Id,
                            TransactionDate = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.AccountTransactions.Add(accountTx);
                    }
                }

                // Reverse Sales Revenue
                {
                    var salesAccount = await _context.Accounts
                        .FirstOrDefaultAsync(a => a.Code == "4100" || a.AccountType == "Revenue");
                    if (salesAccount != null)
                    {
                        var salesReversalTx = new AccountTransaction
                        {
                            AccountId = salesAccount.Id,
                            TransactionType = TransactionType.Debit,
                            Debit = invoice.TotalAmount,
                            Credit = 0,
                            PaidAmount = invoice.PaidAmount,
                            Amount = invoice.TotalAmount,
                            Description = $"إلغاء فاتورة مبيعات رقم {invoice.InvoiceNumber}",
                            ReferenceType = "SalesInvoiceCancellation",
                            ReferenceId = invoice.Id,
                            TransactionDate = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.AccountTransactions.Add(salesReversalTx);
                    }
                }

                // Reverse customer account if unpaid amount > 0
                if (invoice.TotalAmount > invoice.PaidAmount)
                {
                    var customerAccount = await _context.Accounts
                        .FirstOrDefaultAsync(a => a.CustomerId == invoice.CustomerId);
                    if (customerAccount != null)
                    {
                        var custReversalTx = new AccountTransaction
                        {
                            AccountId = customerAccount.Id,
                            TransactionType = TransactionType.Credit,
                            Debit = 0,
                            Credit = invoice.TotalAmount - invoice.PaidAmount,
                            PaidAmount = invoice.PaidAmount,
                            Amount = invoice.TotalAmount - invoice.PaidAmount,
                            Description = $"إلغاء فاتورة مبيعات رقم {invoice.InvoiceNumber}",
                            ReferenceType = "SalesInvoiceCancellation",
                            ReferenceId = invoice.Id,
                            TransactionDate = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.AccountTransactions.Add(custReversalTx);
                    }
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        var result = await _invoiceRepository.GetByIdAsync(invoice.Id);
        return MapToResponse(result!);
    }

    public async Task DeleteAsync(int id)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المبيعات بالمعرف {id} غير موجودة.");

        if (invoice.Status == PurchaseInvoiceStatus.Confirmed)
            throw new BusinessRuleException("لا يمكن حذف فاتورة مؤكدة. قم بإلغائها أولاً.");

        await _invoiceRepository.DeleteAsync(invoice);
    }

    private async Task ValidateDtoAsync(CreateSalesInvoiceDto dto)
    {
        if (dto.CustomerId <= 0)
            throw new BusinessRuleException("العميل مطلوب.");
        if (dto.WarehouseId <= 0)
            throw new BusinessRuleException("المستودع مطلوب.");
        if (dto.Items == null || !dto.Items.Any())
            throw new BusinessRuleException("يجب أن تحتوي الفاتورة على بند واحد على الأقل.");

        var customerActive = await _invoiceRepository.CustomerExistsAndActiveAsync(dto.CustomerId);
        if (!customerActive)
            throw new BusinessRuleException("العميل المحدد غير موجود أو غير نشط.");

        var warehouseActive = await _invoiceRepository.WarehouseExistsAndActiveAsync(dto.WarehouseId);
        if (!warehouseActive)
            throw new BusinessRuleException("المستودع المحدد غير موجود أو غير نشط.");

        foreach (var item in dto.Items)
        {
            if (item.ProductId <= 0)
                throw new BusinessRuleException("المنتج مطلوب.");
            if (item.Quantity <= 0)
                throw new BusinessRuleException("كمية المنتج يجب أن تكون أكبر من الصفر.");
            if (item.UnitPrice < 0)
                throw new BusinessRuleException("سعر الوحدة لا يمكن أن يكون سالباً.");

            var productActive = await _invoiceRepository.ProductExistsAndActiveAsync(item.ProductId);
            if (!productActive)
                throw new BusinessRuleException($"المنتج بالمعرف {item.ProductId} غير موجود أو غير نشط.");
        }
    }

    private static void ValidatePaymentAmount(PaymentType paymentType, decimal paidAmount, decimal totalAmount)
    {
        if (paidAmount < 0)
            throw new BusinessRuleException("المبلغ المدفوع لا يمكن أن يكون سالباً.");
        if (paidAmount > totalAmount)
            throw new BusinessRuleException("المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة.");

        switch (paymentType)
        {
            case PaymentType.Cash:
                if (Math.Abs(paidAmount - totalAmount) > 0.01m)
                    throw new BusinessRuleException("في الدفع النقدي (Cash)، يجب أن يكون المبلغ المدفوع مساوياً لإجمالي الفاتورة.");
                break;
            case PaymentType.Credit:
                if (paidAmount != 0)
                    throw new BusinessRuleException("في البيع الآجل (Credit)، يجب أن يكون المبلغ المدفوع صفراً.");
                break;
            case PaymentType.Partial:
                if (paidAmount <= 0 || paidAmount >= totalAmount)
                    throw new BusinessRuleException("في الدفع الجزئي (Partial)، يجب أن يكون المبلغ المدفوع أكبر من الصفر وأقل من إجمالي الفاتورة.");
                break;
        }
    }

    private static SalesInvoiceResponseDto MapToResponse(SalesInvoice si) => new()
    {
        Id = si.Id,
        InvoiceNumber = si.InvoiceNumber,
        CustomerId = si.CustomerId,
        CustomerName = si.Customer?.Name ?? string.Empty,
        WarehouseId = si.WarehouseId,
        WarehouseName = si.Warehouse?.Name ?? string.Empty,
        InvoiceDate = si.InvoiceDate,
        PaymentType = si.PaymentType,
        PaymentTypeName = si.PaymentType switch
        {
            PaymentType.Cash => "نقدي",
            PaymentType.Credit => "آجل",
            PaymentType.Partial => "جزئي",
            _ => si.PaymentType.ToString()
        },
        PaidAmount = si.PaidAmount,
        TotalAmount = si.TotalAmount,
        Status = si.Status,
        StatusName = si.Status switch
        {
            PurchaseInvoiceStatus.Draft => "مسودة",
            PurchaseInvoiceStatus.Confirmed => "مؤكدة",
            PurchaseInvoiceStatus.Cancelled => "ملغاة",
            _ => si.Status.ToString()
        },
        Notes = si.Notes,
        CreatedAt = si.CreatedAt,
        UpdatedAt = si.UpdatedAt,
        Items = si.Items?.Select(item => new SalesInvoiceItemResponseDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductCode = item.Product?.Code ?? string.Empty,
            ProductName = item.Product?.Name ?? string.Empty,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            Total = item.Total
        }).ToList() ?? new()
    };
}

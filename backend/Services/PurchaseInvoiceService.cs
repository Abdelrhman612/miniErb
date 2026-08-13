using backend.DTOs;
using backend.Enums;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class PurchaseInvoiceService : IPurchaseInvoiceService
{
    private readonly IPurchaseInvoiceRepository _invoiceRepository;
    private readonly AppDbContext _context;

    public PurchaseInvoiceService(IPurchaseInvoiceRepository invoiceRepository, AppDbContext context)
    {
        _invoiceRepository = invoiceRepository;
        _context = context;
    }

    public async Task<IEnumerable<PurchaseInvoiceResponseDto>> GetAllAsync()
    {
        var invoices = await _invoiceRepository.GetAllAsync();
        return invoices.Select(MapToResponse);
    }

    public async Task<PurchaseInvoiceResponseDto> GetByIdAsync(int id)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المشتريات بالمعرف {id} غير موجودة.");
        return MapToResponse(invoice);
    }

    public async Task<PurchaseInvoiceResponseDto> CreateAsync(CreatePurchaseInvoiceDto dto)
    {
        await ValidateDtoAsync(dto);

        var invoice = new PurchaseInvoice
        {
            InvoiceNumber = string.IsNullOrWhiteSpace(dto.InvoiceNumber) ? $"PI-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}" : dto.InvoiceNumber.Trim(),
            SupplierId = dto.SupplierId,
            WarehouseId = dto.WarehouseId,
            InvoiceDate = dto.InvoiceDate == default ? DateTime.UtcNow : dto.InvoiceDate,
            PaymentType = dto.PaymentType,
            PaidAmount = dto.PaidAmount,
            Notes = dto.Notes?.Trim(),
            Status = PurchaseInvoiceStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new PurchaseInvoiceItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitCost = i.UnitCost,
                Total = i.Quantity * i.UnitCost
            }).ToList()
        };

        invoice.TotalAmount = invoice.Items.Sum(i => i.Total);
        ValidatePaymentAmount(invoice.PaymentType, invoice.PaidAmount, invoice.TotalAmount);

        var created = await _invoiceRepository.CreateAsync(invoice);
        var result = await _invoiceRepository.GetByIdAsync(created.Id);
        return MapToResponse(result!);
    }

    public async Task<PurchaseInvoiceResponseDto> UpdateAsync(int id, UpdatePurchaseInvoiceDto dto)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المشتريات بالمعرف {id} غير موجودة.");

        if (invoice.Status != PurchaseInvoiceStatus.Draft)
            throw new BusinessRuleException("لا يمكن تعديل الفاتورة إلا إذا كانت في حالة مسودة (Draft).");

        await ValidateDtoAsync(new CreatePurchaseInvoiceDto
        {
            InvoiceNumber = dto.InvoiceNumber,
            SupplierId = dto.SupplierId,
            WarehouseId = dto.WarehouseId,
            InvoiceDate = dto.InvoiceDate,
            PaymentType = dto.PaymentType,
            PaidAmount = dto.PaidAmount,
            Notes = dto.Notes,
            Items = dto.Items
        });

        invoice.InvoiceNumber = string.IsNullOrWhiteSpace(dto.InvoiceNumber) ? invoice.InvoiceNumber : dto.InvoiceNumber.Trim();
        invoice.SupplierId = dto.SupplierId;
        invoice.WarehouseId = dto.WarehouseId;
        invoice.InvoiceDate = dto.InvoiceDate;
        invoice.PaymentType = dto.PaymentType;
        invoice.PaidAmount = dto.PaidAmount;
        invoice.Notes = dto.Notes?.Trim();
        invoice.UpdatedAt = DateTime.UtcNow;

        invoice.Items.Clear();
        foreach (var itemDto in dto.Items)
        {
            invoice.Items.Add(new PurchaseInvoiceItem
            {
                PurchaseInvoiceId = invoice.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitCost = itemDto.UnitCost,
                Total = itemDto.Quantity * itemDto.UnitCost
            });
        }

        invoice.TotalAmount = invoice.Items.Sum(i => i.Total);
        ValidatePaymentAmount(invoice.PaymentType, invoice.PaidAmount, invoice.TotalAmount);

        await _invoiceRepository.UpdateAsync(invoice);
        var result = await _invoiceRepository.GetByIdAsync(invoice.Id);
        return MapToResponse(result!);
    }

    public async Task<PurchaseInvoiceResponseDto> ConfirmAsync(int id)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المشتريات بالمعرف {id} غير موجودة.");

        if (invoice.Status == PurchaseInvoiceStatus.Confirmed)
            throw new BusinessRuleException("الفاتورة مؤكدة بالفعل.");

        if (invoice.Status == PurchaseInvoiceStatus.Cancelled)
            throw new BusinessRuleException("لا يمكن تأكيد فاتورة ملغاة.");

        var warehouseExists = await _invoiceRepository.WarehouseExistsAsync(invoice.WarehouseId);
        if (!warehouseExists)
            throw new BusinessRuleException("المستودع المحدد غير موجود.");

        foreach (var item in invoice.Items)
        {
            if (item.Quantity <= 0)
                throw new BusinessRuleException("كمية المنتج يجب أن تكون أكبر من الصفر.");
            if (item.UnitCost < 0)
                throw new BusinessRuleException("تكلفة الوحدة لا يمكن أن تكون سالبة.");
            var productExists = await _invoiceRepository.ProductExistsAsync(item.ProductId);
            if (!productExists)
                throw new BusinessRuleException($"المنتج بالمعرف {item.ProductId} غير موجود.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            invoice.Status = PurchaseInvoiceStatus.Confirmed;
            invoice.UpdatedAt = DateTime.UtcNow;

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
                    PurchaseInvoiceId = invoice.Id,
                    WarehouseId = invoice.WarehouseId,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    MovementType = "IN",
                    CreatedAt = DateTime.UtcNow
                };
                _context.InventoryTransactions.Add(invTx);
            }

            if (invoice.PaidAmount > 0)
            {
                var treasuryTx = new TreasuryTransaction
                {
                    PurchaseInvoiceId = invoice.Id,
                    Amount = invoice.PaidAmount,
                    Type = "Outflow",
                    Description = $"سداد فاتورة مشتريات رقم {invoice.InvoiceNumber}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.TreasuryTransactions.Add(treasuryTx);
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

    public async Task<PurchaseInvoiceResponseDto> CancelAsync(int id)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"فواتير المشتريات بالمعرف {id} غير موجودة.");

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
                foreach (var item in invoice.Items)
                {
                    var stock = await _context.WarehouseStocks
                        .FirstOrDefaultAsync(s => s.WarehouseId == invoice.WarehouseId && s.ProductId == item.ProductId);

                    if (stock != null)
                    {
                        stock.Quantity -= item.Quantity;
                        stock.UpdatedAt = DateTime.UtcNow;
                    }

                    var invTx = new InventoryTransaction
                    {
                        PurchaseInvoiceId = invoice.Id,
                        WarehouseId = invoice.WarehouseId,
                        ProductId = item.ProductId,
                        Quantity = -item.Quantity,
                        MovementType = "OUT",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.InventoryTransactions.Add(invTx);
                }

                if (invoice.PaidAmount > 0)
                {
                    var treasuryTx = new TreasuryTransaction
                    {
                        PurchaseInvoiceId = invoice.Id,
                        Amount = invoice.PaidAmount,
                        Type = "Inflow",
                        Description = $"استرداد مبلغ إلغاء فاتورة مشتريات رقم {invoice.InvoiceNumber}",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.TreasuryTransactions.Add(treasuryTx);
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
            ?? throw new NotFoundException($"فواتير المشتريات بالمعرف {id} غير موجودة.");

        if (invoice.Status == PurchaseInvoiceStatus.Confirmed)
            throw new BusinessRuleException("لا يمكن حذف فاتورة مؤكدة. قم بإلغائها أولاً.");

        await _invoiceRepository.DeleteAsync(invoice);
    }

    private async Task ValidateDtoAsync(CreatePurchaseInvoiceDto dto)
    {
        if (dto.SupplierId <= 0)
            throw new BusinessRuleException("المورد مطلوب.");
        if (dto.WarehouseId <= 0)
            throw new BusinessRuleException("المستودع مطلوب.");
        if (dto.Items == null || !dto.Items.Any())
            throw new BusinessRuleException("يجب أن تحتوي الفاتورة على بند واحد على الأقل.");

        var supplierExists = await _invoiceRepository.SupplierExistsAsync(dto.SupplierId);
        if (!supplierExists)
            throw new BusinessRuleException("المورد المحدد غير موجود.");

        var warehouseExists = await _invoiceRepository.WarehouseExistsAsync(dto.WarehouseId);
        if (!warehouseExists)
            throw new BusinessRuleException("المستودع المحدد غير موجود.");

        foreach (var item in dto.Items)
        {
            if (item.ProductId <= 0)
                throw new BusinessRuleException("المنتج مطلوب.");
            if (item.Quantity <= 0)
                throw new BusinessRuleException("كمية المنتج يجب أن تكون أكبر من الصفر.");
            if (item.UnitCost < 0)
                throw new BusinessRuleException("تكلفة الوحدة لا يمكن أن تكون سالبة.");

            var productExists = await _invoiceRepository.ProductExistsAsync(item.ProductId);
            if (!productExists)
                throw new BusinessRuleException($"المنتج بالمعرف {item.ProductId} غير موجود.");
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
                    throw new BusinessRuleException("في الشراء الآجل (Credit)، يجب أن يكون المبلغ المدفوع صفراً.");
                break;
            case PaymentType.Partial:
                if (paidAmount <= 0 || paidAmount >= totalAmount)
                    throw new BusinessRuleException("في الدفع الجزئي (Partial)، يجب أن يكون المبلغ المدفوع أكبر من الصفر وأقل من إجمالي الفاتورة.");
                break;
        }
    }

    private static PurchaseInvoiceResponseDto MapToResponse(PurchaseInvoice pi) => new()
    {
        Id = pi.Id,
        InvoiceNumber = pi.InvoiceNumber,
        SupplierId = pi.SupplierId,
        SupplierName = pi.Supplier?.Name ?? string.Empty,
        WarehouseId = pi.WarehouseId,
        WarehouseName = pi.Warehouse?.Name ?? string.Empty,
        InvoiceDate = pi.InvoiceDate,
        PaymentType = pi.PaymentType,
        PaymentTypeName = pi.PaymentType switch
        {
            PaymentType.Cash => "نقدي",
            PaymentType.Credit => "آجل",
            PaymentType.Partial => "جزئي",
            _ => pi.PaymentType.ToString()
        },
        PaidAmount = pi.PaidAmount,
        TotalAmount = pi.TotalAmount,
        Status = pi.Status,
        StatusName = pi.Status switch
        {
            PurchaseInvoiceStatus.Draft => "مسودة",
            PurchaseInvoiceStatus.Confirmed => "مؤكدة",
            PurchaseInvoiceStatus.Cancelled => "ملغاة",
            _ => pi.Status.ToString()
        },
        Notes = pi.Notes,
        CreatedAt = pi.CreatedAt,
        UpdatedAt = pi.UpdatedAt,
        Items = pi.Items?.Select(item => new PurchaseInvoiceItemResponseDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductCode = item.Product?.Code ?? string.Empty,
            ProductName = item.Product?.Name ?? string.Empty,
            Quantity = item.Quantity,
            UnitCost = item.UnitCost,
            Total = item.Total
        }).ToList() ?? new()
    };
}

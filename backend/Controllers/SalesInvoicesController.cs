using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/sales-invoices")]
public class SalesInvoicesController : ControllerBase
{
    private readonly ISalesInvoiceService _invoiceService;

    public SalesInvoicesController(ISalesInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var invoices = await _invoiceService.GetAllAsync();
        return Ok(invoices);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await _invoiceService.GetByIdAsync(id);
        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalesInvoiceDto dto)
    {
        var created = await _invoiceService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSalesInvoiceDto dto)
    {
        var updated = await _invoiceService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id)
    {
        var confirmed = await _invoiceService.ConfirmAsync(id);
        return Ok(confirmed);
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var cancelled = await _invoiceService.CancelAsync(id);
        return Ok(cancelled);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _invoiceService.DeleteAsync(id);
        return NoContent();
    }
}

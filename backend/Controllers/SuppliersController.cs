using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var suppliers = await _supplierService.GetAllAsync();
        return Ok(suppliers);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var supplier = await _supplierService.GetByIdAsync(id);
        return Ok(supplier);
    }

    [HttpGet("{id:int}/account")]
    public async Task<ActionResult<SupplierAccountResponseDto>> GetAccount(int id)
    {
        var account = await _supplierService.GetAccountAsync(id);
        return Ok(account);
    }

    [HttpGet("{id:int}/account/transactions")]
    public async Task<ActionResult<IEnumerable<AccountTransactionResponseDto>>> GetAccountTransactions(
        int id,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var transactions = await _supplierService.GetAccountTransactionsAsync(id, fromDate, toDate);
        return Ok(transactions);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupplierDto dto)
    {
        var created = await _supplierService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierDto dto)
    {
        var updated = await _supplierService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _supplierService.DeleteAsync(id);
        return NoContent();
    }

    [HttpDelete("{id:int}/delete")]
    public async Task<IActionResult> DeletePermanently(int id)
    {
        await _supplierService.HardDeleteAsync(id);
        return NoContent();
    }
}

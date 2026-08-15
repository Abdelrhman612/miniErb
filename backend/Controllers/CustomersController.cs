using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var customers = await _customerService.GetAllAsync();
        return Ok(customers);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await _customerService.GetByIdAsync(id);
        return Ok(customer);
    }

    [HttpGet("{id:int}/account")]
    public async Task<ActionResult<CustomerAccountResponseDto>> GetAccount(int id)
    {
        var account = await _customerService.GetAccountAsync(id);
        return Ok(account);
    }

    [HttpGet("{id:int}/account/transactions")]
    public async Task<ActionResult<IEnumerable<AccountTransactionResponseDto>>> GetAccountTransactions(
        int id,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var transactions = await _customerService.GetAccountTransactionsAsync(id, fromDate, toDate);
        return Ok(transactions);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
    {
        var created = await _customerService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerDto dto)
    {
        var updated = await _customerService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _customerService.DeleteAsync(id);
        return NoContent();
    }

    [HttpDelete("{id:int}/delete")]
    public async Task<IActionResult> DeletePermanently(int id)
    {
        await _customerService.HardDeleteAsync(id);
        return NoContent();
    }
}

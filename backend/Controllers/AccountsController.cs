using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/chart-of-accounts")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AccountsController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountResponseDto>>> GetAll()
    {
        var accounts = await _accountService.GetAllAsync();
        return Ok(accounts);
    }

    [HttpGet("tree")]
    public async Task<ActionResult<IEnumerable<AccountNodeDto>>> GetTree()
    {
        var tree = await _accountService.GetTreeAsync();
        return Ok(tree);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AccountResponseDto>> GetById(int id)
    {
        var account = await _accountService.GetByIdAsync(id);
        return Ok(account);
    }

    [HttpGet("{id:int}/children")]
    public async Task<ActionResult<IEnumerable<AccountResponseDto>>> GetChildren(int id)
    {
        var children = await _accountService.GetChildrenAsync(id);
        return Ok(children);
    }

    [HttpGet("{id:int}/transactions")]
    public async Task<ActionResult<IEnumerable<AccountTransactionResponseDto>>> GetTransactions(
        int id,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var transactions = await _accountService.GetTransactionsAsync(id, fromDate, toDate);
        return Ok(transactions);
    }

    [HttpPost]
    public async Task<ActionResult<AccountResponseDto>> Create([FromBody] CreateAccountDto dto)
    {
        var created = await _accountService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AccountResponseDto>> Update(int id, [FromBody] UpdateAccountDto dto)
    {
        var updated = await _accountService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _accountService.DeleteAsync(id);
        return NoContent();
    }
}

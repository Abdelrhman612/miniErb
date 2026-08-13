using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/treasury")]
public class TreasuryController : ControllerBase
{
    private readonly ITreasuryService _treasuryService;

    public TreasuryController(ITreasuryService treasuryService)
    {
        _treasuryService = treasuryService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreasuryResponseDto>>> GetAll()
    {
        var treasuries = await _treasuryService.GetAllAsync();
        return Ok(treasuries);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TreasuryResponseDto>> GetById(int id)
    {
        var treasury = await _treasuryService.GetByIdAsync(id);
        return Ok(treasury);
    }

    [HttpGet("{id:int}/transactions")]
    public async Task<ActionResult<IEnumerable<AccountTransactionResponseDto>>> GetTransactions(int id)
    {
        var transactions = await _treasuryService.GetTransactionsAsync(id);
        return Ok(transactions);
    }

    [HttpPost]
    public async Task<ActionResult<TreasuryResponseDto>> Create([FromBody] CreateTreasuryDto dto)
    {
        var treasury = await _treasuryService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = treasury.Id }, treasury);
    }
}

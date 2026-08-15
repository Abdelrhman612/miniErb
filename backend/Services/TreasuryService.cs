using backend.DTOs;
using backend.Exceptions;
using backend.Interfaces;
using backend.Models;

namespace backend.Services;

public class TreasuryService : ITreasuryService
{
    private readonly ITreasuryRepository _repository;

    public TreasuryService(ITreasuryRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<TreasuryResponseDto>> GetAllAsync()
    {
        var treasuries = await _repository.GetAllTreasuriesAsync();
        return treasuries.Select(MapToResponse);
    }

    public async Task<TreasuryResponseDto> GetByIdAsync(int id)
    {
        var treasury = await _repository.GetByIdAsync(id)
            ?? throw new NotFoundException($"الخزنة بالمعرف {id} غير موجودة.");
        return MapToResponse(treasury);
    }

    public async Task<IEnumerable<AccountTransactionResponseDto>> GetTransactionsAsync(int id)
    {
        var treasury = await _repository.GetByIdAsync(id)
            ?? throw new NotFoundException($"الخزنة بالمعرف {id} غير موجودة.");

        var transactions = await _repository.GetTransactionsAsync(id);
        return transactions.Select(MapToTransactionResponse);
    }

    public async Task<TreasuryResponseDto> CreateAsync(CreateTreasuryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BusinessRuleException("اسم الخزنة مطلوب.");
        if (string.IsNullOrWhiteSpace(dto.Code))
            throw new BusinessRuleException("كود الخزنة مطلوب.");
        if (dto.InitialBalance < 0)
            throw new BusinessRuleException("الرصيد الافتتاحي لا يمكن أن يكون سالباً.");

        var codeExists = await _repository.CodeExistsAsync(dto.Code.Trim());
        if (codeExists)
            throw new BusinessRuleException($"كود الخزنة '{dto.Code}' مستخدم بالفعل.");

        var treasury = new Account
        {
            Name = dto.Name.Trim(),
            Code = dto.Code.Trim(),
            AccountType = "Treasury",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        AccountTransaction? initialTx = null;
        if (dto.InitialBalance > 0)
        {
            initialTx = new AccountTransaction
            {
                TransactionType = TransactionType.Credit,
                Debit = 0,
                Credit = dto.InitialBalance,
                PaidAmount = 0,
                Amount = dto.InitialBalance,
                Description = "الرصيد الافتتاحي للخزنة",
                ReferenceType = "InitialBalance",
                TransactionDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
        }

        var created = await _repository.CreateAsync(treasury, initialTx);
        return MapToResponse(created);
    }

    public static decimal CalculateBalance(Account account)
    {
        if (account.Transactions == null) return 0;
        var credits = account.Transactions.Sum(t => t.Credit > 0 ? t.Credit : (t.TransactionType == TransactionType.Credit ? t.Amount : 0));
        var debits = account.Transactions.Sum(t => t.Debit > 0 ? t.Debit : (t.TransactionType == TransactionType.Debit ? t.Amount : 0));
        return credits - debits;
    }

    private static TreasuryResponseDto MapToResponse(Account a) => new()
    {
        Id = a.Id,
        Name = a.Name,
        Code = a.Code,
        AccountType = a.AccountType,
        Balance = CalculateBalance(a),
        IsActive = a.IsActive,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };

    private static AccountTransactionResponseDto MapToTransactionResponse(AccountTransaction at) => new()
    {
        Id = at.Id,
        AccountId = at.AccountId,
        TransactionType = at.TransactionType,
        TransactionTypeName = at.TransactionType switch
        {
            TransactionType.Debit => "مدين (صرف)",
            TransactionType.Credit => "دائن (قبض)",
            _ => at.TransactionType.ToString()
        },
        Amount = at.Amount,
        Debit = at.Debit > 0 ? at.Debit : (at.TransactionType == TransactionType.Debit ? at.Amount : 0),
        Credit = at.Credit > 0 ? at.Credit : (at.TransactionType == TransactionType.Credit ? at.Amount : 0),
        PaidAmount = at.PaidAmount,
        PartyName = at.PartyName,
        Description = at.Description,
        ReferenceType = at.ReferenceType,
        ReferenceId = at.ReferenceId,
        TransactionDate = at.TransactionDate,
        CreatedAt = at.CreatedAt
    };
}

using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class AccountTransactionConfiguration : IEntityTypeConfiguration<AccountTransaction>
{
    public void Configure(EntityTypeBuilder<AccountTransaction> builder)
    {
        builder.HasKey(at => at.Id);

        builder.Property(at => at.Amount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(at => at.TransactionType)
            .IsRequired();

        builder.Property(at => at.Description)
            .HasMaxLength(500);

        builder.Property(at => at.ReferenceType)
            .HasMaxLength(50);

        builder.Property(at => at.TransactionDate)
            .IsRequired();

        builder.Property(at => at.CreatedAt)
            .IsRequired();

        builder.HasOne(at => at.Account)
            .WithMany(a => a.Transactions)
            .HasForeignKey(at => at.AccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("AccountTransactions");
    }
}

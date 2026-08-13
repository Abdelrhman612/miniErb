using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class TreasuryTransactionConfiguration : IEntityTypeConfiguration<TreasuryTransaction>
{
    public void Configure(EntityTypeBuilder<TreasuryTransaction> builder)
    {
        builder.HasKey(tt => tt.Id);

        builder.Property(tt => tt.Amount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(tt => tt.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(tt => tt.Description)
            .HasMaxLength(500);

        builder.Property(tt => tt.CreatedAt)
            .IsRequired();

        builder.HasOne(tt => tt.PurchaseInvoice)
            .WithMany()
            .HasForeignKey(tt => tt.PurchaseInvoiceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(tt => tt.SalesInvoice)
            .WithMany()
            .HasForeignKey(tt => tt.SalesInvoiceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.ToTable("TreasuryTransactions");
    }
}

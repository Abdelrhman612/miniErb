using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class JournalVoucherItemConfiguration : IEntityTypeConfiguration<JournalVoucherItem>
{
    public void Configure(EntityTypeBuilder<JournalVoucherItem> builder)
    {
        builder.ToTable("JournalVoucherItems");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Debit).HasColumnType("decimal(18,2)");
        builder.Property(i => i.Credit).HasColumnType("decimal(18,2)");

        builder.HasOne(i => i.Account)
            .WithMany()
            .HasForeignKey(i => i.AccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class JournalVoucherConfiguration : IEntityTypeConfiguration<JournalVoucher>
{
    public void Configure(EntityTypeBuilder<JournalVoucher> builder)
    {
        builder.ToTable("JournalVouchers");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.VoucherNumber).IsRequired().HasMaxLength(50);
        builder.HasIndex(v => v.VoucherNumber).IsUnique();

        builder.HasMany(v => v.Items)
            .WithOne(i => i.JournalVoucher)
            .HasForeignKey(i => i.JournalVoucherId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

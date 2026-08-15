using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class ReceiptVoucherConfiguration : IEntityTypeConfiguration<ReceiptVoucher>
{
    public void Configure(EntityTypeBuilder<ReceiptVoucher> builder)
    {
        builder.ToTable("ReceiptVouchers");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.VoucherNumber).IsRequired().HasMaxLength(50);
        builder.HasIndex(v => v.VoucherNumber).IsUnique();
        builder.Property(v => v.Amount).HasColumnType("decimal(18,2)");
        builder.Property(v => v.PartyName).HasMaxLength(200);

        builder.HasOne(v => v.Treasury)
            .WithMany()
            .HasForeignKey(v => v.TreasuryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(v => v.Customer)
            .WithMany()
            .HasForeignKey(v => v.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(v => v.Supplier)
            .WithMany()
            .HasForeignKey(v => v.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

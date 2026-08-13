using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class PurchaseInvoiceItemConfiguration : IEntityTypeConfiguration<PurchaseInvoiceItem>
{
    public void Configure(EntityTypeBuilder<PurchaseInvoiceItem> builder)
    {
        builder.HasKey(item => item.Id);

        builder.Property(item => item.Quantity)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(item => item.UnitCost)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(item => item.Total)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.HasOne(item => item.Product)
            .WithMany()
            .HasForeignKey(item => item.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable("PurchaseInvoiceItems");
    }
}

using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class PurchaseInvoiceConfiguration : IEntityTypeConfiguration<PurchaseInvoice>
{
    public void Configure(EntityTypeBuilder<PurchaseInvoice> builder)
    {
        builder.HasKey(pi => pi.Id);

        builder.Property(pi => pi.InvoiceNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(pi => pi.InvoiceDate)
            .IsRequired();

        builder.Property(pi => pi.PaymentType)
            .IsRequired();

        builder.Property(pi => pi.PaidAmount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(pi => pi.TotalAmount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(pi => pi.Status)
            .IsRequired();

        builder.Property(pi => pi.Notes)
            .HasMaxLength(1000);

        builder.Property(pi => pi.CreatedAt)
            .IsRequired();

        builder.Property(pi => pi.UpdatedAt);

        builder.HasOne(pi => pi.Supplier)
            .WithMany()
            .HasForeignKey(pi => pi.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(pi => pi.Warehouse)
            .WithMany()
            .HasForeignKey(pi => pi.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(pi => pi.Items)
            .WithOne(item => item.PurchaseInvoice)
            .HasForeignKey(item => item.PurchaseInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("PurchaseInvoices");
    }
}

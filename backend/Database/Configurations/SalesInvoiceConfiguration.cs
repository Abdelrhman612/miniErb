using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class SalesInvoiceConfiguration : IEntityTypeConfiguration<SalesInvoice>
{
    public void Configure(EntityTypeBuilder<SalesInvoice> builder)
    {
        builder.HasKey(si => si.Id);

        builder.Property(si => si.InvoiceNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(si => si.InvoiceDate)
            .IsRequired();

        builder.Property(si => si.PaymentType)
            .IsRequired();

        builder.Property(si => si.PaidAmount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(si => si.TotalAmount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(si => si.Status)
            .IsRequired();

        builder.Property(si => si.Notes)
            .HasMaxLength(1000);

        builder.Property(si => si.CreatedAt)
            .IsRequired();

        builder.Property(si => si.UpdatedAt);

        builder.HasOne(si => si.Customer)
            .WithMany()
            .HasForeignKey(si => si.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(si => si.Warehouse)
            .WithMany()
            .HasForeignKey(si => si.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(si => si.Items)
            .WithOne(item => item.SalesInvoice)
            .HasForeignKey(item => item.SalesInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("SalesInvoices");
    }
}

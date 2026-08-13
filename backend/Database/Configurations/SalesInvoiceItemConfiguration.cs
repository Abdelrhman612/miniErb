using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class SalesInvoiceItemConfiguration : IEntityTypeConfiguration<SalesInvoiceItem>
{
    public void Configure(EntityTypeBuilder<SalesInvoiceItem> builder)
    {
        builder.HasKey(item => item.Id);

        builder.Property(item => item.Quantity)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(item => item.UnitPrice)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(item => item.Total)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.HasOne(item => item.Product)
            .WithMany()
            .HasForeignKey(item => item.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable("SalesInvoiceItems");
    }
}

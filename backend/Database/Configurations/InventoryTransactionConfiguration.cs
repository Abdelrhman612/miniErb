using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class InventoryTransactionConfiguration : IEntityTypeConfiguration<InventoryTransaction>
{
    public void Configure(EntityTypeBuilder<InventoryTransaction> builder)
    {
        builder.HasKey(it => it.Id);

        builder.Property(it => it.Quantity)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(it => it.MovementType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(it => it.CreatedAt)
            .IsRequired();

        builder.HasOne(it => it.PurchaseInvoice)
            .WithMany()
            .HasForeignKey(it => it.PurchaseInvoiceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(it => it.SalesInvoice)
            .WithMany()
            .HasForeignKey(it => it.SalesInvoiceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(it => it.Warehouse)
            .WithMany()
            .HasForeignKey(it => it.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(it => it.Product)
            .WithMany()
            .HasForeignKey(it => it.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable("InventoryTransactions");
    }
}

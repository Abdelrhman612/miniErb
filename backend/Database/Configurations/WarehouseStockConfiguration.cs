using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class WarehouseStockConfiguration : IEntityTypeConfiguration<WarehouseStock>
{
    public void Configure(EntityTypeBuilder<WarehouseStock> builder)
    {
        builder.HasKey(ws => ws.Id);

        builder.Property(ws => ws.Quantity)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(ws => ws.UpdatedAt)
            .IsRequired();

        builder.HasOne(ws => ws.Warehouse)
            .WithMany()
            .HasForeignKey(ws => ws.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ws => ws.Product)
            .WithMany()
            .HasForeignKey(ws => ws.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ws => new { ws.WarehouseId, ws.ProductId })
            .IsUnique();

        builder.ToTable("WarehouseStocks");
    }
}

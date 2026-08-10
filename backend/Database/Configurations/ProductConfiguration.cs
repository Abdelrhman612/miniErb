using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .HasMaxLength(1000);

        builder.Property(p => p.Barcode)
            .HasMaxLength(100);

        builder.Property(p => p.PurchasePrice)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.SellingPrice)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.MinimumStock)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.Unit)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.UpdatedAt);

        builder.HasIndex(p => p.Code)
            .IsUnique();

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable("Products");
    }
}

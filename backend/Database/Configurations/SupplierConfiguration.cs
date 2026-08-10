using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Phone)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(s => s.Phone2)
            .HasMaxLength(30);

        builder.Property(s => s.Address)
            .HasMaxLength(300);

        builder.Property(s => s.Notes)
            .HasMaxLength(1000);

        builder.Property(s => s.OpeningBalance)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(s => s.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.Property(s => s.UpdatedAt);

        builder.ToTable("Suppliers");
    }
}

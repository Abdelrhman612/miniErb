using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Phone)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(c => c.Phone2)
            .HasMaxLength(30);

        builder.Property(c => c.Address)
            .HasMaxLength(300);

        builder.Property(c => c.Notes)
            .HasMaxLength(1000);

        builder.Property(c => c.OpeningBalance)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(c => c.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.UpdatedAt);

        builder.ToTable("Customers");
    }
}

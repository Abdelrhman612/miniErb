using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Database.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(a => a.Code)
            .IsUnique();

        builder.Property(a => a.AccountType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.IsActive)
            .IsRequired();

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.ToTable("Accounts");
    }
}

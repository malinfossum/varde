using Microsoft.EntityFrameworkCore;
using Varde.Core.Models;

namespace Varde.Data;

public class VardeDbContext(DbContextOptions<VardeDbContext> options) : DbContext(options)
{
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<ResourceTranslation> ResourceTranslations => Set<ResourceTranslation>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryTranslation> CategoryTranslations => Set<CategoryTranslation>();
    public DbSet<ResourceCategory> ResourceCategories => Set<ResourceCategory>();
    public DbSet<Municipality> Municipalities => Set<Municipality>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Municipality>(municipality =>
        {
            municipality.Property(m => m.Name).HasMaxLength(100);
            municipality.Property(m => m.County).HasMaxLength(100);
            municipality.HasIndex(m => m.Name).IsUnique();
        });

        modelBuilder.Entity<Resource>(resource =>
        {
            resource.Property(r => r.Name).HasMaxLength(200);
            resource.Property(r => r.Address).HasMaxLength(300);
            resource.Property(r => r.Phone).HasMaxLength(40);
            resource.Property(r => r.Email).HasMaxLength(200);
            resource.Property(r => r.Website).HasMaxLength(500);

            resource.HasOne(r => r.Municipality)
                .WithMany()
                .HasForeignKey(r => r.MunicipalityId)
                .OnDelete(DeleteBehavior.Restrict);

            // Local-before-national is the first sort key on every query.
            resource.HasIndex(r => new { r.IsNational, r.Name, r.Id });
            resource.HasIndex(r => r.MunicipalityId);
        });

        modelBuilder.Entity<ResourceTranslation>(translation =>
        {
            translation.Property(t => t.LanguageCode).HasMaxLength(5);
            translation.Property(t => t.Description).HasMaxLength(2000);

            translation.HasOne(t => t.Resource)
                .WithMany(r => r.Translations)
                .HasForeignKey(t => t.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);

            // One description per language per resource — a duplicate would make the
            // translation-fallback rule non-deterministic.
            translation.HasIndex(t => new { t.ResourceId, t.LanguageCode }).IsUnique();
        });

        modelBuilder.Entity<Category>(category =>
        {
            category.Property(c => c.Slug).HasMaxLength(50);
            category.HasIndex(c => c.Slug).IsUnique();
        });

        modelBuilder.Entity<CategoryTranslation>(translation =>
        {
            translation.Property(t => t.LanguageCode).HasMaxLength(5);
            translation.Property(t => t.Name).HasMaxLength(100);

            translation.HasOne(t => t.Category)
                .WithMany(c => c.Translations)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            translation.HasIndex(t => new { t.CategoryId, t.LanguageCode }).IsUnique();
        });

        modelBuilder.Entity<ResourceCategory>(join =>
        {
            join.HasKey(rc => new { rc.ResourceId, rc.CategoryId });

            join.HasOne(rc => rc.Resource)
                .WithMany(r => r.ResourceCategories)
                .HasForeignKey(rc => rc.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);

            join.HasOne(rc => rc.Category)
                .WithMany()
                .HasForeignKey(rc => rc.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

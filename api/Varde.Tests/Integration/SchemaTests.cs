using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Varde.Core.Models;
using Varde.Data;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class SchemaTests
{
    [Fact]
    public async Task A_national_resource_saves_without_a_municipality()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Resources.Add(new Resource
        {
            Name = "Mental Helse",
            IsNational = true,
            MunicipalityId = null,
            Phone = "116 123",
            LastVerified = new DateOnly(2026, 8, 13),
            Translations =
            {
                new ResourceTranslation { LanguageCode = "nb", Description = "Døgnåpen hjelpetelefon." },
            },
        }));

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        var saved = await db.Resources.Include(r => r.Translations).SingleAsync();

        Assert.True(saved.IsNational);
        Assert.Null(saved.MunicipalityId);
        Assert.Equal("nb", Assert.Single(saved.Translations).LanguageCode);
    }

    [Fact]
    public async Task A_resource_cannot_have_two_translations_in_the_same_language()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Resources.Add(new Resource
        {
            Name = "NAV Hamar",
            LastVerified = new DateOnly(2026, 8, 13),
            Translations =
            {
                new ResourceTranslation { LanguageCode = "nb", Description = "Første." },
            },
        }));

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        db.ResourceTranslations.Add(new ResourceTranslation
        {
            ResourceId = 1,
            LanguageCode = "nb",
            Description = "Duplikat.",
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task A_resource_belongs_to_many_categories()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            db.Categories.Add(new Category { Slug = "okonomi" });
            db.Categories.Add(new Category { Slug = "arbeid" });
            db.Resources.Add(new Resource
            {
                Name = "NAV Hamar",
                LastVerified = new DateOnly(2026, 8, 13),
            });
        });

        factory.Seed(db =>
        {
            db.ResourceCategories.Add(new ResourceCategory { ResourceId = 1, CategoryId = 1 });
            db.ResourceCategories.Add(new ResourceCategory { ResourceId = 1, CategoryId = 2 });
        });

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        var resource = await db.Resources
            .Include(r => r.ResourceCategories)
            .ThenInclude(rc => rc.Category)
            .SingleAsync();

        Assert.Equal(
            ["arbeid", "okonomi"],
            resource.ResourceCategories.Select(rc => rc.Category.Slug).OrderBy(s => s));
    }
}

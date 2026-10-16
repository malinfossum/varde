using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Varde.Core.Models;
using Varde.Data;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class SchemaTests
{
    [DbFact]
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

    [DbFact]
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

    [DbFact]
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

    private static Resource Service(string name, string? phone = "116 123") => new()
    {
        Name = name,
        IsNational = true,
        Phone = phone,
        LastVerified = new DateOnly(2026, 10, 16),
    };

    [DbFact]
    public async Task A_resource_with_children_cannot_be_deleted()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Resources.Add(Service("Hjelpetelefonen (Mental Helse)")));
        factory.Seed(db =>
        {
            var child = Service("Arbeidslivstelefonen (Mental Helse)");
            child.ParentId = 1;
            db.Resources.Add(child);
        });

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        db.Resources.Remove(await db.Resources.SingleAsync(r => r.Id == 1));

        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal(
            "FK_Resources_Resources_ParentId",
            Assert.IsType<PostgresException>(error.InnerException).ConstraintName);
    }

    [DbFact]
    public async Task A_resource_cannot_be_its_own_parent()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Resources.Add(Service("Hjelpetelefonen (Mental Helse)")));

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        // ExecuteUpdate skips change tracking, so the database alone has to refuse it. Depending
        // on the EF version the PostgresException arrives bare or wrapped; accept either.
        var error = await Record.ExceptionAsync(() =>
            db.Resources.ExecuteUpdateAsync(s => s.SetProperty(r => r.ParentId, r => r.Id)));
        var refused = error as PostgresException ?? error?.InnerException as PostgresException;
        Assert.Equal("CK_Resources_ParentId", refused?.ConstraintName);
    }

    [DbTheory]
    [InlineData(0)]
    [InlineData(10)]
    public async Task A_phone_menu_option_outside_1_to_9_is_refused(int option)
    {
        using var factory = new VardeApiFactory();
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        var resource = Service("Arbeidslivstelefonen (Mental Helse)");
        resource.PhoneMenuOption = option;
        db.Resources.Add(resource);

        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal(
            "CK_Resources_PhoneMenuOption",
            Assert.IsType<PostgresException>(error.InnerException).ConstraintName);
    }

    [DbFact]
    public async Task A_phone_menu_option_on_a_row_without_a_phone_is_refused()
    {
        using var factory = new VardeApiFactory();
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        var resource = Service("Sidetmedord (Mental Helse)", phone: null);
        resource.Website = "https://sidetmedord.mentalhelse.no/";
        resource.PhoneMenuOption = 3;
        db.Resources.Add(resource);

        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal(
            "CK_Resources_PhoneMenuOption",
            Assert.IsType<PostgresException>(error.InnerException).ConstraintName);
    }
}

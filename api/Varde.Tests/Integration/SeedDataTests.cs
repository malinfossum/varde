using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Varde.Core;
using Varde.Data;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

/// <summary>
/// The only tests that keep the migration's seed rows. Every other test runs against an empty
/// directory — see VardeApiFactory.KeepSeedData.
///
/// Task 9 ships in three batches (see task-9-adaptation.md §9); the resource count grows
/// 22 → 44 → 91 as each batch's migration lands. This file always asserts against the current
/// cumulative total — batch 9a is 22 rows across all 8 municipalities and 9 categories.
/// </summary>
public class SeedDataTests
{
    [Fact]
    public async Task Migrations_seed_the_core_batch_across_all_municipalities()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Equal(22, await db.Resources.CountAsync());
        Assert.Equal(8, await db.Municipalities.CountAsync());
    }

    [Fact]
    public async Task Every_seeded_service_has_both_a_norwegian_and_an_english_description()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        foreach (var language in Language.Supported)
        {
            var missing = await db.Resources
                .Where(r => !r.Translations.Any(t => t.LanguageCode == language))
                .Select(r => r.Name)
                .ToListAsync();

            Assert.Empty(missing);
        }
    }

    [Fact]
    public async Task Every_seeded_service_has_a_last_verified_date_and_a_category()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Empty(await db.Resources
            .Where(r => r.LastVerified == default)
            .Select(r => r.Name)
            .ToListAsync());

        Assert.Empty(await db.Resources
            .Where(r => !r.ResourceCategories.Any())
            .Select(r => r.Name)
            .ToListAsync());
    }

    [Fact]
    public async Task Every_seeded_service_can_be_reached_by_phone_website_or_chat()
    {
        // A directory entry nobody can act on is worse than no entry: it costs a search and
        // returns nothing usable. Chat counts too — for some users it is the only safe channel.
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Empty(await db.Resources
            .Where(r => r.Phone == null && r.Website == null && r.ChatUrl == null)
            .Select(r => r.Name)
            .ToListAsync());
    }

    [Fact]
    public async Task Every_category_has_both_language_names()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var categories = await db.Categories.Include(c => c.Translations).ToListAsync();

        Assert.Equal(9, categories.Count);
        Assert.All(categories, c => Assert.Equal(2, c.Translations.Count));
    }

    [Fact]
    public async Task National_services_have_no_municipality()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Empty(await db.Resources
            .Where(r => r.IsNational && r.MunicipalityId != null)
            .Select(r => r.Name)
            .ToListAsync());
    }
}

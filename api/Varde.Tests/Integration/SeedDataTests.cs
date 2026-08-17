using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Varde.Core;
using Varde.Core.Dtos;
using Varde.Data;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

/// <summary>
/// The only tests that keep the migration's seed rows. Every other test runs against an empty
/// directory — see VardeApiFactory.KeepSeedData.
///
/// Task 9 ships in three batches (see task-9-adaptation.md §9); the resource count grows
/// 22 → 44 → 91 as each batch's migration lands. This file always asserts against the current
/// cumulative total — batch 9c adds Oslo (rows 201-247), bringing the total to 91.
/// </summary>
public class SeedDataTests
{
    [Fact]
    public async Task Migrations_seed_the_core_batch_across_all_municipalities()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Equal(91, await db.Resources.CountAsync());
        Assert.Equal(8, await db.Municipalities.CountAsync());
    }

    [Fact]
    public async Task Resource_12_serves_the_ring_municipalities_and_no_national_resource_has_coverage()
    {
        // Row 12 (Hamar interkommunale krisesenter) covers four kommuner beyond the one it sits
        // in — the ResourceMunicipality coverage join docs/seed-data-innlandet-ring.md's
        // Coverage map records for it. National resources rely on IsNational alone: they must
        // never carry coverage rows, or a municipality filter could show them twice.
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var servedNames = await db.ResourceMunicipalities
            .Where(rm => rm.ResourceId == 12)
            .Include(rm => rm.Municipality)
            .Select(rm => rm.Municipality.Name)
            .ToListAsync();

        Assert.Equal(
            new[] { "Ringsaker", "Stange", "Løten", "Elverum" }.OrderBy(n => n, StringComparer.Ordinal),
            servedNames.OrderBy(n => n, StringComparer.Ordinal));

        var nationalResourceIdsWithCoverage = await db.ResourceMunicipalities
            .Where(rm => rm.Resource.IsNational)
            .Select(rm => rm.ResourceId)
            .ToListAsync();

        Assert.Empty(nationalResourceIdsWithCoverage);
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

    [Fact]
    public async Task Municipality_filter_for_Loten_includes_the_coverage_joined_resources()
    {
        // Løten (municipality id 6) has no seeded services of its own — everything it shows
        // comes from the ResourceMunicipality coverage joins docs/seed-data-innlandet-ring.md's
        // "Coverage map" section records for rows 12, 14 and 118 (see
        // Resource_12_serves_the_ring_municipalities_and_no_national_resource_has_coverage
        // above for the direct-DB version of this check). This test guards the same fact through
        // the actual HTTP endpoint the frontend calls.
        using var factory = new VardeApiFactory { KeepSeedData = true };

        var result = await factory.CreateClient()
            .GetFromJsonAsync<PagedResult<ResourceDto>>("/api/resources?municipality=6&pageSize=100");

        Assert.NotNull(result);
        var ids = result.Items.Select(r => r.Id).ToList();
        Assert.Contains(12, ids);
        Assert.Contains(14, ids);
        Assert.Contains(118, ids);
    }

    [Fact]
    public async Task Paging_through_every_page_reaches_all_91_seeded_resources()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        var client = factory.CreateClient();
        const int pageSize = 10;

        var first = await client.GetFromJsonAsync<PagedResult<ResourceDto>>(
            $"/api/resources?page=1&pageSize={pageSize}");

        Assert.NotNull(first);
        Assert.Equal(91, first.TotalCount);

        var totalPages = (int)Math.Ceiling(first.TotalCount / (double)pageSize);
        var seenIds = new HashSet<int>(first.Items.Select(r => r.Id));

        for (var page = 2; page <= totalPages; page++)
        {
            var result = await client.GetFromJsonAsync<PagedResult<ResourceDto>>(
                $"/api/resources?page={page}&pageSize={pageSize}");

            Assert.NotNull(result);
            foreach (var id in result.Items.Select(r => r.Id))
            {
                seenIds.Add(id);
            }
        }

        Assert.Equal(91, seenIds.Count);
    }
}

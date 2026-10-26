using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Varde.Core;
using Varde.Core.Dtos;
using Varde.Core.Models;
using Varde.Data;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

/// <summary>
/// The only tests that keep the migration's seed rows. Every other test runs against an empty
/// directory — see VardeApiFactory.KeepSeedData.
///
/// Task 9 ships in three batches (see task-9-adaptation.md §9); the resource count grows
/// 22 → 44 → 91 as each batch's migration lands. This file always asserts against the current
/// cumulative total — batch 9c adds Oslo (rows 201-247), bringing the total to 91. Plan 4
/// Task 4 adds rows 23-25 (the national emergency numbers 110, 112, 113), bringing it to 94.
/// </summary>
public class SeedDataTests
{
    [DbFact]
    public async Task Migrations_seed_the_core_batch_across_all_municipalities()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Equal(94, await db.Resources.CountAsync());
        Assert.Equal(8, await db.Municipalities.CountAsync());
    }

    [DbFact]
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

    [DbFact]
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

    [DbFact]
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

    [DbFact]
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

    [DbFact]
    public async Task Every_category_has_both_language_names()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var categories = await db.Categories.Include(c => c.Translations).ToListAsync();

        Assert.Equal(9, categories.Count);
        Assert.All(categories, c => Assert.Equal(2, c.Translations.Count));
    }

    [DbFact]
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

    [DbFact]
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

    [DbFact]
    public async Task Paging_through_every_page_reaches_all_94_seeded_resources()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        var client = factory.CreateClient();
        const int pageSize = 10;

        var first = await client.GetFromJsonAsync<PagedResult<ResourceDto>>(
            $"/api/resources?page=1&pageSize={pageSize}");

        Assert.NotNull(first);
        Assert.Equal(94, first.TotalCount);

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

        Assert.Equal(94, seenIds.Count);
    }

    [DbFact]
    public async Task Always_open_flags_match_recorded_dognapent_hours_exactly()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var flagged = await db.Resources
            .Where(r => r.IsAlwaysOpen)
            .Select(r => r.Id)
            .OrderBy(id => id)
            .ToListAsync();

        var recorded = await db.Set<ResourceTranslation>()
            .Where(t => t.LanguageCode == "nb" && t.OpeningHours == "Døgnåpent")
            .Select(t => t.ResourceId)
            .OrderBy(id => id)
            .ToListAsync();

        Assert.Equal(recorded, flagged);          // flag ⇔ recorded verbatim hours, both directions
        Assert.Equal(13, flagged.Count); // 10 + rows 23-25 (nødnumre), source-verified 2026-09-09
    }

    [DbFact]
    public async Task Mental_Helse_sub_services_hang_off_row_1_one_level_deep()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var children = await db.Resources
            .Where(r => r.ParentId != null)
            .OrderBy(r => r.Id)
            .Select(r => new { r.Id, r.ParentId })
            .ToListAsync();

        Assert.Equal([9, 122], children.Select(c => c.Id));
        Assert.All(children, c => Assert.Equal(1, c.ParentId));

        // One level only: a resource with a parent never has children of its own. The database
        // cannot say this without a trigger, and the seed is the only writer, so this test does.
        Assert.Empty(await db.Resources
            .Where(r => r.ParentId != null && r.Children.Any())
            .Select(r => r.Id)
            .ToListAsync());
    }

    [DbFact]
    public async Task Row_9_carries_its_menu_option_as_data_not_prose()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var row9 = await db.Resources.Include(r => r.Translations).SingleAsync(r => r.Id == 9);

        Assert.Equal(3, row9.PhoneMenuOption);
        Assert.Equal(2, row9.Translations.Count);
        Assert.All(row9.Translations, t =>
        {
            Assert.DoesNotContain("tast 3", t.Description, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("option 3", t.Description, StringComparison.OrdinalIgnoreCase);
        });
    }

    [DbFact]
    public async Task Every_phone_menu_option_is_1_to_9_on_a_row_with_a_phone()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Empty(await db.Resources
            .Where(r => r.PhoneMenuOption != null
                && (r.PhoneMenuOption < 1 || r.PhoneMenuOption > 9 || r.Phone == null))
            .Select(r => r.Id)
            .ToListAsync());
        Assert.Equal(
            [9],
            await db.Resources.Where(r => r.PhoneMenuOption != null).Select(r => r.Id).ToListAsync());
    }

    [DbFact]
    public async Task Every_seeded_website_and_chat_link_is_absolute_https()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Empty(SeedGuards.LinkProblems(await db.Resources.ToListAsync()));
    }

    [DbFact]
    public async Task Cost_and_cost_notes_agree_and_keep_their_numbers_across_languages()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        var resources = await db.Resources.Include(r => r.Translations).ToListAsync();

        Assert.Empty(SeedGuards.CostProblems(resources));
        Assert.Empty(SeedGuards.NumberProblems(resources));
    }

    [DbFact]
    public async Task Every_lavterskel_badge_has_a_referral_quote_in_its_seed_doc_and_back()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var root = SeedDocs.RepoRoot();
        var quotes = new Dictionary<int, string>();
        foreach (var doc in SeedDocs.WithReferralQuotes)
            foreach (var (row, quote) in SeedDocs.ReferralQuotes(File.ReadAllText(Path.Combine(root, doc))))
                Assert.True(quotes.TryAdd(row, quote), $"row {row} appears in two seed docs");

        var seeded = await db.Resources.Select(r => r.Id).ToListAsync();
        var badged = (await db.Resources.Where(r => r.IsLowThreshold).Select(r => r.Id).ToListAsync()).ToHashSet();

        Assert.Empty(SeedDocs.BadgeProblems(seeded, badged, quotes));
    }
}

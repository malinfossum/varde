using Microsoft.Extensions.DependencyInjection;
using Varde.Core.Interfaces;
using Varde.Core.Models;
using Varde.Data;
using Varde.Data.Repositories;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class ResourceRepositoryTests
{
    private static readonly DateOnly Verified = new(2026, 8, 13);

    private static IResourceRepository RepositoryFor(IServiceScope scope) =>
        new ResourceRepository(scope.ServiceProvider.GetRequiredService<VardeDbContext>());

    private static Resource NewResource(
        string name,
        bool isNational = false,
        int? municipalityId = null,
        string nb = "Beskrivelse.",
        string? en = "Description.") =>
        new()
        {
            Name = name,
            IsNational = isNational,
            MunicipalityId = municipalityId,
            LastVerified = Verified,
            Translations = en is null
                ? [new ResourceTranslation { LanguageCode = "nb", Description = nb }]
                :
                [
                    new ResourceTranslation { LanguageCode = "nb", Description = nb },
                    new ResourceTranslation { LanguageCode = "en", Description = en },
                ],
        };

    [Fact]
    public async Task Search_matches_name_case_insensitively()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            db.Resources.Add(NewResource("Hamar Krisesenter"));
            db.Resources.Add(NewResource("Gjeldsrådgivning Gjøvik"));
        });

        using var scope = factory.NewScope();
        var (items, total) = await RepositoryFor(scope)
            .SearchAsync(new ResourceQuery("KRISESENTER", [], null, "nb", 1, 20));

        Assert.Equal(1, total);
        Assert.Equal("Hamar Krisesenter", Assert.Single(items).Name);
    }

    [Fact]
    public async Task Search_matches_the_description_in_the_requested_language_only()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Resources.Add(
            NewResource("NAV Hamar", nb: "Hjelp med økonomi.", en: "Help with debt.")));

        using var scope = factory.NewScope();
        var repository = RepositoryFor(scope);

        var norwegian = await repository.SearchAsync(new ResourceQuery("økonomi", [], null, "nb", 1, 20));
        var english = await repository.SearchAsync(new ResourceQuery("debt", [], null, "en", 1, 20));
        var wrongLanguage = await repository.SearchAsync(new ResourceQuery("debt", [], null, "nb", 1, 20));

        Assert.Equal(1, norwegian.TotalCount);
        Assert.Equal(1, english.TotalCount);
        Assert.Equal(0, wrongLanguage.TotalCount);
    }

    [Fact]
    public async Task Search_treats_percent_as_a_literal_character_not_a_wildcard()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            db.Resources.Add(NewResource("Gjeldsrådgivning"));
            db.Resources.Add(NewResource("Rabatt 50% ordningen"));
        });

        using var scope = factory.NewScope();
        var (items, total) = await RepositoryFor(scope)
            .SearchAsync(new ResourceQuery("50%", [], null, "nb", 1, 20));

        Assert.Equal(1, total);
        Assert.Equal("Rabatt 50% ordningen", Assert.Single(items).Name);
    }

    [Fact]
    public async Task Municipality_filter_includes_national_services()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            db.Municipalities.Add(new Municipality { Name = "Hamar", County = "Innlandet" });
            db.Municipalities.Add(new Municipality { Name = "Gjøvik", County = "Innlandet" });
        });
        factory.Seed(db =>
        {
            db.Resources.Add(NewResource("Hamar Krisesenter", municipalityId: 1));
            db.Resources.Add(NewResource("Gjøvik Krisesenter", municipalityId: 2));
            db.Resources.Add(NewResource("Mental Helse", isNational: true));
        });

        using var scope = factory.NewScope();
        var (items, total) = await RepositoryFor(scope)
            .SearchAsync(new ResourceQuery(null, [], 1, "nb", 1, 20));

        Assert.Equal(2, total);
        Assert.Equal(["Hamar Krisesenter", "Mental Helse"], items.Select(r => r.Name));
    }

    [Fact]
    public async Task Category_filter_is_an_or_across_slugs()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            db.Categories.Add(new Category { Slug = "okonomi" });
            db.Categories.Add(new Category { Slug = "bolig" });
            db.Categories.Add(new Category { Slug = "rus" });
            db.Resources.Add(NewResource("A"));
            db.Resources.Add(NewResource("B"));
            db.Resources.Add(NewResource("C"));
        });
        factory.Seed(db =>
        {
            db.ResourceCategories.Add(new ResourceCategory { ResourceId = 1, CategoryId = 1 });
            db.ResourceCategories.Add(new ResourceCategory { ResourceId = 2, CategoryId = 2 });
            db.ResourceCategories.Add(new ResourceCategory { ResourceId = 3, CategoryId = 3 });
        });

        using var scope = factory.NewScope();
        var (items, total) = await RepositoryFor(scope)
            .SearchAsync(new ResourceQuery(null, ["okonomi", "bolig"], null, "nb", 1, 20));

        Assert.Equal(2, total);
        Assert.Equal(["A", "B"], items.Select(r => r.Name));
    }

    [Fact]
    public async Task Local_services_sort_before_national_ones_then_by_name()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Municipalities.Add(new Municipality { Name = "Hamar", County = "Innlandet" }));
        factory.Seed(db =>
        {
            db.Resources.Add(NewResource("Alfa Nasjonal", isNational: true));
            db.Resources.Add(NewResource("Omega Lokal", municipalityId: 1));
            db.Resources.Add(NewResource("Beta Lokal", municipalityId: 1));
        });

        using var scope = factory.NewScope();
        var (items, _) = await RepositoryFor(scope)
            .SearchAsync(new ResourceQuery(null, [], null, "nb", 1, 20));

        Assert.Equal(["Beta Lokal", "Omega Lokal", "Alfa Nasjonal"], items.Select(r => r.Name));
    }

    [Fact]
    public async Task Paging_is_stable_across_pages_when_names_collide()
    {
        // 25 services sharing one name: only the Id tiebreaker makes the sort total. Without it,
        // PostgreSQL may return the same row on two pages and never return another.
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            for (var i = 0; i < 25; i++) db.Resources.Add(NewResource("NAV"));
        });

        using var scope = factory.NewScope();
        var repository = RepositoryFor(scope);

        var page1 = await repository.SearchAsync(new ResourceQuery(null, [], null, "nb", 1, 10));
        var page2 = await repository.SearchAsync(new ResourceQuery(null, [], null, "nb", 2, 10));
        var page3 = await repository.SearchAsync(new ResourceQuery(null, [], null, "nb", 3, 10));

        var ids = page1.Items.Concat(page2.Items).Concat(page3.Items).Select(r => r.Id).ToList();

        Assert.Equal(25, page1.TotalCount);
        Assert.Equal(25, ids.Count);
        Assert.Equal(25, ids.Distinct().Count());
        Assert.Equal(5, page3.Items.Count);
    }

    [Fact]
    public async Task Get_returns_null_for_an_unknown_id()
    {
        using var factory = new VardeApiFactory();

        using var scope = factory.NewScope();
        Assert.Null(await RepositoryFor(scope).GetAsync(9999));
    }

    [Fact]
    public async Task Municipality_filter_includes_services_that_cover_the_municipality()
    {
        // A krisesenter sits in one kommune and serves others. Filtering on a served kommune
        // must find it; filtering on an unrelated kommune must not.
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            db.Municipalities.Add(new Municipality { Name = "Hamar", County = "Innlandet" });
            db.Municipalities.Add(new Municipality { Name = "Ringsaker", County = "Innlandet" });
            db.Municipalities.Add(new Municipality { Name = "Gjøvik", County = "Innlandet" });
        });
        factory.Seed(db => db.Resources.Add(NewResource("Hamar Krisesenter", municipalityId: 1)));
        factory.Seed(db => db.ResourceMunicipalities.Add(
            new ResourceMunicipality { ResourceId = 1, MunicipalityId = 2 }));

        using var scope = factory.NewScope();
        var repository = RepositoryFor(scope);

        var home = await repository.SearchAsync(new ResourceQuery(null, [], 1, "nb", 1, 20));
        var served = await repository.SearchAsync(new ResourceQuery(null, [], 2, "nb", 1, 20));
        var unrelated = await repository.SearchAsync(new ResourceQuery(null, [], 3, "nb", 1, 20));

        Assert.Equal(1, home.TotalCount);
        Assert.Equal(1, served.TotalCount);
        Assert.Equal(0, unrelated.TotalCount);
    }

    [Fact]
    public async Task Get_loads_translations_municipality_and_categories()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            db.Municipalities.Add(new Municipality { Name = "Hamar", County = "Innlandet" });
            db.Categories.Add(new Category { Slug = "okonomi" });
        });
        factory.Seed(db => db.Resources.Add(NewResource("NAV Hamar", municipalityId: 1)));
        factory.Seed(db => db.ResourceCategories.Add(
            new ResourceCategory { ResourceId = 1, CategoryId = 1 }));

        using var scope = factory.NewScope();
        var resource = await RepositoryFor(scope).GetAsync(1);

        Assert.NotNull(resource);
        Assert.Equal("Hamar", resource.Municipality?.Name);
        Assert.Equal(2, resource.Translations.Count);
        Assert.Equal("okonomi", Assert.Single(resource.ResourceCategories).Category.Slug);
    }
}

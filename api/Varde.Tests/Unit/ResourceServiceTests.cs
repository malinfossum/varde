using Varde.Core.Models;
using Varde.Core.Services;

namespace Varde.Tests.Unit;

public class ResourceServiceTests
{
    private static readonly DateOnly Verified = new(2026, 8, 13);

    private static Resource Bilingual() => new()
    {
        Id = 1,
        Name = "NAV Hamar",
        IsNational = false,
        LastVerified = Verified,
        Municipality = new Municipality { Id = 1, Name = "Hamar", County = "Innlandet" },
        MunicipalityId = 1,
        Address = "Vangsvegen 1, 2317 Hamar",
        Phone = "62 00 00 00",
        Email = "nav.hamar@nav.no",
        Website = "https://nav.no/hamar",
        ChatUrl = "https://chat.example.test",
        Translations =
        [
            new ResourceTranslation { LanguageCode = "nb", Description = "Hjelp med økonomi." },
            new ResourceTranslation { LanguageCode = "en", Description = "Help with finances." },
        ],
    };

    private static Resource NorwegianOnly() => new()
    {
        Id = 2,
        Name = "Hamar Krisesenter",
        LastVerified = Verified,
        Translations =
        [
            new ResourceTranslation { LanguageCode = "nb", Description = "Tilbud til voldsutsatte." },
        ],
    };

    [Fact]
    public async Task Search_normalises_an_unknown_language_to_nb_before_querying()
    {
        var repository = new FakeResourceRepository();
        var service = new ResourceService(repository);

        await service.SearchAsync("krise", null, null, false, "klingon", null, null, CancellationToken.None);

        Assert.Equal("nb", repository.LastQuery?.Lang);
    }

    [Fact]
    public async Task Search_clamps_page_size_to_100_and_page_to_at_least_1()
    {
        var repository = new FakeResourceRepository();
        var service = new ResourceService(repository);

        await service.SearchAsync(null, null, null, false, null, -3, 5000, CancellationToken.None);

        Assert.Equal(1, repository.LastQuery?.Page);
        Assert.Equal(100, repository.LastQuery?.PageSize);
    }

    [Fact]
    public async Task Search_returns_the_paged_envelope()
    {
        var repository = new FakeResourceRepository([Bilingual()], totalCount: 137);
        var service = new ResourceService(repository);

        var result = await service.SearchAsync(null, null, null, false, null, 2, 20, CancellationToken.None);

        Assert.Equal(2, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.Equal(137, result.TotalCount);
        Assert.Single(result.Items);
    }

    [Fact]
    public async Task Search_returns_the_requested_language_without_a_fallback_flag()
    {
        var service = new ResourceService(new FakeResourceRepository([Bilingual()]));

        var result = await service.SearchAsync(null, null, null, false, "en", null, null, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal("Help with finances.", item.Description);
        Assert.False(item.IsFallbackTranslation);
        Assert.Equal("NAV Hamar", item.Name);          // names are never translated
        Assert.Equal("Hamar", item.MunicipalityName);
    }

    [Fact]
    public async Task Search_falls_back_to_norwegian_and_says_so()
    {
        var service = new ResourceService(new FakeResourceRepository([NorwegianOnly()]));

        var result = await service.SearchAsync(null, null, null, false, "en", null, null, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal("Tilbud til voldsutsatte.", item.Description);
        Assert.True(item.IsFallbackTranslation);
    }

    [Fact]
    public async Task Search_passes_categories_through_and_defaults_them_to_empty()
    {
        var repository = new FakeResourceRepository();
        var service = new ResourceService(repository);

        await service.SearchAsync(null, null, null, false, null, null, null, CancellationToken.None);
        Assert.Empty(repository.LastQuery!.Categories);

        await service.SearchAsync(null, ["okonomi", "bolig"], null, false, null, null, null, CancellationToken.None);
        Assert.Equal(["okonomi", "bolig"], repository.LastQuery!.Categories);
    }

    [Fact]
    public async Task Search_passes_national_flag_to_query()
    {
        var repository = new FakeResourceRepository();
        var service = new ResourceService(repository);

        await service.SearchAsync(null, null, null, true, null, null, null, CancellationToken.None);

        Assert.True(repository.LastQuery!.NationalOnly);
    }

    [Fact]
    public async Task Get_returns_null_for_an_unknown_id()
    {
        var service = new ResourceService(new FakeResourceRepository([Bilingual()]));

        Assert.Null(await service.GetAsync(9999, null, CancellationToken.None));
    }

    [Fact]
    public async Task Get_maps_last_verified_and_contact_fields()
    {
        var service = new ResourceService(new FakeResourceRepository([Bilingual()]));

        var dto = await service.GetAsync(1, "nb", CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(Verified, dto.LastVerified);
        Assert.Equal("Hjelp med økonomi.", dto.Description);
        Assert.Equal("Vangsvegen 1, 2317 Hamar", dto.Address);
        Assert.Equal("62 00 00 00", dto.Phone);
        Assert.Equal("nav.hamar@nav.no", dto.Email);
        Assert.Equal("https://nav.no/hamar", dto.Website);
        Assert.Equal("https://chat.example.test", dto.ChatUrl);
        Assert.Equal(1, dto.MunicipalityId);
        Assert.False(dto.IsNational);
    }

    [Fact]
    public async Task Opening_hours_come_from_the_requested_language()
    {
        var resource = Bilingual();
        resource.Translations[0].OpeningHours = "Mandag og onsdag 11:30–13:00";
        resource.Translations[1].OpeningHours = "Monday and Wednesday 11:30–13:00";
        var service = new ResourceService(new FakeResourceRepository([resource]));

        var norwegian = await service.SearchAsync(null, null, null, false, "nb", null, null, CancellationToken.None);
        var english = await service.SearchAsync(null, null, null, false, "en", null, null, CancellationToken.None);

        Assert.Equal("Mandag og onsdag 11:30–13:00", Assert.Single(norwegian.Items).OpeningHours);
        Assert.Equal("Monday and Wednesday 11:30–13:00", Assert.Single(english.Items).OpeningHours);
    }

    [Fact]
    public async Task Opening_hours_fall_back_with_the_description()
    {
        var resource = NorwegianOnly();
        resource.Translations[0].OpeningHours = "Døgnåpent";
        var service = new ResourceService(new FakeResourceRepository([resource]));

        var result = await service.SearchAsync(null, null, null, false, "en", null, null, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal("Døgnåpent", item.OpeningHours);
        Assert.True(item.IsFallbackTranslation);
    }

    [Fact]
    public async Task Opening_hours_are_null_when_the_service_did_not_state_them()
    {
        var service = new ResourceService(new FakeResourceRepository([Bilingual()]));

        var result = await service.SearchAsync(null, null, null, false, "nb", null, null, CancellationToken.None);

        Assert.Null(Assert.Single(result.Items).OpeningHours);
    }

    [Fact]
    public async Task Get_maps_categories_ordered_by_slug_with_per_category_fallback()
    {
        var bolig = new Category
        {
            Id = 3,
            Slug = "bolig",
            Translations =
            [
                new CategoryTranslation { LanguageCode = "nb", Name = "Bolig" },
                new CategoryTranslation { LanguageCode = "en", Name = "Housing" },
            ],
        };
        var utdanning = new Category
        {
            Id = 7,
            Slug = "utdanning",
            Translations =
            [
                new CategoryTranslation { LanguageCode = "nb", Name = "Utdanning" },
            ],
        };

        var resource = Bilingual();
        // Added out of alphabetical order (utdanning, then bolig) so the test proves
        // ToDto's OrderBy(c => c.Slug) is what puts bolig first, not insertion order.
        resource.ResourceCategories =
        [
            new ResourceCategory { CategoryId = utdanning.Id, Category = utdanning },
            new ResourceCategory { CategoryId = bolig.Id, Category = bolig },
        ];

        var service = new ResourceService(new FakeResourceRepository([resource]));

        var dto = await service.GetAsync(1, "en", CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(2, dto.Categories.Count);

        var first = dto.Categories[0];
        Assert.Equal(bolig.Id, first.Id);
        Assert.Equal("bolig", first.Slug);
        Assert.Equal("Housing", first.Name);
        Assert.False(first.IsFallbackTranslation);

        var second = dto.Categories[1];
        Assert.Equal(utdanning.Id, second.Id);
        Assert.Equal("utdanning", second.Slug);
        Assert.Equal("Utdanning", second.Name);
        Assert.True(second.IsFallbackTranslation);
    }

    [Fact]
    public async Task Get_maps_the_low_threshold_badge_cost_and_cost_note()
    {
        var resource = Bilingual();
        resource.IsLowThreshold = true;
        resource.Cost = ResourceCost.Partly;
        resource.Translations[0].CostNote = "Kaffe 20 kr, aktivitetene er gratis";
        resource.Translations[1].CostNote = "Coffee 20 kr, the activities are free";
        var service = new ResourceService(new FakeResourceRepository([resource]));

        var norwegian = await service.GetAsync(1, "nb", CancellationToken.None);
        var english = await service.GetAsync(1, "en", CancellationToken.None);

        Assert.NotNull(norwegian);
        Assert.NotNull(english);
        Assert.True(norwegian.IsLowThreshold);
        Assert.Equal("partly", norwegian.Cost);
        Assert.Equal("Kaffe 20 kr, aktivitetene er gratis", norwegian.CostNote);
        Assert.Equal("Coffee 20 kr, the activities are free", english.CostNote);
    }

    [Theory]
    [InlineData(ResourceCost.Free, "free")]
    [InlineData(ResourceCost.Paid, "paid")]
    [InlineData(ResourceCost.Partly, "partly")]
    [InlineData(null, null)]
    public async Task Cost_maps_to_its_lowercase_name_and_not_stated_stays_null(ResourceCost? cost, string? expected)
    {
        var resource = Bilingual();
        resource.Cost = cost;
        var service = new ResourceService(new FakeResourceRepository([resource]));

        var dto = await service.GetAsync(1, "nb", CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(expected, dto.Cost);
    }

    [Fact]
    public async Task Cost_note_falls_back_with_the_description()
    {
        // Review Focus 3: an English request for a Norwegian-only row gets the Norwegian price
        // with the Norwegian description, never a mix.
        var resource = NorwegianOnly();
        resource.Cost = ResourceCost.Paid;
        resource.Translations[0].CostNote = "Egenandel 50 kr";
        var service = new ResourceService(new FakeResourceRepository([resource]));

        var result = await service.SearchAsync(null, null, null, false, "en", null, null, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal("Egenandel 50 kr", item.CostNote);
        Assert.Equal("Tilbud til voldsutsatte.", item.Description);
        Assert.True(item.IsFallbackTranslation);
    }

    [Fact]
    public async Task A_row_without_badge_or_cost_maps_to_false_and_nulls()
    {
        var service = new ResourceService(new FakeResourceRepository([Bilingual()]));

        var dto = await service.GetAsync(1, "nb", CancellationToken.None);

        Assert.NotNull(dto);
        Assert.False(dto.IsLowThreshold);
        Assert.Null(dto.Cost);
        Assert.Null(dto.CostNote);
    }
}

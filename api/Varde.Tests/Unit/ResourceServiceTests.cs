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
        LastVerified = Verified,
        Municipality = new Municipality { Id = 1, Name = "Hamar", County = "Innlandet" },
        MunicipalityId = 1,
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

        await service.SearchAsync("krise", null, null, "klingon", null, null, CancellationToken.None);

        Assert.Equal("nb", repository.LastQuery?.Lang);
    }

    [Fact]
    public async Task Search_clamps_page_size_to_100_and_page_to_at_least_1()
    {
        var repository = new FakeResourceRepository();
        var service = new ResourceService(repository);

        await service.SearchAsync(null, null, null, null, -3, 5000, CancellationToken.None);

        Assert.Equal(1, repository.LastQuery?.Page);
        Assert.Equal(100, repository.LastQuery?.PageSize);
    }

    [Fact]
    public async Task Search_returns_the_paged_envelope()
    {
        var repository = new FakeResourceRepository([Bilingual()], totalCount: 137);
        var service = new ResourceService(repository);

        var result = await service.SearchAsync(null, null, null, null, 2, 20, CancellationToken.None);

        Assert.Equal(2, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.Equal(137, result.TotalCount);
        Assert.Single(result.Items);
    }

    [Fact]
    public async Task Search_returns_the_requested_language_without_a_fallback_flag()
    {
        var service = new ResourceService(new FakeResourceRepository([Bilingual()]));

        var result = await service.SearchAsync(null, null, null, "en", null, null, CancellationToken.None);

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

        var result = await service.SearchAsync(null, null, null, "en", null, null, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal("Tilbud til voldsutsatte.", item.Description);
        Assert.True(item.IsFallbackTranslation);
    }

    [Fact]
    public async Task Search_passes_categories_through_and_defaults_them_to_empty()
    {
        var repository = new FakeResourceRepository();
        var service = new ResourceService(repository);

        await service.SearchAsync(null, null, null, null, null, null, CancellationToken.None);
        Assert.Empty(repository.LastQuery!.Categories);

        await service.SearchAsync(null, ["okonomi", "bolig"], null, null, null, null, CancellationToken.None);
        Assert.Equal(["okonomi", "bolig"], repository.LastQuery!.Categories);
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
    }
}

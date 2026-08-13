using System.Net.Http.Json;
using Varde.Core.Dtos;
using Varde.Core.Models;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class CategoriesApiTests
{
    private static void SeedTwoCategories(VardeApiFactory factory) => factory.Seed(db =>
    {
        db.Categories.Add(new Category
        {
            Slug = "okonomi",
            Translations =
            {
                new CategoryTranslation { LanguageCode = "nb", Name = "Økonomi" },
                new CategoryTranslation { LanguageCode = "en", Name = "Finances" },
            },
        });
        db.Categories.Add(new Category
        {
            Slug = "bolig",
            Translations =
            {
                // Deliberately Norwegian-only — the fallback path.
                new CategoryTranslation { LanguageCode = "nb", Name = "Bolig" },
            },
        });
    });

    [Fact]
    public async Task Get_returns_norwegian_names_by_default()
    {
        using var factory = new VardeApiFactory();
        SeedTwoCategories(factory);

        var categories = await factory.CreateClient()
            .GetFromJsonAsync<List<CategoryDto>>("/api/categories");

        Assert.NotNull(categories);
        Assert.Equal(["Bolig", "Økonomi"], categories.Select(c => c.Name).Order());
        Assert.All(categories, c => Assert.False(c.IsFallbackTranslation));
    }

    [Fact]
    public async Task Get_with_lang_en_returns_english_and_flags_the_fallback()
    {
        using var factory = new VardeApiFactory();
        SeedTwoCategories(factory);

        var categories = await factory.CreateClient()
            .GetFromJsonAsync<List<CategoryDto>>("/api/categories?lang=en");

        Assert.NotNull(categories);

        var finances = Assert.Single(categories, c => c.Slug == "okonomi");
        Assert.Equal("Finances", finances.Name);
        Assert.False(finances.IsFallbackTranslation);

        var housing = Assert.Single(categories, c => c.Slug == "bolig");
        Assert.Equal("Bolig", housing.Name);
        Assert.True(housing.IsFallbackTranslation);
    }

    [Fact]
    public async Task Get_with_an_unknown_lang_falls_back_to_nb_and_does_not_error()
    {
        using var factory = new VardeApiFactory();
        SeedTwoCategories(factory);

        var response = await factory.CreateClient().GetAsync("/api/categories?lang=klingon");

        response.EnsureSuccessStatusCode();
        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(categories);
        Assert.Contains(categories, c => c.Name == "Økonomi");
    }
}

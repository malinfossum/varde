using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Varde.Core.Dtos;
using Varde.Core.Models;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class ResourcesApiTests
{
    private static readonly DateOnly Verified = new(2026, 8, 13);

    private static void SeedDirectory(VardeApiFactory factory)
    {
        factory.Seed(db =>
        {
            db.Municipalities.Add(new Municipality { Name = "Hamar", County = "Innlandet" });
            db.Categories.Add(new Category
            {
                Slug = "okonomi",
                Translations =
                {
                    new CategoryTranslation { LanguageCode = "nb", Name = "Økonomi" },
                    new CategoryTranslation { LanguageCode = "en", Name = "Finances" },
                },
            });
        });

        factory.Seed(db =>
        {
            db.Resources.Add(new Resource
            {
                Name = "NAV Hamar",
                MunicipalityId = 1,
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                Translations =
                {
                    new ResourceTranslation { LanguageCode = "nb", Description = "Hjelp med økonomi." },
                    new ResourceTranslation { LanguageCode = "en", Description = "Help with finances." },
                },
            });
            db.Resources.Add(new Resource
            {
                Name = "Mental Helse",
                IsNational = true,
                Phone = "116 123",
                LastVerified = Verified,
                Translations =
                {
                    new ResourceTranslation { LanguageCode = "nb", Description = "Døgnåpen hjelpetelefon." },
                },
            });
        });

        factory.Seed(db => db.ResourceCategories.Add(
            new ResourceCategory { ResourceId = 1, CategoryId = 1 }));
    }

    [Fact]
    public async Task Get_returns_the_paged_envelope_with_defaults()
    {
        using var factory = new VardeApiFactory();
        SeedDirectory(factory);

        var result = await factory.CreateClient()
            .GetFromJsonAsync<PagedResult<ResourceDto>>("/api/resources");

        Assert.NotNull(result);
        Assert.Equal(1, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(["NAV Hamar", "Mental Helse"], result.Items.Select(r => r.Name));
    }

    [Fact]
    public async Task Get_filters_by_search_and_category_and_municipality()
    {
        using var factory = new VardeApiFactory();
        SeedDirectory(factory);
        var client = factory.CreateClient();

        var bySearch = await client.GetFromJsonAsync<PagedResult<ResourceDto>>("/api/resources?search=nav");
        var byCategory = await client.GetFromJsonAsync<PagedResult<ResourceDto>>("/api/resources?category=okonomi");
        var byMunicipality = await client.GetFromJsonAsync<PagedResult<ResourceDto>>("/api/resources?municipality=1");

        Assert.Equal("NAV Hamar", Assert.Single(bySearch!.Items).Name);
        Assert.Equal("NAV Hamar", Assert.Single(byCategory!.Items).Name);
        Assert.Equal(2, byMunicipality!.TotalCount);   // local plus national
    }

    [Fact]
    public async Task Get_accepts_a_repeated_category_parameter()
    {
        using var factory = new VardeApiFactory();
        SeedDirectory(factory);

        // A second, distinguishing category: a resource that belongs to "bolig" but not
        // "okonomi". If binding drops either query value, one of these three requests below
        // will return the wrong resource set.
        factory.Seed(db =>
        {
            db.Categories.Add(new Category
            {
                Slug = "bolig",
                Translations =
                {
                    new CategoryTranslation { LanguageCode = "nb", Name = "Bolig" },
                    new CategoryTranslation { LanguageCode = "en", Name = "Housing" },
                },
            });
        });

        factory.Seed(db =>
        {
            db.Resources.Add(new Resource
            {
                Name = "Husbanken",
                IsNational = true,
                Phone = "22 96 16 00",
                LastVerified = Verified,
                Translations =
                {
                    new ResourceTranslation { LanguageCode = "nb", Description = "Hjelp med bolig." },
                },
            });
        });

        factory.Seed(db => db.ResourceCategories.Add(
            new ResourceCategory { ResourceId = 3, CategoryId = 2 }));

        var client = factory.CreateClient();

        var both = await client.GetFromJsonAsync<PagedResult<ResourceDto>>(
            "/api/resources?category=okonomi&category=bolig");
        var okonomiOnly = await client.GetFromJsonAsync<PagedResult<ResourceDto>>(
            "/api/resources?category=okonomi");
        var boligOnly = await client.GetFromJsonAsync<PagedResult<ResourceDto>>(
            "/api/resources?category=bolig");

        Assert.NotNull(both);
        // Order comes from the repository's total order (IsNational, then Name): the local
        // NAV Hamar sorts before the national Husbanken.
        Assert.Equal(["NAV Hamar", "Husbanken"], both.Items.Select(r => r.Name));
        Assert.Equal("NAV Hamar", Assert.Single(okonomiOnly!.Items).Name);
        Assert.Equal("Husbanken", Assert.Single(boligOnly!.Items).Name);
    }

    [Fact]
    public async Task Get_with_an_unknown_lang_returns_200_in_norwegian()
    {
        using var factory = new VardeApiFactory();
        SeedDirectory(factory);

        var response = await factory.CreateClient().GetAsync("/api/resources?lang=klingon");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ResourceDto>>();
        Assert.Equal("Hjelp med økonomi.", result!.Items.Single(r => r.Id == 1).Description);
    }

    [Fact]
    public async Task Get_by_id_returns_the_resource_with_its_categories()
    {
        using var factory = new VardeApiFactory();
        SeedDirectory(factory);

        var resource = await factory.CreateClient()
            .GetFromJsonAsync<ResourceDto>("/api/resources/1?lang=en");

        Assert.NotNull(resource);
        Assert.Equal("NAV Hamar", resource.Name);
        Assert.Equal("Help with finances.", resource.Description);
        Assert.Equal("Finances", Assert.Single(resource.Categories).Name);
        Assert.Equal(Verified, resource.LastVerified);
    }

    [Fact]
    public async Task Get_by_unknown_id_returns_404_problem_details()
    {
        using var factory = new VardeApiFactory();
        SeedDirectory(factory);

        var response = await factory.CreateClient().GetAsync("/api/resources/9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains(
            "application/problem+json",
            response.Content.Headers.ContentType?.ToString());

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task Get_clamps_an_oversized_page_size()
    {
        using var factory = new VardeApiFactory();
        SeedDirectory(factory);

        var result = await factory.CreateClient()
            .GetFromJsonAsync<PagedResult<ResourceDto>>("/api/resources?pageSize=5000");

        Assert.Equal(100, result!.PageSize);
    }
}

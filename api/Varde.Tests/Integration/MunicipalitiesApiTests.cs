using System.Net.Http.Json;
using Varde.Core.Dtos;
using Varde.Core.Models;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class MunicipalitiesApiTests
{
    [Fact]
    public async Task Get_returns_municipalities_sorted_by_name()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db =>
        {
            db.Municipalities.Add(new Municipality { Name = "Lillehammer", County = "Innlandet" });
            db.Municipalities.Add(new Municipality { Name = "Gjøvik", County = "Innlandet" });
            db.Municipalities.Add(new Municipality { Name = "Hamar", County = "Innlandet" });
        });

        var municipalities = await factory.CreateClient()
            .GetFromJsonAsync<List<MunicipalityDto>>("/api/municipalities");

        Assert.NotNull(municipalities);
        Assert.Equal(["Gjøvik", "Hamar", "Lillehammer"], municipalities.Select(m => m.Name));
        Assert.All(municipalities, m => Assert.Equal("Innlandet", m.County));
    }
}

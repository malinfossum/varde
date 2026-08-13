using System.Net;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class SmokeTests
{
    [Fact]
    public async Task App_boots_against_postgres_and_returns_404_for_an_unknown_route()
    {
        using var factory = new VardeApiFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/nothing-here");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

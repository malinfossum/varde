using System.Net;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class ProductionStartupTests
{
    [Fact]
    public async Task Production_startup_applies_migrations_and_seed()
    {
        // KeepSeedData: this test asserts the migrated seed is queryable, so don't truncate.
        using var factory = new VardeApiFactory { Environment = "Production", KeepSeedData = true };
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Production_does_not_expose_openapi()
    {
        // Guard, not new behavior: MapOpenApi stays inside the Development branch.
        using var factory = new VardeApiFactory { Environment = "Production", KeepSeedData = true };
        var client = factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

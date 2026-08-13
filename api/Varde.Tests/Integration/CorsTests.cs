using System.Net.Http.Headers;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class CorsTests
{
    [Fact]
    public async Task A_configured_origin_gets_an_allow_origin_header()
    {
        using var factory = new VardeApiFactory();
        var client = factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/municipalities");
        request.Headers.Add("Origin", "http://localhost:5173");

        var response = await client.SendAsync(request);

        Assert.Equal(
            "http://localhost:5173",
            response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task An_unlisted_origin_gets_no_allow_origin_header()
    {
        using var factory = new VardeApiFactory();
        var client = factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/municipalities");
        request.Headers.Add("Origin", "https://evil.example");

        var response = await client.SendAsync(request);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }
}

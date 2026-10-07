using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class CorsTests
{
    // No browser calls the API, so no origin may read its responses. The old dev origin is
    // included on purpose: it was the last one allowed.
    [DbTheory]
    [InlineData("http://localhost:5173")]
    [InlineData("https://evil.example")]
    public async Task No_origin_gets_an_allow_origin_header(string origin)
    {
        using var factory = new VardeApiFactory();
        var client = factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/municipalities");
        request.Headers.Add("Origin", origin);

        var response = await client.SendAsync(request);

        Assert.True(response.IsSuccessStatusCode);
        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }
}

using System.Net;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class RateLimitTests
{
    [Fact]
    public async Task Requests_beyond_the_window_limit_return_429()
    {
        using var factory = new VardeApiFactory { RateLimitPermitLimit = 3 };
        var client = factory.CreateClient();

        for (var i = 0; i < 3; i++)
        {
            var allowed = await client.GetAsync("/api/resources");
            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }

        var rejected = await client.GetAsync("/api/resources");

        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
    }
}

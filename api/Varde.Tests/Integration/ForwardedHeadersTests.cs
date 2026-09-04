using System.Net;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class ForwardedHeadersTests
{
    private static HttpRequestMessage Get(string forwardedFor)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/resources");
        request.Headers.Add("X-Forwarded-For", forwardedFor);
        return request;
    }

    [Fact]
    public async Task Rate_limit_buckets_partition_by_forwarded_client_ip()
    {
        using var factory = new VardeApiFactory { RateLimitPermitLimit = 3 };
        var client = factory.CreateClient();

        for (var i = 0; i < 3; i++)
        {
            var allowed = await client.SendAsync(Get("203.0.113.10"));
            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }

        var exhausted = await client.SendAsync(Get("203.0.113.10"));
        Assert.Equal(HttpStatusCode.TooManyRequests, exhausted.StatusCode);

        // A different forwarded identity gets its own bucket — this is the assert that fails
        // today, because without the middleware every request shares the "unknown" partition.
        var otherIdentity = await client.SendAsync(Get("203.0.113.99"));
        Assert.Equal(HttpStatusCode.OK, otherIdentity.StatusCode);
    }

    [Fact]
    public async Task Only_the_rightmost_forwarded_entry_names_the_bucket()
    {
        // App Service APPENDS the real client IP to any client-supplied X-Forwarded-For, so
        // with ForwardLimit = 1 the right-most entry wins and spoofed prefixes are ignored.
        using var factory = new VardeApiFactory { RateLimitPermitLimit = 3 };
        var client = factory.CreateClient();

        for (var i = 0; i < 3; i++)
        {
            var allowed = await client.SendAsync(Get($"198.51.100.{i}, 203.0.113.10"));
            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }

        // Same spoofed prefix style, different right-most hop: different bucket, still 200.
        var realOther = await client.SendAsync(Get("203.0.113.10, 198.51.100.77"));
        Assert.Equal(HttpStatusCode.OK, realOther.StatusCode);

        // Right-most hop 203.0.113.10 again: that bucket is exhausted regardless of prefix.
        var exhausted = await client.SendAsync(Get("198.51.100.200, 203.0.113.10"));
        Assert.Equal(HttpStatusCode.TooManyRequests, exhausted.StatusCode);
    }
}

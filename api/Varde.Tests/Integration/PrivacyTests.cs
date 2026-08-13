using Varde.Core.Models;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class PrivacyTests
{
    [Fact]
    public async Task No_log_message_contains_the_search_term()
    {
        const string sensitiveTerm = "krisesenter";

        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Resources.Add(new Resource
        {
            Name = "Hamar Krisesenter",
            LastVerified = new DateOnly(2026, 8, 13),
            Translations =
            {
                new ResourceTranslation { LanguageCode = "nb", Description = "Tilbud til voldsutsatte." },
            },
        }));

        var response = await factory.CreateClient()
            .GetAsync($"/api/resources?search={sensitiveTerm}");
        response.EnsureSuccessStatusCode();

        Assert.DoesNotContain(
            factory.Logs.Messages,
            message => message.Contains(sensitiveTerm, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task The_result_count_is_logged()
    {
        using var factory = new VardeApiFactory();

        var response = await factory.CreateClient().GetAsync("/api/resources?search=noe");
        response.EnsureSuccessStatusCode();

        Assert.Contains(
            factory.Logs.Messages,
            message => message.Contains("Directory search returned 0 results"));
    }
}

using Varde.Tests.Infrastructure;

namespace Varde.Tests.Unit;

public class SeedDocsTests
{
    [Fact]
    public void A_badge_row_with_an_empty_quote_fails_the_guard()
    {
        const string doc = """
            | # | Name | Cost | Referral quote | Notes |
            |---|------|------|----------------|-------|
            | 301 | Værested A | free | "Du trenger ikke henvisning." | |
            | 302 | Værested B | free |  | |
            """;

        var problems = SeedDocs.BadgeProblems([301, 302], new HashSet<int> { 301, 302 }, SeedDocs.ReferralQuotes(doc));

        Assert.Equal(["row 302: badge without a referral quote"], problems);
    }

    [Fact]
    public void The_quote_column_is_found_by_its_header_not_its_position()
    {
        const string doc = """
            | # | Referral quote | Name |
            |---|----------------|------|
            | 15 | "Tilbudet er gratis og uten henvisning." | RPH |

            Some text between two tables.

            | Name | # | Cost | Referral quote |
            |------|---|------|----------------|
            | Café | 401 | partly | "Et lavterskeltilbud for alle." |
            """;

        var quotes = SeedDocs.ReferralQuotes(doc);

        Assert.Equal("\"Tilbudet er gratis og uten henvisning.\"", quotes[15]);
        Assert.Equal("\"Et lavterskeltilbud for alle.\"", quotes[401]);
    }

    [Fact]
    public void An_escaped_pipe_stays_inside_the_quote()
    {
        // A pipe in a verbatim quote must not shift the columns after it.
        const string doc = """
            | # | Referral quote | Cost |
            |---|----------------|------|
            | 7 | "Åpent for alle \| uten henvisning." | free |
            """;

        Assert.Equal("\"Åpent for alle | uten henvisning.\"", SeedDocs.ReferralQuotes(doc)[7]);
    }

    [Fact]
    public void A_quote_without_a_badge_fails_and_unseeded_rows_are_ignored()
    {
        const string doc = """
            | # | Referral quote |
            |---|----------------|
            | 301 | "Ingen henvisning nødvendig." |
            | 399 | "Uten henvisning." |
            """;

        var problems = SeedDocs.BadgeProblems([301], new HashSet<int>(), SeedDocs.ReferralQuotes(doc));

        Assert.Equal(["row 301: referral quote without a badge"], problems);
    }

    [Theory]
    [InlineData("NOT FOUND")]
    [InlineData("-")]
    [InlineData("\"Ring oss for en avtale.\"")]
    public void A_cell_that_is_not_a_quoted_badge_sentence_fails(string cell)
    {
        var doc = $"""
            | # | Referral quote |
            |---|----------------|
            | 301 | {cell} |
            """;

        var problems = SeedDocs.BadgeProblems([301], new HashSet<int> { 301 }, SeedDocs.ReferralQuotes(doc));

        Assert.Equal(["row 301: referral quote is not a quoted sentence naming a badge phrase"], problems);
    }

    [Fact]
    public void A_row_listed_twice_in_one_doc_throws()
    {
        const string doc = """
            | # | Referral quote |
            |---|----------------|
            | 301 | |
            | 301 | |
            """;

        Assert.Throws<InvalidOperationException>(() => SeedDocs.ReferralQuotes(doc));
    }
}

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

    private static IReadOnlySet<string> Set(params string[] slugs) => slugs.ToHashSet();

    [Fact]
    public void The_topic_column_is_read_by_its_header()
    {
        const string doc = """
            | # | Name | Topic | Referral quote |
            |---|------|-------|----------------|
            | 304 | CRUX Arbeideren | rus | |
            | 314 | Parkrun Ankerskogen | none | |
            """;

        var cells = SeedDocs.Topics(doc);

        Assert.Equal("rus", cells[304]);
        Assert.Equal("none", cells[314]);
    }

    [Fact]
    public void Seeded_topics_must_equal_the_doc_in_any_order()
    {
        var category10 = new Dictionary<int, IReadOnlySet<string>>
        {
            [329] = Set("rus", "psykisk-helse"),
            [314] = Set(),
            [304] = Set(),
        };
        var cells = new Dictionary<int, string>
        {
            [329] = "psykisk-helse, rus",
            [314] = "none",
            [304] = "rus",
        };

        Assert.Equal(
            ["row 304: seeded topics [] differ from the doc's [rus]"],
            SeedDocs.TopicProblems(category10, cells));
    }

    [Theory]
    [InlineData("psykisk helse", "row 301: topic \"psykisk helse\" is not a topic category")]
    [InlineData("lavterskeltilbud", "row 301: topic \"lavterskeltilbud\" is not a topic category")]
    [InlineData("nodtjenester", "row 301: topic \"nodtjenester\" is not a topic category")]
    [InlineData("none, rus", "row 301: topic \"none\" is not a topic category")]
    [InlineData("", "row 301: topic cell is empty; write the slugs or none")]
    public void A_topic_cell_the_guard_cannot_trust_fails_by_row(string cell, string problem)
    {
        var category10 = new Dictionary<int, IReadOnlySet<string>> { [301] = Set("psykisk-helse") };

        Assert.Equal([problem], SeedDocs.TopicProblems(category10, new Dictionary<int, string> { [301] = cell }));
    }

    [Fact]
    public void The_doc_and_category_10_must_list_the_same_rows()
    {
        var category10 = new Dictionary<int, IReadOnlySet<string>> { [301] = Set(), [302] = Set() };
        var cells = new Dictionary<int, string> { [301] = "none", [3011] = "none" };

        Assert.Equal(
            [
                "row 302: in category 10 but not in the reconcile doc",
                "row 3011: in the reconcile doc but not in category 10",
            ],
            SeedDocs.TopicProblems(category10, cells));
    }

    [Fact]
    public void An_override_replaces_the_older_quote_even_when_empty()
    {
        var retag = new Dictionary<int, string> { [115] = "\"Et lavterskeltilbud.\"", [8] = "" };
        var innlandet = new Dictionary<int, string> { [301] = "\"Du trenger ikke henvisning.\"" };
        var reconcile = new Dictionary<int, string> { [115] = "", [301] = "\"Du trenger ikke henvisning.\"" };

        var quotes = SeedDocs.MergeQuotes([retag, innlandet], [reconcile]);

        Assert.Equal("", quotes[115]);
        Assert.Equal("\"Du trenger ikke henvisning.\"", quotes[301]);
        Assert.Equal("", quotes[8]);
        Assert.Equal(
            ["row 115: badge without a referral quote"],
            SeedDocs.BadgeProblems([8, 115, 301], new HashSet<int> { 115, 301 }, quotes));
    }

    [Fact]
    public void A_row_in_two_base_docs_or_an_override_for_an_unknown_row_throws()
    {
        var a = new Dictionary<int, string> { [301] = "" };
        var b = new Dictionary<int, string> { [301] = "" };
        var stray = new Dictionary<int, string> { [3011] = "" };

        var twice = Assert.Throws<InvalidOperationException>(() => SeedDocs.MergeQuotes([a, b], []));
        Assert.Equal("row 301 appears in two seed docs", twice.Message);
        var unknown = Assert.Throws<InvalidOperationException>(() => SeedDocs.MergeQuotes([a], [stray]));
        Assert.Equal("row 3011 is in an override doc but in no earlier seed doc", unknown.Message);
    }

    [Fact]
    public void Topic_slugs_are_every_category_but_the_two_that_are_never_topics()
    {
        Assert.Equal(
            ["okonomi", "bolig", "psykisk-helse", "rus", "vold-og-overgrep", "familie-og-barn", "arbeid", "juridisk-hjelp"],
            SeedDocs.TopicSlugs);
    }
}

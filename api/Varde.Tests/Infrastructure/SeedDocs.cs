using System.Text.RegularExpressions;
using Varde.Data.Seed;

namespace Varde.Tests.Infrastructure;

/// <summary>
/// Reads the seed docs' markdown tables. The referral quote is the evidence behind every
/// Lavterskel badge, so the guard reads it from the doc the row was copied from instead of
/// trusting the seed on its own.
/// </summary>
public static partial class SeedDocs
{
    /// <summary>
    /// Docs whose rows are seeded and whose tables carry a "Referral quote" column. A doc joins
    /// this list in the task that seeds its rows, never earlier: a researched but unseeded doc
    /// would fail the "quote without a badge" direction for every row it quotes.
    /// </summary>
    public static readonly string[] WithReferralQuotes =
    [
        "docs/seed-data-lavterskel-retag.md",
        "docs/seed-data-lavterskel-innlandet.md",
    ];

    /// <summary>The lavterskel reconcile doc: one row per category 10 row, with its Topic and Referral quote.</summary>
    public const string Reconcile = "docs/seed-data-lavterskel-reconcile.md";

    /// <summary>
    /// Docs that re-settle rows an earlier doc in WithReferralQuotes already lists. Their Referral
    /// quote cell replaces the earlier one, an empty cell included. A doc joins this list in the
    /// task that seeds its rows, never earlier. The reconcile doc joined in the task that seeded it
    /// (gate closed 03.11.2026).
    /// </summary>
    public static readonly string[] Overrides = [Reconcile];

    /// <summary>
    /// The categories a category 10 row may carry as its topic: every category except
    /// lavterskeltilbud itself and nodtjenester, which is for acute services only.
    /// </summary>
    public static readonly string[] TopicSlugs = Categories.All
        .Select(c => c.Slug)
        .Where(slug => slug is not "lavterskeltilbud" and not "nodtjenester")
        .ToArray();

    /// <summary>
    /// The spec's badge rule: a referral quote must name one of these (case-insensitive). The last
    /// four were accepted at gate 1 (2026-10-26) because the cited pages say the same thing in
    /// other words. "lav terskel" only matches a source's own spelling; Varde writes "lavterskel".
    /// Accepted at the reconcile gate (03.11.2026): "ikke krav om henvisning", "ingen formell henvisning".
    /// </summary>
    public static readonly string[] BadgePhrases =
    [
        "uten henvisning", "ingen henvisning", "trenger ikke henvisning", "lavterskel",
        "trengs ikke henvisning", "trenger heller ikke henvisning", "krever ikke henvisning", "lav terskel",
        "ikke krav om henvisning", "ingen formell henvisning",
    ];

    /// <summary>The checkout's root: the first directory above the test binaries holding docs/seed-data.md.</summary>
    public static string RepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "docs", "seed-data.md")))
            dir = dir.Parent;
        return dir?.FullName
            ?? throw new InvalidOperationException($"No docs/seed-data.md above {AppContext.BaseDirectory}.");
    }

    /// <summary>
    /// Row number to referral-quote cell, for every table in <paramref name="markdown"/> whose
    /// header has both a "#" and a "Referral quote" column. Columns are found by header name,
    /// never by position. An empty cell maps to "". A row listed twice throws.
    /// </summary>
    public static Dictionary<int, string> ReferralQuotes(string markdown) => Column(markdown, "Referral quote");

    /// <summary>Row number to raw Topic cell, read like ReferralQuotes. TopicProblems judges the cell.</summary>
    public static Dictionary<int, string> Topics(string markdown) => Column(markdown, "Topic");

    /// <summary>
    /// Row number to the cell under <paramref name="header"/>, for every table in
    /// <paramref name="markdown"/> whose header has both a "#" and that column. Columns are found
    /// by header name, never by position. An empty cell maps to "". A row listed twice throws.
    /// </summary>
    private static Dictionary<int, string> Column(string markdown, string header)
    {
        var values = new Dictionary<int, string>();
        var inTable = false;
        int rowColumn = -1, valueColumn = -1;
        foreach (var raw in markdown.Split('\n'))
        {
            var line = raw.Trim();
            if (!line.StartsWith('|'))
            {
                inTable = false;
                continue;
            }

            var cells = Cells(line);
            if (!inTable)
            {
                // The first line of a table is its header.
                inTable = true;
                rowColumn = cells.IndexOf("#");
                valueColumn = cells.IndexOf(header);
                continue;
            }

            if (rowColumn < 0 || valueColumn < 0 || rowColumn >= cells.Count) continue;
            if (!int.TryParse(cells[rowColumn], out var row)) continue; // the |---| separator line
            var value = valueColumn < cells.Count ? cells[valueColumn] : "";
            if (!values.TryAdd(row, value))
                throw new InvalidOperationException($"Row {row} appears twice in one seed doc.");
        }

        return values;
    }

    /// <summary>
    /// Every seeded row's badge must match its quote, both ways, and a quote must be a
    /// double-quoted sentence naming a badge phrase. Rows not in <paramref name="seededIds"/>
    /// are ignored, so a doc may list rows that were skipped at the gate.
    /// </summary>
    public static List<string> BadgeProblems(
        IEnumerable<int> seededIds,
        IReadOnlySet<int> badgeIds,
        IReadOnlyDictionary<int, string> quotes)
    {
        var problems = new List<string>();
        foreach (var id in seededIds.Order())
        {
            var cell = quotes.GetValueOrDefault(id, "");
            var hasBadge = badgeIds.Contains(id);
            if (cell.Length == 0)
            {
                if (hasBadge) problems.Add($"row {id}: badge without a referral quote");
                continue;
            }

            if (!IsBadgeQuote(cell))
                problems.Add($"row {id}: referral quote is not a quoted sentence naming a badge phrase");
            else if (!hasBadge)
                problems.Add($"row {id}: referral quote without a badge");
        }

        return problems;
    }

    /// <summary>
    /// Every category 10 row's topics (its categories besides category 10) must equal its Topic
    /// cell in the reconcile doc, compared as sets. The doc and category 10 must list the same
    /// rows. "none" is the only way to say "no topic"; an empty cell means not settled.
    /// </summary>
    public static List<string> TopicProblems(
        IReadOnlyDictionary<int, IReadOnlySet<string>> category10,
        IReadOnlyDictionary<int, string> topicCells)
    {
        var problems = new List<string>();
        foreach (var id in category10.Keys.Union(topicCells.Keys).Order())
        {
            if (!topicCells.TryGetValue(id, out var cell))
            {
                problems.Add($"row {id}: in category 10 but not in the reconcile doc");
                continue;
            }

            if (!category10.TryGetValue(id, out var seeded))
            {
                problems.Add($"row {id}: in the reconcile doc but not in category 10");
                continue;
            }

            if (cell.Length == 0)
            {
                problems.Add($"row {id}: topic cell is empty; write the slugs or none");
                continue;
            }

            string[] slugs = cell == "none" ? [] : cell.Split(',').Select(s => s.Trim()).ToArray();
            var unknown = slugs.FirstOrDefault(s => !TopicSlugs.Contains(s));
            if (unknown is not null)
            {
                problems.Add($"row {id}: topic \"{unknown}\" is not a topic category");
                continue;
            }

            if (!seeded.SetEquals(slugs))
                problems.Add(
                    $"row {id}: seeded topics [{string.Join(", ", seeded.Order(StringComparer.Ordinal))}] differ from the doc's [{string.Join(", ", slugs.Order(StringComparer.Ordinal))}]");
        }

        return problems;
    }

    /// <summary>
    /// One quote per row: the base docs may not share a row, and an override doc replaces the
    /// base doc's cell for each row it lists (an empty cell included). An override row that no
    /// base doc lists throws, so a typo cannot add a row nobody seeded.
    /// </summary>
    public static Dictionary<int, string> MergeQuotes(
        IEnumerable<IReadOnlyDictionary<int, string>> bases,
        IEnumerable<IReadOnlyDictionary<int, string>> overrides)
    {
        var quotes = new Dictionary<int, string>();
        foreach (var doc in bases)
            foreach (var (row, quote) in doc)
                if (!quotes.TryAdd(row, quote))
                    throw new InvalidOperationException($"row {row} appears in two seed docs");

        foreach (var doc in overrides)
            foreach (var (row, quote) in doc)
            {
                if (!quotes.ContainsKey(row))
                    throw new InvalidOperationException($"row {row} is in an override doc but in no earlier seed doc");
                quotes[row] = quote;
            }

        return quotes;
    }

    private static bool IsBadgeQuote(string cell) =>
        cell.Length > 2
        && cell[0] == '"'
        && cell[^1] == '"'
        && BadgePhrases.Any(phrase => cell.Contains(phrase, StringComparison.OrdinalIgnoreCase));

    private static List<string> Cells(string line)
    {
        var inner = line[1..];
        if (inner.EndsWith('|') && !inner.EndsWith("\\|")) inner = inner[..^1];
        return CellBreak().Split(inner).Select(cell => cell.Replace("\\|", "|").Trim()).ToList();
    }

    [GeneratedRegex(@"(?<!\\)\|")]
    private static partial Regex CellBreak();
}

using System.Text.RegularExpressions;

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
    public static readonly string[] WithReferralQuotes = [];

    /// <summary>The spec's badge rule: a referral quote must name one of these (case-insensitive).</summary>
    public static readonly string[] BadgePhrases =
        ["uten henvisning", "ingen henvisning", "trenger ikke henvisning", "lavterskel"];

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
    public static Dictionary<int, string> ReferralQuotes(string markdown)
    {
        var quotes = new Dictionary<int, string>();
        var inTable = false;
        int rowColumn = -1, quoteColumn = -1;
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
                quoteColumn = cells.IndexOf("Referral quote");
                continue;
            }

            if (rowColumn < 0 || quoteColumn < 0 || rowColumn >= cells.Count) continue;
            if (!int.TryParse(cells[rowColumn], out var row)) continue; // the |---| separator line
            var quote = quoteColumn < cells.Count ? cells[quoteColumn] : "";
            if (!quotes.TryAdd(row, quote))
                throw new InvalidOperationException($"Row {row} appears twice in one seed doc.");
        }

        return quotes;
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

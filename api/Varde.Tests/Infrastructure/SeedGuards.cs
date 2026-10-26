using System.Text.RegularExpressions;
using Varde.Core;
using Varde.Core.Models;
using Varde.Data.Seed;

namespace Varde.Tests.Infrastructure;

/// <summary>
/// Checks over seeded resources that are easier to prove with a fixture than with a migration.
/// Each returns one readable line per problem; SeedDataTests runs them over the real seed and
/// SeedGuardsTests shows each one failing on a fixture.
/// </summary>
public static partial class SeedGuards
{
    /// <summary>Every Website and ChatUrl is an absolute https:// URL, so no seed value can become a javascript: link.</summary>
    public static List<string> LinkProblems(IEnumerable<Resource> resources) =>
        resources
            .SelectMany(r => new[] { (r.Id, Field: "Website", Url: r.Website), (r.Id, Field: "ChatUrl", Url: r.ChatUrl) })
            .Where(link => link.Url is not null && !IsHttps(link.Url))
            .Select(link => $"row {link.Id}: {link.Field} {link.Url} is not an absolute https:// URL")
            .ToList();

    /// <summary>
    /// Paid and Partly need a note in every language; Free may have notes in every language or
    /// none; a note never stands without a cost.
    /// </summary>
    public static List<string> CostProblems(IEnumerable<Resource> resources)
    {
        var problems = new List<string>();
        foreach (var r in resources)
        {
            var noted = r.Translations
                .Where(t => !string.IsNullOrWhiteSpace(t.CostNote))
                .Select(t => t.LanguageCode)
                .ToHashSet();
            var inEveryLanguage = noted.SetEquals(Language.Supported);
            switch (r.Cost)
            {
                case null when noted.Count > 0:
                    problems.Add($"row {r.Id}: a cost note without a cost");
                    break;
                case ResourceCost.Paid or ResourceCost.Partly when !inEveryLanguage:
                    problems.Add($"row {r.Id}: {r.Cost} needs a cost note in nb and en");
                    break;
                case ResourceCost.Free when noted.Count > 0 && !inEveryLanguage:
                    problems.Add($"row {r.Id}: a cost note in one language only");
                    break;
            }
        }

        return problems;
    }

    /// <summary>
    /// The en note keeps every number of the nb note, digit for digit and split into the same
    /// digit groups. The separator between groups is not compared, so "1 500" and "1,500" agree.
    /// Order may change with the sentence. Missing notes are CostProblems' job.
    /// </summary>
    public static List<string> NumberProblems(IEnumerable<Resource> resources)
    {
        var problems = new List<string>();
        foreach (var r in resources)
        {
            var nb = r.Translations.FirstOrDefault(t => t.LanguageCode == "nb")?.CostNote;
            var en = r.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.CostNote;
            if (nb is null || en is null) continue;
            var (nbNumbers, enNumbers) = (Numbers(nb), Numbers(en));
            if (!nbNumbers.SequenceEqual(enNumbers))
                problems.Add(
                    $"row {r.Id}: en cost note numbers [{string.Join(", ", enNumbers)}] differ from nb [{string.Join(", ", nbNumbers)}]");
        }

        return problems;
    }

    private static bool IsHttps(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;

    // "døgn" is a number in disguise: nb "døgnåpen" and en "24-hour" say the same thing, so each
    // "døgn" counts as a 24.
    private static List<string> Numbers(string note) =>
        Digits().Matches(note).Select(m => m.Value)
            .Concat(Enumerable.Repeat("24", Regex.Count(note, "døgn", RegexOptions.IgnoreCase)))
            .Order(StringComparer.Ordinal).ToList();

    [GeneratedRegex(@"\d+")]
    private static partial Regex Digits();

    /// <summary>Category 10 lists places in a kommune, so a member is never national and always has one.</summary>
    public static List<string> Category10Problems(IEnumerable<Resource> resources)
    {
        var problems = new List<string>();
        foreach (var r in resources.Where(r => r.ResourceCategories.Any(rc => rc.CategoryId == Categories.Lavterskeltilbud)))
        {
            if (r.MunicipalityId is null) problems.Add($"row {r.Id}: category 10 without a kommune");
            if (r.IsNational) problems.Add($"row {r.Id}: category 10 on a national service");
        }

        return problems;
    }
}

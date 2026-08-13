namespace Varde.Core;

/// <summary>
/// BCP 47 language handling. An unrecognised value falls back to <see cref="Default"/> silently —
/// it is never a 400. A truncated or mistyped shared link must still show the directory; someone
/// already struggling should not meet an error page because a URL lost a character.
/// </summary>
public static class Language
{
    public const string Default = "nb";

    public static readonly IReadOnlyList<string> Supported = [Default, "en"];

    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return Default;

        var trimmed = value.Trim();
        return Supported.FirstOrDefault(
            supported => string.Equals(supported, trimmed, StringComparison.OrdinalIgnoreCase))
            ?? Default;
    }
}

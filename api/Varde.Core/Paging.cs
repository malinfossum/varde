namespace Varde.Core;

/// <summary>
/// Paging bounds. Out-of-range values are clamped rather than rejected, for the same reason an
/// unknown language is: a malformed link should still show the directory.
/// </summary>
public static class Paging
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public static int NormalizePage(int? page) => page is > 0 ? page.Value : 1;

    public static int NormalizePageSize(int? pageSize) => pageSize switch
    {
        null or < 1 => DefaultPageSize,
        > MaxPageSize => MaxPageSize,
        _ => pageSize.Value,
    };
}

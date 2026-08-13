namespace Varde.Core.Models;

/// <summary>
/// A normalised directory query. Every value has already passed through <see cref="Language"/>
/// and <see cref="Paging"/> by the time a repository sees it — repositories never guess defaults.
/// </summary>
/// <param name="Categories">Category slugs, OR-ed together. Empty means no category filter.</param>
/// <param name="MunicipalityId">Null means no municipality filter. A value also matches national services.</param>
public record ResourceQuery(
    string? Search,
    string[] Categories,
    int? MunicipalityId,
    string Lang,
    int Page,
    int PageSize);

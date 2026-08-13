namespace Varde.Core.Dtos;

/// <summary>The paged envelope every list endpoint returns.</summary>
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

/// <summary>
/// A service as the UI sees it. One shape for both list and detail — the fields a card shows are
/// a subset of the fields a detail page shows, and two near-identical records would drift apart.
/// </summary>
/// <param name="Description">Plain text. Rendered as {description} — never as HTML.</param>
/// <param name="IsFallbackTranslation">True when the requested language was unavailable and this is Norwegian.</param>
public record ResourceDto(
    int Id,
    string Name,
    string Description,
    bool IsFallbackTranslation,
    bool IsNational,
    int? MunicipalityId,
    string? MunicipalityName,
    string? Address,
    string? Phone,
    string? Email,
    string? Website,
    DateOnly LastVerified,
    IReadOnlyList<CategoryDto> Categories);

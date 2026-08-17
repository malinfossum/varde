namespace Varde.Core.Dtos;

/// <summary>The paged envelope every list endpoint returns.</summary>
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

/// <summary>
/// A service as the UI sees it. One shape for both list and detail — the fields a card shows are
/// a subset of the fields a detail page shows, and two near-identical records would drift apart.
/// </summary>
/// <param name="Description">Plain text. Rendered as {description} — never as HTML.</param>
/// <param name="IsFallbackTranslation">True when the requested language was unavailable and this is Norwegian.</param>
/// <param name="OpeningHours">Plain text, in the requested language. Null when not recorded for this service.</param>
/// <param name="IsAlwaysOpen">True only where the verified source records 24/7 service. False is "not recorded", never "closed".</param>
public record ResourceDto(
    int Id,
    string Name,
    string Description,
    bool IsFallbackTranslation,
    string? OpeningHours,
    bool IsNational,
    bool IsAlwaysOpen,
    int? MunicipalityId,
    string? MunicipalityName,
    string? Address,
    string? Phone,
    string? Email,
    string? Website,
    string? ChatUrl,
    DateOnly LastVerified,
    IReadOnlyList<CategoryDto> Categories);

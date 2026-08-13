namespace Varde.Core.Dtos;

/// <summary>
/// A category as the UI sees it. <paramref name="Slug"/> is what the API's category filter accepts —
/// ids never appear in a URL, so a shared link stays readable.
/// </summary>
public record CategoryDto(int Id, string Slug, string Name, bool IsFallbackTranslation);

public record MunicipalityDto(int Id, string Name, string County);

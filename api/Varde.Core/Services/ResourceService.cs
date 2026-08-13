using Varde.Core.Dtos;
using Varde.Core.Interfaces;
using Varde.Core.Models;

namespace Varde.Core.Services;

public class ResourceService(IResourceRepository repository)
{
    public async Task<PagedResult<ResourceDto>> SearchAsync(
        string? search,
        string[]? categories,
        int? municipality,
        string? lang,
        int? page,
        int? pageSize,
        CancellationToken ct = default)
    {
        var query = new ResourceQuery(
            Search: search,
            Categories: categories ?? [],
            MunicipalityId: municipality,
            Lang: Language.Normalize(lang),
            Page: Paging.NormalizePage(page),
            PageSize: Paging.NormalizePageSize(pageSize));

        var (items, totalCount) = await repository.SearchAsync(query, ct);

        return new PagedResult<ResourceDto>(
            items.Select(resource => ToDto(resource, query.Lang)).ToList(),
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<ResourceDto?> GetAsync(int id, string? lang, CancellationToken ct = default)
    {
        var language = Language.Normalize(lang);
        var resource = await repository.GetAsync(id, ct);
        return resource is null ? null : ToDto(resource, language);
    }

    private static ResourceDto ToDto(Resource resource, string language)
    {
        var (description, isFallback) = ResolveDescription(resource, language);

        var categories = resource.ResourceCategories
            .Select(rc => rc.Category)
            .Select(category =>
            {
                var (name, categoryFallback) = CategoryService.ResolveName(category, language);
                return new CategoryDto(category.Id, category.Slug, name, categoryFallback);
            })
            .OrderBy(c => c.Slug)
            .ToList();

        return new ResourceDto(
            resource.Id,
            resource.Name,
            description,
            isFallback,
            resource.IsNational,
            resource.MunicipalityId,
            resource.Municipality?.Name,
            resource.Address,
            resource.Phone,
            resource.Email,
            resource.Website,
            resource.LastVerified,
            categories);
    }

    /// <summary>
    /// The requested language, or Norwegian flagged as a fallback. The UI then shows an honest
    /// note rather than silently serving Norwegian to someone who asked for English.
    /// </summary>
    private static (string Description, bool IsFallback) ResolveDescription(
        Resource resource,
        string language)
    {
        var requested = resource.Translations.FirstOrDefault(t => t.LanguageCode == language);
        if (requested is not null) return (requested.Description, false);

        var fallback = resource.Translations.FirstOrDefault(t => t.LanguageCode == Language.Default);
        return (fallback?.Description ?? "", true);
    }
}

using Varde.Core.Dtos;
using Varde.Core.Interfaces;
using Varde.Core.Models;

namespace Varde.Core.Services;

public class CategoryService(ICategoryRepository repository)
{
    public async Task<List<CategoryDto>> GetAllAsync(string? lang, CancellationToken ct = default)
    {
        var language = Language.Normalize(lang);
        var categories = await repository.GetAllAsync(ct);

        return categories.Select(category =>
        {
            var (name, isFallback) = ResolveName(category, language);
            return new CategoryDto(category.Id, category.Slug, name, isFallback);
        }).ToList();
    }

    /// <summary>
    /// Returns the name in the requested language, or the Norwegian one flagged as a fallback.
    /// Serving Norwegian silently to someone who asked for English is worse than saying so.
    /// </summary>
    public static (string Name, bool IsFallback) ResolveName(Category category, string language)
    {
        var requested = category.Translations.FirstOrDefault(t => t.LanguageCode == language);
        if (requested is not null) return (requested.Name, false);

        var fallback = category.Translations.FirstOrDefault(t => t.LanguageCode == Language.Default);
        return (fallback?.Name ?? category.Slug, true);
    }
}

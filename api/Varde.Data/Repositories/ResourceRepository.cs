using Microsoft.EntityFrameworkCore;
using Varde.Core.Interfaces;
using Varde.Core.Models;

namespace Varde.Data.Repositories;

public class ResourceRepository(VardeDbContext db) : IResourceRepository
{
    private const string LikeEscapeCharacter = "\\";

    public async Task<(List<Resource> Items, int TotalCount)> SearchAsync(
        ResourceQuery query,
        CancellationToken ct = default)
    {
        var resources = WithRelations();

        if (query.MunicipalityId is int municipalityId)
        {
            // Located there, national, or covering it — a shared krisesenter must appear in
            // every kommune it serves, not only the one holding its address.
            resources = resources.Where(r =>
                r.MunicipalityId == municipalityId
                || r.IsNational
                || r.ServedMunicipalities.Any(rm => rm.MunicipalityId == municipalityId));
        }

        if (query.Categories.Length > 0)
        {
            resources = resources.Where(r =>
                r.ResourceCategories.Any(rc => query.Categories.Contains(rc.Category.Slug)));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            // ILIKE, not ToLower(): PostgreSQL does the case folding, EF Core parameterises the
            // pattern. No string is ever interpolated into SQL.
            var pattern = $"%{EscapeLike(query.Search.Trim())}%";

            // The 3-arg overload is required: EF.Functions.ILike(x, pattern) alone generates
            // "ILIKE @pattern ESCAPE ''" (an empty escape string), which disables escaping
            // entirely and turns the backslashes from EscapeLike into literal characters.
            resources = resources.Where(r =>
                EF.Functions.ILike(r.Name, pattern, LikeEscapeCharacter)
                || r.Translations.Any(t =>
                    t.LanguageCode == query.Lang
                    && EF.Functions.ILike(t.Description, pattern, LikeEscapeCharacter)));
        }

        var totalCount = await resources.CountAsync(ct);

        var items = await resources
            .OrderBy(r => r.IsNational)   // false sorts first — nearest help at the top of page one
            .ThenBy(r => r.Name)
            .ThenBy(r => r.Id)            // total order: without this, OFFSET paging can duplicate
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public Task<Resource?> GetAsync(int id, CancellationToken ct = default) =>
        WithRelations().FirstOrDefaultAsync(r => r.Id == id, ct);

    private IQueryable<Resource> WithRelations() =>
        db.Resources
            .AsNoTracking()
            .Include(r => r.Municipality)
            .Include(r => r.Translations)
            .Include(r => r.ResourceCategories)
            .ThenInclude(rc => rc.Category)
            .ThenInclude(c => c.Translations)
            // Two sibling collections (Translations, ResourceCategories) plus a nested one
            // (ResourceCategories -> Category -> Translations) would otherwise cartesian-product
            // in a single round trip. Split into one query per collection instead; the ordering
            // in SearchAsync is a total order (IsNational, Name, Id), so paging stays correct
            // across the separate round trips.
            .AsSplitQuery();

    /// <summary>
    /// Neutralises LIKE metacharacters so a search for "50%" finds the literal text rather than
    /// matching everything. PostgreSQL's default LIKE escape character is the backslash.
    /// </summary>
    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}

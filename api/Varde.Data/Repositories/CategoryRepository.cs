using Microsoft.EntityFrameworkCore;
using Varde.Core.Interfaces;
using Varde.Core.Models;

namespace Varde.Data.Repositories;

public class CategoryRepository(VardeDbContext db) : ICategoryRepository
{
    public Task<List<Category>> GetAllAsync(CancellationToken ct = default) =>
        db.Categories
            .AsNoTracking()
            .Include(c => c.Translations)
            .OrderBy(c => c.Slug)
            .ToListAsync(ct);
}

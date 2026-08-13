using Microsoft.EntityFrameworkCore;
using Varde.Core.Interfaces;
using Varde.Core.Models;

namespace Varde.Data.Repositories;

public class MunicipalityRepository(VardeDbContext db) : IMunicipalityRepository
{
    public Task<List<Municipality>> GetAllAsync(CancellationToken ct = default) =>
        db.Municipalities
            .AsNoTracking()
            .OrderBy(m => m.Name)
            .ThenBy(m => m.Id)
            .ToListAsync(ct);
}

using Varde.Core.Models;

namespace Varde.Core.Interfaces;

public interface IMunicipalityRepository
{
    Task<List<Municipality>> GetAllAsync(CancellationToken ct = default);
}

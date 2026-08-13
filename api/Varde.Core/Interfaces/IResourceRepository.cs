using Varde.Core.Models;

namespace Varde.Core.Interfaces;

public interface IResourceRepository
{
    Task<(List<Resource> Items, int TotalCount)> SearchAsync(
        ResourceQuery query,
        CancellationToken ct = default);

    Task<Resource?> GetAsync(int id, CancellationToken ct = default);
}

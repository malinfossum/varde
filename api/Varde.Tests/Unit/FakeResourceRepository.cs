using Varde.Core.Interfaces;
using Varde.Core.Models;

namespace Varde.Tests.Unit;

/// <summary>
/// Records the query it was handed and returns whatever it was given. Service tests are about
/// normalisation and mapping — filtering is the repository's job and is tested against real
/// PostgreSQL in ResourceRepositoryTests.
/// </summary>
public class FakeResourceRepository(List<Resource>? items = null, int? totalCount = null)
    : IResourceRepository
{
    private readonly List<Resource> _items = items ?? [];

    public ResourceQuery? LastQuery { get; private set; }

    public Task<(List<Resource> Items, int TotalCount)> SearchAsync(
        ResourceQuery query,
        CancellationToken ct = default)
    {
        LastQuery = query;
        return Task.FromResult((_items, totalCount ?? _items.Count));
    }

    public Task<Resource?> GetAsync(int id, CancellationToken ct = default) =>
        Task.FromResult(_items.FirstOrDefault(r => r.Id == id));
}

using Varde.Core.Models;

namespace Varde.Core.Interfaces;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync(CancellationToken ct = default);
}

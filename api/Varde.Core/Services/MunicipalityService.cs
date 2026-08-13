using Varde.Core.Dtos;
using Varde.Core.Interfaces;

namespace Varde.Core.Services;

public class MunicipalityService(IMunicipalityRepository repository)
{
    public async Task<List<MunicipalityDto>> GetAllAsync(CancellationToken ct = default) =>
        (await repository.GetAllAsync(ct))
            .Select(m => new MunicipalityDto(m.Id, m.Name, m.County))
            .ToList();
}

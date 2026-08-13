using Microsoft.AspNetCore.Mvc;
using Varde.Core.Dtos;
using Varde.Core.Services;

namespace Varde.Api.Controllers;

[ApiController]
[Route("api/municipalities")]
public class MunicipalitiesController(MunicipalityService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MunicipalityDto>>> GetAll(CancellationToken ct) =>
        await service.GetAllAsync(ct);
}

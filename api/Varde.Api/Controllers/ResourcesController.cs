using Microsoft.AspNetCore.Mvc;
using Varde.Core.Dtos;
using Varde.Core.Services;

namespace Varde.Api.Controllers;

[ApiController]
[Route("api/resources")]
public class ResourcesController(ResourceService service, ILogger<ResourcesController> logger)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ResourceDto>>> Search(
        [FromQuery] string? search,
        [FromQuery(Name = "category")] string[]? category,
        [FromQuery] int? municipality,
        [FromQuery] bool? national,
        [FromQuery] string? lang,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct)
    {
        if (national == true && municipality is not null)
        {
            ModelState.AddModelError("national",
                "national=true cannot be combined with municipality — a municipality's results already include national services.");
            return ValidationProblem(ModelState);
        }

        var result = await service.SearchAsync(search, category, municipality, national ?? false, lang, page, pageSize, ct);

        // Result counts only. The search term never reaches a log — a person looking up a
        // krisesenter leaves no trace on the server.
        logger.LogInformation("Directory search returned {TotalCount} results", result.TotalCount);

        return result;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ResourceDto>> Get(
        int id,
        [FromQuery] string? lang,
        CancellationToken ct) =>
        // [ApiController] turns a bare NotFound() into a ProblemDetails body.
        await service.GetAsync(id, lang, ct) is { } resource ? resource : NotFound();
}

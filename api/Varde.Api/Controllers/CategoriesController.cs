using Microsoft.AspNetCore.Mvc;
using Varde.Core.Dtos;
using Varde.Core.Services;

namespace Varde.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController(CategoryService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll(
        [FromQuery] string? lang,
        CancellationToken ct) =>
        await service.GetAllAsync(lang, ct);
}

namespace Varde.Core.Models;

/// <summary>
/// Join table. Categories are many-to-many because NAV covers both økonomi and arbeid, and a
/// misfiled service is an invisible service.
/// </summary>
public class ResourceCategory
{
    public int ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}

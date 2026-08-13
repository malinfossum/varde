namespace Varde.Core.Models;

/// <summary>
/// Coverage join: the municipalities a service serves beyond the one it sits in. Krisesentre
/// are the motivating case — most kommuner fulfil krisesenterlova through a shared centre, and
/// without this table a Ringsaker filter would never show the centre that exists for Ringsaker.
/// </summary>
public class ResourceMunicipality
{
    public int ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;
    public int MunicipalityId { get; set; }
    public Municipality Municipality { get; set; } = null!;
}

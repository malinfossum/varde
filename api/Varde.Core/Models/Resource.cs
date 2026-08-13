namespace Varde.Core.Models;

public class Resource
{
    public int Id { get; set; }

    /// <summary>Never translated — NAV Hamar is NAV Hamar in every language.</summary>
    public required string Name { get; set; }

    /// <summary>National services belong to no municipality and appear in every municipality's results.</summary>
    public bool IsNational { get; set; }

    public int? MunicipalityId { get; set; }
    public Municipality? Municipality { get; set; }

    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }

    /// <summary>Shown on every card. A dead number on a bad day is the failure this field prevents.</summary>
    public DateOnly LastVerified { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<ResourceTranslation> Translations { get; set; } = [];
    public List<ResourceCategory> ResourceCategories { get; set; } = [];

    /// <summary>Municipalities this service also serves. MunicipalityId stays "located in".</summary>
    public List<ResourceMunicipality> ServedMunicipalities { get; set; } = [];
}

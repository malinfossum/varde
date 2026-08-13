namespace Varde.Core.Models;

public class ResourceTranslation
{
    public int Id { get; set; }
    public int ResourceId { get; set; }
    public Resource? Resource { get; set; }

    /// <summary>BCP 47: "nb" or "en". Never "no".</summary>
    public required string LanguageCode { get; set; }

    /// <summary>Plain text. Never HTML, never markdown.</summary>
    public required string Description { get; set; }
}

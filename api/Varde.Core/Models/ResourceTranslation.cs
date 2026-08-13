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

    /// <summary>
    /// When the service actually answers, in this language — "Mandag og onsdag 11:30–13:00",
    /// "Døgnåpent". Null means the service did not state its hours; the UI shows nothing rather
    /// than implying availability. Plain text, like Description.
    /// </summary>
    public string? OpeningHours { get; set; }
}

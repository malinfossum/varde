namespace Varde.Core.Models;

public class Category
{
    public int Id { get; set; }

    /// <summary>URL-safe identifier used by the API's category filter — ids never appear in links.</summary>
    public required string Slug { get; set; }

    public List<CategoryTranslation> Translations { get; set; } = [];
}

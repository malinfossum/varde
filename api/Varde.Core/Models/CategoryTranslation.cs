namespace Varde.Core.Models;

public class CategoryTranslation
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public required string LanguageCode { get; set; }
    public required string Name { get; set; }
}

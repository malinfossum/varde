using Varde.Core.Models;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Unit;

public class SeedGuardsTests
{
    private static Resource Row(int id, ResourceCost? cost = null, string? nb = null, string? en = null) => new()
    {
        Id = id,
        Name = $"Row {id}",
        Cost = cost,
        Translations =
        [
            new ResourceTranslation { LanguageCode = "nb", Description = "nb", CostNote = nb },
            new ResourceTranslation { LanguageCode = "en", Description = "en", CostNote = en },
        ],
    };

    [Fact]
    public void Only_absolute_https_links_pass()
    {
        Resource[] rows =
        [
            new() { Id = 1, Name = "ok", Website = "https://example.no", ChatUrl = "https://chat.example.no" },
            new() { Id = 2, Name = "script", Website = "javascript:alert(1)" },
            new() { Id = 3, Name = "plain", ChatUrl = "http://example.no" },
            new() { Id = 4, Name = "relative", Website = "/kontakt" },
        ];

        Assert.Equal(
            [
                "row 2: Website javascript:alert(1) is not an absolute https:// URL",
                "row 3: ChatUrl http://example.no is not an absolute https:// URL",
                "row 4: Website /kontakt is not an absolute https:// URL",
            ],
            SeedGuards.LinkProblems(rows));
    }

    [Fact]
    public void Cost_and_cost_notes_must_agree()
    {
        Resource[] rows =
        [
            Row(1),                                              // not stated, no note: fine
            Row(2, ResourceCost.Free),                           // free without a note: fine
            Row(3, ResourceCost.Free, "Gratis", "Free"),         // free with both notes: fine
            Row(4, ResourceCost.Partly, "Kaffe 20 kr", "Coffee 20 kr"),
            Row(5, ResourceCost.Paid),                           // paid needs a note
            Row(6, ResourceCost.Partly, "Kaffe 20 kr"),          // partly needs both
            Row(7, null, "Gratis", "Free"),                      // a note without a cost
            Row(8, ResourceCost.Free, "Gratis"),                 // Review Focus 2: one language only
        ];

        Assert.Equal(
            [
                "row 5: Paid needs a cost note in nb and en",
                "row 6: Partly needs a cost note in nb and en",
                "row 7: a cost note without a cost",
                "row 8: a cost note in one language only",
            ],
            SeedGuards.CostProblems(rows));
    }

    [Fact]
    public void English_cost_notes_keep_every_number()
    {
        Resource[] rows =
        [
            Row(1, ResourceCost.Partly, "Kaffe 20 kr, middag 50 kr", "Dinner NOK 50, coffee NOK 20"), // order may change
            Row(2, ResourceCost.Paid, "Egenandel 1 500 kr", "Fee NOK 1 500"),                          // grouping kept
            Row(3, ResourceCost.Paid, "Egenandel 50 kr", "Fee NOK 60"),                                // a changed number
            Row(4, ResourceCost.Paid, "Egenandel 1 500 kr", "Fee NOK 1500"),                           // regrouped digits
            Row(5, ResourceCost.Free, "Gratis og døgnåpen", "Free and 24-hour"),                        // døgn is 24
        ];

        Assert.Equal(
            [
                "row 3: en cost note numbers [60] differ from nb [50]",
                "row 4: en cost note numbers [1500] differ from nb [1, 500]",
            ],
            SeedGuards.NumberProblems(rows));
    }

    [Fact]
    public void Category_10_rows_must_sit_in_a_kommune_and_not_be_national()
    {
        static Resource Member(int id, int? municipalityId, bool national) => new()
        {
            Id = id,
            Name = $"Row {id}",
            MunicipalityId = municipalityId,
            IsNational = national,
            ResourceCategories = [new ResourceCategory { ResourceId = id, CategoryId = 10 }],
        };

        Resource[] rows = [Member(1, 1, false), Member(2, null, false), Member(3, 8, true)];

        Assert.Equal(
            ["row 2: category 10 without a kommune", "row 3: category 10 on a national service"],
            SeedGuards.Category10Problems(rows));
    }
}

using Varde.Core;

namespace Varde.Tests.Unit;

public class LanguageTests
{
    [Theory]
    [InlineData("nb", "nb")]
    [InlineData("en", "en")]
    [InlineData("EN", "en")]
    [InlineData("Nb", "nb")]
    public void Normalize_accepts_supported_codes_case_insensitively(string input, string expected) =>
        Assert.Equal(expected, Language.Normalize(input));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("no")]        // the common mistake — "no" is not BCP 47 bokmål
    [InlineData("e")]         // a shared link that lost a character
    [InlineData("klingon")]
    public void Normalize_falls_back_to_nb_instead_of_erroring(string? input) =>
        Assert.Equal("nb", Language.Normalize(input));
}

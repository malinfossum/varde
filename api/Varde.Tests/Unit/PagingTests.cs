using Varde.Core;

namespace Varde.Tests.Unit;

public class PagingTests
{
    [Theory]
    [InlineData(null, 1)]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(1, 1)]
    [InlineData(7, 7)]
    public void NormalizePage_never_returns_less_than_one(int? input, int expected) =>
        Assert.Equal(expected, Paging.NormalizePage(input));

    [Theory]
    [InlineData(null, 20)]
    [InlineData(0, 20)]
    [InlineData(-1, 20)]
    [InlineData(1, 1)]
    [InlineData(50, 50)]
    [InlineData(100, 100)]
    [InlineData(101, 100)]
    [InlineData(100000, 100)]
    public void NormalizePageSize_defaults_to_20_and_clamps_at_100(int? input, int expected) =>
        Assert.Equal(expected, Paging.NormalizePageSize(input));
}

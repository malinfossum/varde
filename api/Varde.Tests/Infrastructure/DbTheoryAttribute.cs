namespace Varde.Tests.Infrastructure;

/// <summary>
/// A [Theory] that needs the PostgreSQL server. Like <see cref="DbFactAttribute"/>, it reports as
/// skipped instead of failing when no server is reachable.
/// </summary>
public sealed class DbTheoryAttribute : TheoryAttribute
{
    public DbTheoryAttribute()
    {
        if (!TestDatabase.IsAvailable) Skip = TestDatabase.SkipReason;
    }
}

namespace Varde.Tests.Infrastructure;

/// <summary>
/// A [Fact] that needs the PostgreSQL server. xunit 2 has no dynamic skip, so the attribute sets
/// Skip itself when <see cref="TestDatabase.IsAvailable"/> is false: without a server (Ward's
/// dotnet job, a machine without PostgreSQL) the test reports as skipped instead of failing,
/// unless VARDE_TEST_REQUIRE_DB is 1.
/// </summary>
public sealed class DbFactAttribute : FactAttribute
{
    public DbFactAttribute()
    {
        if (!TestDatabase.IsAvailable) Skip = TestDatabase.SkipReason;
    }
}

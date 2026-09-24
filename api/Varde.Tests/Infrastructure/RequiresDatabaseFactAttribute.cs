namespace Varde.Tests.Infrastructure;

/// <summary>
/// A <see cref="FactAttribute"/> for a test that needs the PostgreSQL server described by
/// <see cref="TestDatabaseAvailability.ConnectionString"/>.
///
/// On a machine without that server — the naked CI runner in the minimal pipeline, or a laptop
/// that has not started PostgreSQL — the test is reported as *skipped* with the reason, instead
/// of crashing the test host on connect (which aborts the whole run, unit tests included).
/// xUnit v2 decides skips while constructing this attribute during discovery, before any fixture
/// runs, so nothing here touches the database.
/// </summary>
public sealed class RequiresDatabaseFactAttribute : FactAttribute
{
    public RequiresDatabaseFactAttribute()
    {
        if (!TestDatabaseAvailability.IsReachable)
        {
            Skip = TestDatabaseAvailability.UnreachableReason;
        }
    }
}

/// <summary>
/// The <see cref="RequiresDatabaseFactAttribute"/> equivalent for data-driven tests. The suite has
/// no database-backed theories today; this exists so the first one that arrives is skipped on a
/// naked runner rather than failing it.
/// </summary>
public sealed class RequiresDatabaseTheoryAttribute : TheoryAttribute
{
    public RequiresDatabaseTheoryAttribute()
    {
        if (!TestDatabaseAvailability.IsReachable)
        {
            Skip = TestDatabaseAvailability.UnreachableReason;
        }
    }
}

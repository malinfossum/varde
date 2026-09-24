using Npgsql;

namespace Varde.Tests.Infrastructure;

/// <summary>
/// One probe for the whole test assembly: is the PostgreSQL server the integration tests need
/// reachable from this machine right now?
///
/// The minimal pipeline (`.github/workflows/build-test.yml`) runs `dotnet test` on a naked runner
/// — no database, no `.env` — so integration tests cannot run there and must not take the test
/// host down with them. <see cref="RequiresDatabaseFactAttribute"/> reads this probe during
/// discovery and reports them as skipped instead.
///
/// The full pipeline (`ci.yml`) starts a PostgreSQL service container, the probe succeeds, and
/// every integration test runs for real.
/// </summary>
public static class TestDatabaseAvailability
{
    /// <summary>The standard local development instance; override with the VARDE_TEST_PG variable.</summary>
    public const string DefaultConnectionString =
        "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres";

    /// <summary>Where the integration tests expect the server. The same value TestDatabase uses.</summary>
    public static string ConnectionString =>
        Environment.GetEnvironmentVariable("VARDE_TEST_PG") ?? DefaultConnectionString;

    private static readonly Lazy<string?> Probe =
        new(ProbeOnce, LazyThreadSafetyMode.ExecutionAndPublication);

    /// <summary>True when the server answered. Cached — the suite must not probe once per test.</summary>
    public static bool IsReachable => Probe.Value is null;

    /// <summary>
    /// A ready-made sentence for a skip message: where the server was expected and why the
    /// connection failed. Never contains the password. Null when the server did answer.
    /// </summary>
    public static string? UnreachableReason => Probe.Value;

    private static string? ProbeOnce()
    {
        try
        {
            // Short timeout: an unreachable host must not stall discovery for the default 15 s.
            var probe = new NpgsqlConnectionStringBuilder(ConnectionString) { Timeout = 3 };
            using var connection = new NpgsqlConnection(probe.ConnectionString);
            connection.Open();
            return null;
        }
        catch (Exception ex)
        {
            return $"needs PostgreSQL at {DescribeTarget()} ({ex.GetType().Name}: {ex.Message})";
        }
    }

    /// <summary>Host, port, database and user — deliberately not the whole connection string.</summary>
    private static string DescribeTarget()
    {
        try
        {
            var builder = new NpgsqlConnectionStringBuilder(ConnectionString);
            return $"{builder.Host}:{builder.Port}/{builder.Database} as {builder.Username}";
        }
        catch (ArgumentException)
        {
            // VARDE_TEST_PG is not a connection string at all; the exception text says so.
            return "the configured PostgreSQL server";
        }
    }
}

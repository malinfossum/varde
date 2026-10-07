using System.Net.Sockets;
using Npgsql;

namespace Varde.Tests.Infrastructure;

/// <summary>
/// Base connection to the local PostgreSQL *server* (its maintenance 'postgres' database).
/// Each test creates its OWN throwaway database on this server (see VardeApiFactory), so tests
/// stay isolated. No container: a native PostgreSQL service locally, a Postgres service container
/// on CI. The base connection comes from VARDE_TEST_PG; locally it defaults to the standard dev
/// instance. Nothing secret is committed.
/// </summary>
/// <remarks>
/// Ward's dotnet job and a machine without PostgreSQL have no server to reach. I probe the server
/// once, with a short timeout, so the database tests (<see cref="DbFactAttribute"/> and
/// <see cref="DbTheoryAttribute"/>) report as skipped there instead of failing, and the unit
/// tests still run. When the server is reachable, the probe also drops varde_test_* databases
/// orphaned by a previously crashed run, because a native server persists them.
/// </remarks>
public static class TestDatabase
{
    public static string AdminConnectionString { get; } =
        Environment.GetEnvironmentVariable("VARDE_TEST_PG")
        ?? "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres";

    // Null when the server is reachable, otherwise why the database tests skip.
    private static readonly Lazy<string?> Unreachable = new(Probe);

    public static bool IsAvailable => Unreachable.Value is null;

    public static string? SkipReason => Unreachable.Value;

    private static string? Probe()
    {
        var probe = new NpgsqlConnectionStringBuilder(AdminConnectionString) { Timeout = 3 };
        using var admin = new NpgsqlConnection(probe.ConnectionString);
        try
        {
            admin.Open();
        }
        catch (PostgresException)
        {
            // The server answered (a wrong password, say). Run the tests so they show its error.
            return null;
        }
        catch (Exception ex) when (ex is NpgsqlException or SocketException)
        {
            return $"No PostgreSQL server reachable at {probe.Host}:{probe.Port} ({ex.Message}). "
                + "Start one or point VARDE_TEST_PG at one to run the database tests.";
        }

        DropStaleDatabases(admin);
        return null;
    }

    private static void DropStaleDatabases(NpgsqlConnection admin)
    {
        var stale = new List<string>();
        using (var find = admin.CreateCommand())
        {
            find.CommandText = "SELECT datname FROM pg_database WHERE datname LIKE 'varde_test_%'";
            using var reader = find.ExecuteReader();
            while (reader.Read()) stale.Add(reader.GetString(0));
        }

        foreach (var db in stale)
        {
            using var drop = admin.CreateCommand();
            drop.CommandText = $"DROP DATABASE IF EXISTS \"{db}\" WITH (FORCE);";
            drop.ExecuteNonQuery();
        }
    }
}

using Npgsql;

namespace Varde.Tests.Infrastructure;

/// <summary>
/// Base connection to the local PostgreSQL *server* (its maintenance 'postgres' database).
/// Each test creates its OWN throwaway database on this server (see VardeApiFactory), so tests
/// stay isolated. No container: a native PostgreSQL service locally, a Postgres service container
/// on CI. The base connection comes from VARDE_TEST_PG; locally it defaults to the standard dev
/// instance. Nothing secret is committed.
/// The static constructor runs once per test assembly and drops varde_test_* databases orphaned
/// by a previously crashed run — a native server persists, unlike a thrown-away container.
/// </summary>
public static class TestDatabase
{
    public static string AdminConnectionString { get; } =
        Environment.GetEnvironmentVariable("VARDE_TEST_PG")
        ?? "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres";

    static TestDatabase()
    {
        using var admin = new NpgsqlConnection(AdminConnectionString);
        admin.Open();

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

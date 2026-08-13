using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Varde.Data;

namespace Varde.Tests.Infrastructure;

/// <summary>
/// Boots the real app against a throwaway PostgreSQL database on the local/CI server. Each factory
/// instance creates its OWN empty database and drops it on dispose, so every test that news up a
/// factory gets full isolation. The app applies migrations on startup in Development.
/// Create one per test — `using var factory = new VardeApiFactory();` — rather than sharing a
/// class fixture, or data from one test leaks into the next.
/// </summary>
public sealed class VardeApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"varde_test_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Program.cs's Development branch applies migrations and maps OpenAPI; tests need the former.
        builder.UseEnvironment("Development");

        // Touching TestDatabase runs its static constructor (stale-database cleanup) exactly once.
        using (var admin = new NpgsqlConnection(TestDatabase.AdminConnectionString))
        {
            admin.Open();
            using var cmd = admin.CreateCommand();
            cmd.CommandText = $"CREATE DATABASE \"{_dbName}\"";
            cmd.ExecuteNonQuery();
        }

        var perTest = new NpgsqlConnectionStringBuilder(TestDatabase.AdminConnectionString)
        {
            Database = _dbName,
        };

        // Same seam Program.cs reads.
        builder.UseSetting("ConnectionStrings:VardeDb", perTest.ConnectionString);
    }

    /// <summary>Inserts test fixtures directly through the context. Call before the first request.</summary>
    public void Seed(Action<VardeDbContext> seed)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        seed(db);
        db.SaveChanges();
    }

    /// <summary>A scoped context against this factory's database, for tests that skip HTTP.</summary>
    public IServiceScope NewScope() => Services.CreateScope();

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        // The native server persists (unlike a container) — drop this test's throwaway database.
        // DROP ... WITH (FORCE) (PG13+) terminates the app's leftover pooled connections to this
        // database, so no global ClearAllPools() is needed (that would disrupt sibling tests).
        using var admin = new NpgsqlConnection(TestDatabase.AdminConnectionString);
        admin.Open();
        using var cmd = admin.CreateCommand();
        cmd.CommandText = $"DROP DATABASE IF EXISTS \"{_dbName}\" WITH (FORCE);";
        cmd.ExecuteNonQuery();
    }
}

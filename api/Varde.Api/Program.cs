using Microsoft.EntityFrameworkCore;
using Varde.Data;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("VardeDb")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:VardeDb is not configured. Set it with: " +
        "dotnet user-secrets set \"ConnectionStrings:VardeDb\" \"<connection string>\" --project Varde.Api");

builder.Services.AddDbContext<VardeDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    // Schema comes from migrations, always — never EnsureCreated.
    using (var scope = app.Services.CreateScope())
    {
        scope.ServiceProvider.GetRequiredService<VardeDbContext>().Database.Migrate();
    }

    app.MapOpenApi();          // JSON spec at /openapi/v1.json — dev only
}
else
{
    app.UseHttpsRedirection();
}

app.MapControllers();

app.Run();

// Top-level statements make Program internal; this line makes it visible to
// WebApplicationFactory<Program> in Varde.Tests. Do not remove.
public partial class Program { }

using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Varde.Core.Interfaces;
using Varde.Core.Services;
using Varde.Data;
using Varde.Data.Repositories;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("VardeDb")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:VardeDb is not configured. Set it with: " +
        "dotnet user-secrets set \"ConnectionStrings:VardeDb\" \"<connection string>\" --project Varde.Api");

builder.Services.AddDbContext<VardeDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IMunicipalityRepository, MunicipalityRepository>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<MunicipalityService>();
builder.Services.AddScoped<ResourceService>();
builder.Services.AddSingleton(TimeProvider.System);

const string CorsPolicy = "varde-web";

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().WithMethods("GET")));

// Search runs a case-insensitive scan on a burstable-tier database, and the API is public and
// unauthenticated. The partition key is a client IP held in memory for one window — never
// logged, never written anywhere. The Azure spending cap is a backstop, not the control: a cap
// that trips takes the site down, which fails the user worse than being slow does.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = builder.Configuration.GetValue("RateLimiting:PermitLimit", 60),
                Window = TimeSpan.FromSeconds(
                    builder.Configuration.GetValue("RateLimiting:WindowSeconds", 60)),
                QueueLimit = 0,
            }));
});

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();

app.UseCors(CorsPolicy);
app.UseRateLimiter();

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

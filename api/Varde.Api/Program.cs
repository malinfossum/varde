using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
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

// First in the pipeline, in every environment. App Service terminates TLS and proxies plain
// HTTP to Kestrel, so X-Forwarded-Proto must be applied before UseHttpsRedirection (else
// production redirect-loops) and X-Forwarded-For before the rate limiter (else every visitor
// shares one bucket). KnownIPNetworks/KnownProxies are cleared because App Service's proxy
// addresses are not enumerable. ForwardLimit stays at 1: App Service APPENDS the real client
// IP, so the right-most entry is the trustworthy one — reading deeper into the chain would
// let clients choose their own rate-limit bucket. Enabled in dev too: there is no proxy
// there, so a spoofed header only mis-partitions a local limiter, and unconditional
// enablement keeps WebApplicationFactory tests in their default Development environment.
var forwardedHeaders = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
};
forwardedHeaders.KnownIPNetworks.Clear();
forwardedHeaders.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeaders);

app.UseExceptionHandler();

app.UseCors(CorsPolicy);
app.UseRateLimiter();

// Schema comes from migrations, always — never EnsureCreated. Runs in every environment:
// production Neon fills itself at deploy (schema + seed rows live in the migrations), and
// a failed migration blocks startup, which is the safe failure.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<VardeDbContext>().Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
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

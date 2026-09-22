# Multi-stage build for the Varde API (.NET 10).
# Build context is api/ — the solution root, so the paths below match the disk layout.

# Stage 1: build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Project files first: the restore layer stays cached until a dependency changes.
# The solution file has to come along, or the projects it lists are never restored.
COPY Varde.slnx global.json ./
COPY Varde.Api/Varde.Api.csproj Varde.Api/
COPY Varde.Core/Varde.Core.csproj Varde.Core/
COPY Varde.Data/Varde.Data.csproj Varde.Data/
COPY Varde.Tests/Varde.Tests.csproj Varde.Tests/
RUN dotnet restore

# Then the source, so a code change only rebuilds from here down
COPY . .
# No `dotnet test` in the build: the tests need a live PostgreSQL (VARDE_TEST_PG), which a
# build container does not have. CI runs them against a service container instead.
RUN dotnet publish Varde.Api/Varde.Api.csproj -c Release -o /app/publish --no-restore

# Stage 2: runtime only
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Npgsql wants the Kerberos library; the compose healthcheck uses wget
RUN apt-get update && apt-get install -y libkrb5-3 wget && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Not root: appuser owns /app
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Varde.Api.dll"]

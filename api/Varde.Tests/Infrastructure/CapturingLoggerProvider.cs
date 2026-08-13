using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Varde.Tests.Infrastructure;

/// <summary>
/// Records every formatted log message the app writes, so a test can assert that a search term
/// never appears in one. This guards the spec's promise directly: adding an innocent-looking
/// logger.LogInformation("Searching for {Search}", search) would break it silently otherwise.
/// </summary>
public sealed class CapturingLoggerProvider : ILoggerProvider
{
    public ConcurrentBag<string> Messages { get; } = [];

    public ILogger CreateLogger(string categoryName) => new CapturingLogger(Messages);

    public void Dispose() { }

    private sealed class CapturingLogger(ConcurrentBag<string> messages) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter) =>
            messages.Add(formatter(state, exception));
    }
}

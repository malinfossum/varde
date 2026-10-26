namespace Varde.Core.Models;

/// <summary>
/// What using a service costs, as its source states it. Stored as an int, and seed migrations
/// write the numbers, so they never change. "Not stated" is a null Cost, never Free.
/// </summary>
public enum ResourceCost
{
    /// <summary>The source says "gratis", "koster ingenting" or "uten egenandel".</summary>
    Free = 1,

    /// <summary>The source names a price, fee or egenandel for the service itself.</summary>
    Paid = 2,

    /// <summary>Free to come, with a price for food, trips or materials.</summary>
    Partly = 3,
}

using Microsoft.EntityFrameworkCore;

namespace Varde.Data;

public class VardeDbContext(DbContextOptions<VardeDbContext> options) : DbContext(options)
{
}

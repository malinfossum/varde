using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class RecheckNavStovner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 211,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 9));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 211,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));
        }
    }
}

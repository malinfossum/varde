using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class LegevaktAlwaysOpen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 5,
                column: "OpeningHours",
                value: "Døgnåpent");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 6,
                column: "OpeningHours",
                value: "Open 24 hours");

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "IsAlwaysOpen", "LastVerified" },
                values: new object[] { true, new DateOnly(2026, 9, 7) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 5,
                column: "OpeningHours",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 6,
                column: "OpeningHours",
                value: null);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "IsAlwaysOpen", "LastVerified" },
                values: new object[] { false, new DateOnly(2026, 8, 13) });
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsAlwaysOpen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAlwaysOpen",
                table: "Resources",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 1,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 2,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 4,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 5,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 6,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 7,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 8,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 9,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 10,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 11,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 12,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 13,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 14,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 15,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 16,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 18,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 19,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 20,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 21,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 22,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 101,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 102,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 103,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 104,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 105,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 106,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 107,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 108,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 109,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 110,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 111,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 112,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 113,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 114,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 115,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 116,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 117,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 118,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 119,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 120,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 121,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 122,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 201,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 202,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 203,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 204,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 205,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 206,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 207,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 208,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 209,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 210,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 211,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 212,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 213,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 214,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 215,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 216,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 217,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 218,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 219,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 220,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 221,
                column: "IsAlwaysOpen",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 222,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 223,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 224,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 225,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 226,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 227,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 228,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 229,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 230,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 231,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 232,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 233,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 234,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 235,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 236,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 237,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 238,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 239,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 240,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 241,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 242,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 243,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 244,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 245,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 246,
                column: "IsAlwaysOpen",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 247,
                column: "IsAlwaysOpen",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAlwaysOpen",
                table: "Resources");
        }
    }
}

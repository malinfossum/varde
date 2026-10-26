using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLowThresholdAndCost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CostNote",
                table: "ResourceTranslations",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Cost",
                table: "Resources",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLowThreshold",
                table: "Resources",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 1,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 2,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 3,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 4,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 5,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 6,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 7,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 8,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 9,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 10,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 11,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 12,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 13,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 14,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 15,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 16,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 17,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 18,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 19,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 20,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 21,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 22,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 23,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 24,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 25,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 26,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 27,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 28,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 29,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 30,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 31,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 32,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 33,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 34,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 35,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 36,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 37,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 38,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 39,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 40,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 41,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 42,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 43,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 44,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 45,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 46,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 47,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 48,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 49,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 50,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 51,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 52,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 53,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 54,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 55,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 56,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 57,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 58,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 59,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 60,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 61,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 62,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 63,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 64,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 65,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 66,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 67,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 68,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 69,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 70,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 71,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 72,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 73,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 74,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 75,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 76,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 77,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 78,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 79,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 80,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 81,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 82,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 83,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 84,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 85,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 86,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 87,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 88,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 89,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 90,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 91,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 92,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 93,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 94,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 95,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 96,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 97,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 98,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 99,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 100,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 101,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 102,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 103,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 104,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 105,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 106,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 107,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 108,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 109,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 110,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 111,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 112,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 113,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 114,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 115,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 116,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 117,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 118,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 119,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 120,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 121,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 122,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 123,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 124,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 125,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 126,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 127,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 128,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 129,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 130,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 131,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 132,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 133,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 134,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 135,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 136,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 137,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 138,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 139,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 140,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 141,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 142,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 143,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 144,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 145,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 146,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 147,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 148,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 149,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 150,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 151,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 152,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 153,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 154,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 155,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 156,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 157,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 158,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 159,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 160,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 161,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 162,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 163,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 164,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 165,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 166,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 167,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 168,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 169,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 170,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 171,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 172,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 173,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 174,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 175,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 176,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 177,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 178,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 179,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 180,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 181,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 182,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 183,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 184,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 185,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 186,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 187,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 188,
                column: "CostNote",
                value: null);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 106,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 107,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 108,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 109,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 110,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 111,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 112,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 113,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 114,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 115,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 116,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 117,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 118,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 119,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 120,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 121,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 122,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 201,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 202,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 203,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 204,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 205,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 206,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 207,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 208,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 209,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 210,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 211,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 212,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 213,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 214,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 215,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 216,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 217,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 218,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 219,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 220,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 221,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 222,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 223,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 224,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 225,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 226,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 227,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 228,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 229,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 230,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 231,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 232,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 233,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 234,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 235,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 236,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 237,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 238,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 239,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 240,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 241,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 242,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 243,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 244,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 245,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 246,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 247,
                columns: new[] { "Cost", "IsLowThreshold" },
                values: new object[] { null, false });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CostNote",
                table: "ResourceTranslations");

            migrationBuilder.DropColumn(
                name: "Cost",
                table: "Resources");

            migrationBuilder.DropColumn(
                name: "IsLowThreshold",
                table: "Resources");
        }
    }
}

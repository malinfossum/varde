using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedEmergencyNumbers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Resources",
                columns: new[] { "Id", "Address", "ChatUrl", "CreatedAt", "Email", "IsAlwaysOpen", "IsNational", "LastVerified", "MunicipalityId", "Name", "Phone", "UpdatedAt", "Website" },
                values: new object[,]
                {
                    { 23, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, true, new DateOnly(2026, 9, 9), null, "Brannvesen (nødnummer)", "110", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.dsb.no/brannsikkerhet/nodmelding/110-sentralene/" },
                    { 24, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, true, new DateOnly(2026, 9, 9), null, "Politi (nødnummer)", "112", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.politiet.no/kontakt-politiet/ring-politiet" },
                    { 25, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, true, new DateOnly(2026, 9, 9), null, "Ambulanse (medisinsk nødhjelp)", "113", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.helsenorge.no/forstehjelp" }
                });

            migrationBuilder.InsertData(
                table: "ResourceCategories",
                columns: new[] { "CategoryId", "ResourceId" },
                values: new object[,]
                {
                    { 9, 23 },
                    { 9, 24 },
                    { 9, 25 }
                });

            migrationBuilder.InsertData(
                table: "ResourceTranslations",
                columns: new[] { "Id", "Description", "LanguageCode", "OpeningHours", "ResourceId" },
                values: new object[,]
                {
                    { 183, "Ved brann, ulykker eller andre akutte situasjoner, ring nødnummer 110.", "nb", "Døgnåpent", 23 },
                    { 184, "Call the emergency number 110 for a fire, an accident or another acute situation.", "en", "Open 24 hours", 23 },
                    { 185, "Ring nødnummeret 112 når det er behov for øyeblikkelig hjelp.", "nb", "Døgnåpent", 24 },
                    { 186, "Call the emergency number 112 when you need immediate help from the police.", "en", "Open 24 hours", 24 },
                    { 187, "Ring 113 om situasjonen er kritisk, og det står om liv og helse.", "nb", "Døgnåpent", 25 },
                    { 188, "Call 113 when the situation is critical and life or health is at risk.", "en", "Open 24 hours", 25 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 23 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 24 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 25 });

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 183);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 184);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 185);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 186);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 187);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 188);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 25);
        }
    }
}

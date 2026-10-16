using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class HelplineParentAndMenuOption : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "Resources",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PhoneMenuOption",
                table: "Resources",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 17,
                column: "Description",
                value: "Rådgivning om vanskelige forhold på jobben, som konflikt, mobbing, sykefravær eller oppsigelse. Åpen for arbeidstakere, ledere, tillitsvalgte og arbeidssøkere.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 18,
                column: "Description",
                value: "Advice about difficult situations at work, such as conflict, bullying, sick leave or dismissal. Open to employees, managers, union representatives and jobseekers.");

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { 1, 3 });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 106,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 107,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 108,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 109,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 110,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 111,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 112,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 113,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 114,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 115,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 116,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 117,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 118,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 119,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 120,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 121,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 122,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { 1, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 201,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 202,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 203,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 204,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 205,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 206,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 207,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 208,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 209,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 210,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 211,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 212,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 213,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 214,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 215,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 216,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 217,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 218,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 219,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 220,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 221,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 222,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 223,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 224,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 225,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 226,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 227,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 228,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 229,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 230,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 231,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 232,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 233,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 234,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 235,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 236,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 237,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 238,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 239,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 240,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 241,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 242,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 243,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 244,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 245,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 246,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 247,
                columns: new[] { "ParentId", "PhoneMenuOption" },
                values: new object[] { null, null });

            migrationBuilder.CreateIndex(
                name: "IX_Resources_ParentId",
                table: "Resources",
                column: "ParentId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Resources_ParentId",
                table: "Resources",
                sql: "\"ParentId\" <> \"Id\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Resources_PhoneMenuOption",
                table: "Resources",
                sql: "\"PhoneMenuOption\" IS NULL OR (\"PhoneMenuOption\" BETWEEN 1 AND 9 AND \"Phone\" IS NOT NULL)");

            migrationBuilder.AddForeignKey(
                name: "FK_Resources_Resources_ParentId",
                table: "Resources",
                column: "ParentId",
                principalTable: "Resources",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Resources_Resources_ParentId",
                table: "Resources");

            migrationBuilder.DropIndex(
                name: "IX_Resources_ParentId",
                table: "Resources");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Resources_ParentId",
                table: "Resources");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Resources_PhoneMenuOption",
                table: "Resources");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "Resources");

            migrationBuilder.DropColumn(
                name: "PhoneMenuOption",
                table: "Resources");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 17,
                column: "Description",
                value: "Rådgivning om vanskelige forhold på jobben, som konflikt, mobbing, sykefravær eller oppsigelse. Åpen for arbeidstakere, ledere, tillitsvalgte og arbeidssøkere. Velg tast 3 i menyen.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 18,
                column: "Description",
                value: "Advice about difficult situations at work, such as conflict, bullying, sick leave or dismissal. Open to employees, managers, union representatives and jobseekers. Choose option 3 in the menu.");
        }
    }
}

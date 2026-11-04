using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedAcuteRecheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 27,
                column: "Description",
                value: "Barnevernvakt for henvendelser utenfor alminnelig kontortid. Du kan ringe for generelle råd og veiledning eller for å melde en bekymring.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 28,
                column: "Description",
                value: "The child welfare out-of-hours service, for enquiries outside normal office hours. You can call for general advice and guidance or to report a concern.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "Krisesenter for kvinner, menn og barn som er utsatt for vold i nære relasjoner. Tilbudet er gratis.", "Døgnåpent" });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "A crisis centre for women, men and children affected by violence in close relationships. The service is free.", "Open 24 hours" });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 41,
                column: "Description",
                value: "Gratis døgnåpent tilbud til kvinner, menn og barn som er utsatt for vold i nære relasjoner. Adressen oppgis først når du tar kontakt, av hensyn til sikkerheten.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 42,
                column: "Description",
                value: "A free 24-hour service for women, men and children affected by violence in close relationships. The address is only given when you make contact, for safety reasons.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 131,
                column: "OpeningHours",
                value: "Døgnåpent");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 159,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "Barnevernets akuttberedskap for barn og unge. Du kan ta kontakt hvis du selv blir utsatt for vold, seksuelle overgrep eller omsorgssvikt, eller kjenner til at barn eller unge blir det.", "Døgnåpent" });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 160,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "The child welfare emergency service for children and young people. You can get in touch if you are exposed to violence, sexual abuse or neglect yourself, or know of children or young people who are.", "Open 24 hours" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 11, 4), "https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt/" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 4,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 4));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 5,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 4));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 11, 4), "https://www.hamar.kommune.no/krisesenter/" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 11, 4), "https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "IsAlwaysOpen", "LastVerified" },
                values: new object[] { true, new DateOnly(2026, 11, 4) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 19,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 4));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 21,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 4));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 23,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 4));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 24,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 4));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 25,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 4));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 216,
                column: "LastVerified",
                value: new DateOnly(2026, 11, 4));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 218,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 11, 4), "https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/overgrepsmottaket/" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 221,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 11, 4), "https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/psykososial-akuttjeneste/" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 222,
                columns: new[] { "IsAlwaysOpen", "LastVerified", "Website" },
                values: new object[] { true, new DateOnly(2026, 11, 4), "https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 236,
                columns: new[] { "Address", "IsAlwaysOpen", "LastVerified", "Website" },
                values: new object[] { "Grønlandsleiret 44 (Politihuset i Oslo), 0190 Oslo", true, new DateOnly(2026, 11, 4), "https://www.barnevernvakten.no/kommuner/oslo-kommune" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 27,
                column: "Description",
                value: "Barnevernets akuttberedskap på kveld, natt, helg og helligdager for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret kan ringe.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 28,
                column: "Description",
                value: "The child welfare emergency service, staffed evenings, nights, weekends and public holidays for children and young people in urgent situations. Both children themselves and worried adults can call.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "Krisesenter for kvinner, menn og barn som er utsatt for vold eller trusler om vold i nære relasjoner. Tilbudet er gratis, og du trenger ingen henvisning.", null });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "A crisis centre for women, men and children affected by violence or threats of violence in close relationships. The service is free and needs no referral.", null });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 41,
                column: "Description",
                value: "Gratis døgnåpent tilbud til kvinner, menn og barn som er utsatt for vold i nære relasjoner, voldtekt eller tvangsekteskap. Adressen oppgis først når du tar kontakt, av hensyn til sikkerheten.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 42,
                column: "Description",
                value: "A free 24-hour service for women, men and children affected by violence in close relationships, rape or forced marriage. The address is only given when you make contact, for safety reasons.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 131,
                column: "OpeningHours",
                value: "Åpent 00–24");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 159,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "Barnevernets akuttberedskap for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret for et barn kan ta kontakt.", null });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 160,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "The child welfare emergency service for children and young people in urgent situations. Both children themselves and adults worried about a child can get in touch.", null });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 10, 26), "https://www.helsenorge.no/legevakt/" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 4,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 5,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 10, 26), "https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/krisesenter/" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 8, 13), "https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/hjelpetelefoner-for-familier-og-barn-unge/" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "IsAlwaysOpen", "LastVerified" },
                values: new object[] { false, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 19,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 21,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 23,
                column: "LastVerified",
                value: new DateOnly(2026, 9, 9));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 24,
                column: "LastVerified",
                value: new DateOnly(2026, 9, 9));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 25,
                column: "LastVerified",
                value: new DateOnly(2026, 9, 9));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 216,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 218,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 10, 26), "https://www.oslo.kommune.no" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 221,
                columns: new[] { "LastVerified", "Website" },
                values: new object[] { new DateOnly(2026, 10, 26), "https://www.oslo.kommune.no" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 222,
                columns: new[] { "IsAlwaysOpen", "LastVerified", "Website" },
                values: new object[] { false, new DateOnly(2026, 10, 26), "https://www.oslo.kommune.no" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 236,
                columns: new[] { "Address", "IsAlwaysOpen", "LastVerified", "Website" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13), "https://www.oslo.kommune.no" });
        }
    }
}

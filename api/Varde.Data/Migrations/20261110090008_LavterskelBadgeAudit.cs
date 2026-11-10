using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class LavterskelBadgeAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 33,
                columns: new[] { "CostNote", "Description" },
                values: new object[] { "Tilbudet er gratis.", "Støtte til å mestre eget boforhold for deg som er fylt 18 år og har langvarige utfordringer knyttet til rus og/eller psykisk lidelse. Teamet følger deg opp enten du bor i kommunal bolig, leier privat eller eier egen bolig. Teamet disponerer ikke boliger og tildeler ikke kommunale boliger. Søker du kommunal bolig, kan du skrive i søknaden at du ønsker vurdering av deltakelse i Housing First. Ta kontakt for en informasjonssamtale før du søker. Skal du delta, får du et vedtak." });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 34,
                columns: new[] { "CostNote", "Description" },
                values: new object[] { "The service is free.", "Support to manage your own home for people aged 18 or over with long-term difficulties related to substance use and/or mental illness. The team follows you up whether you live in municipal housing, rent privately or own your home. The team does not hold or allocate municipal housing. If you apply for municipal housing, you can write in the application that you want to be assessed for Housing First. Get in touch for an information talk before you apply. If you join, you get a formal decision (vedtak)." });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Address", "IsLowThreshold" },
                values: new object[] { "Industrigata 17, 3. etg., 2619 Lillehammer", false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "Address", "IsLowThreshold" },
                values: new object[] { "Industrigata 17, 3. etg., 2619 Lillehammer", false });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 305,
                column: "IsLowThreshold",
                value: false);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 335,
                column: "IsLowThreshold",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 33,
                columns: new[] { "CostNote", "Description" },
                values: new object[] { "Våre tjenester er gratis.", "Tilbud til bostedsløse med rus- eller psykiske helseutfordringer, der du først får en varig bolig og deretter oppfølging der du bor. Målet er en stabil bosituasjon uten krav om rusfrihet på forhånd." });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 34,
                columns: new[] { "CostNote", "Description" },
                values: new object[] { "Our services are free.", "A service for homeless people with substance use or mental health difficulties, where you first get permanent housing and then receive support where you live. The aim is a stable home without requiring sobriety first." });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Address", "IsLowThreshold" },
                values: new object[] { null, true });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "Address", "IsLowThreshold" },
                values: new object[] { null, true });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 305,
                column: "IsLowThreshold",
                value: true);

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 335,
                column: "IsLowThreshold",
                value: true);
        }
    }
}

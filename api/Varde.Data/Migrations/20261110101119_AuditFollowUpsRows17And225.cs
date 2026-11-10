using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class AuditFollowUpsRows17And225 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 137,
                column: "Description",
                value: "Lavterskeltilbud med helse- og sosialtjenester for deg med rusutfordringer, med brukerrom, feltpleie, lege og akutt overnatting. Feltpleien har gratis drop-in helsetjenester. For en akuttplass trenger du et vedtak: på hverdager kl. 09:00–15:00 kontakter du bydelen din, ellers Oslo legevakt eller psykososial akuttjeneste.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 138,
                column: "Description",
                value: "A low-threshold centre with health and social services for people with substance use difficulties, offering a drug consumption room, field nursing, a doctor and emergency overnight accommodation. Field nursing offers free drop-in health services. An emergency bed needs a formal decision (vedtak): on weekdays 09:00–15:00 contact your district (bydel), at other times Oslo legevakt or the psychosocial emergency service.");

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                column: "Website",
                value: "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/housing-first/");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 137,
                column: "Description",
                value: "Lavterskeltilbud med helse- og sosialtjenester for deg med rusutfordringer, med brukerrom, feltpleie, lege og akutt overnatting. Du trenger ikke henvisning for å komme.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 138,
                column: "Description",
                value: "A low-threshold centre with health and social services for people with substance use difficulties, offering a drug consumption room, field nursing, a doctor and emergency overnight accommodation. No referral is needed.");

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                column: "Website",
                value: "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/");
        }
    }
}

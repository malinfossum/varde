using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedOslo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Resources",
                columns: new[] { "Id", "Address", "ChatUrl", "CreatedAt", "Email", "IsNational", "LastVerified", "MunicipalityId", "Name", "Phone", "UpdatedAt", "Website" },
                values: new object[,]
                {
                    { 201, "Trygve Lies plass 5, 1051 Oslo (Furuset senter, Bydelshuset, Innbyggertorget, 1. etasje)", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Alna", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 202, "Ulvenveien 84A, 0581 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Bjerke", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 203, "Drammensveien 60, 0271 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Frogner", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 204, "Hagegata 24, 0653 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Gamle Oslo", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 205, "Kakkelovnskroken 3A, 0954 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Grorud", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 206, "Marstrandgata 6, 0566 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Grünerløkka", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 207, "Gullhaugveien 7, 0484 Oslo, inngang fra Sandakerveien 130–138", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Nordre Aker", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 208, "Cecilie Thoresens vei 1, 1153 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Nordstrand", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 209, "Thorvald Meyers gate 9, 0555 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Sagene", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 210, "Pilestredet 56, 0167 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav St. Hanshaugen", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 211, "Stovner Senter 17, 0985 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Stovner", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 212, "Ravnåsveien 3, 1254 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Søndre Nordstrand", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 213, "Hoffsveien 48, 0377 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Ullern", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 214, "Sørkedalsveien 150A, 0754 Oslo, inngang til venstre når man kommer inn hovedinngangen", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Vestre Aker", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 215, "Olaf Helsets vei 6, 0694 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Nav Østensjø", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 216, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Oslo Krisesenter", "22 48 03 80", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslokrisesenter.no" },
                    { 217, null, "https://www.ungerelasjoner.no/", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Unge Relasjoner", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.ungerelasjoner.no" },
                    { 218, "Trondheimsveien 233 (Aker sykehus), 0587 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Overgrepsmottaket, Legevakten i Oslo", "23 04 05 00", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 219, "Brugata 19, 0186 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Alternativ til Vold (ATV) Oslo", "22 40 11 10", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://atv-stiftelsen.no" },
                    { 220, "Lovisenberggata 15 C, 0456 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Vake kirkelig ressurssenter mot seksuelle overgrep", "23 22 79 30", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.kirkeligressurssenter.no" },
                    { 221, "Trondheimsveien 233 (Aker sykehus), 0587 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Psykososial akuttjeneste, Legevakten i Oslo", "23 04 05 00", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 222, "Trondheimsveien 233 (Aker sykehus)", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Legevakten i Oslo", "116 117", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 223, "Maridalsveien 3, 0178 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Uteseksjonen, Oslo kommune", "913 03 913", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 224, "Maridalsveien 3, 0178 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Uteseksjonens psykologtjeneste", "913 03 913", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 225, "Hausmannsgate 11, 0182 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Prindsen mottakssenter", "23 42 72 00", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 226, "Urtegata 16 A, 0187 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Feltpleien i Oslo (Frelsesarmeen)", "22 67 43 45", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://frelsesarmeen.no" },
                    { 227, "Urtegata 16 A, 0187 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "fyrlyset.oslo@frelsesarmeen.no", false, new DateOnly(2026, 8, 13), 8, "Fyrlyset, Oslo (Frelsesarmeen)", "23 03 66 80", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://frelsesarmeen.no" },
                    { 228, "Lilletorget 1, 5. etasje", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "LINK Oslo", "940 30 488", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://linkoslo.no" },
                    { 229, "Trygve Lies Plass 6, 1051 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Rask psykisk helsehjelp – Bydel Alna", "22 30 77 12", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 230, "Hoffsveien 48, 0377 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Rask psykisk helsehjelp – Bydel Ullern", "95 29 83 22", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 231, "Sørkedalsveien 150 A, 0754 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Rask psykisk helsehjelp – Bydel Vestre Aker", "47 78 13 15", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 232, "Hagegata 32, 0653 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Ung Arena Oslo sentrum", "904 15 388", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 233, "Storgata 19, 0184 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "frirettshjelp@vel.oslo.kommune.no", false, new DateOnly(2026, 8, 13), 8, "Kontoret for fri rettshjelp, Oslo kommune", "23 48 79 00", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 234, "Skippergata 23, 0154 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "JURK – Juridisk rådgivning for kvinner", "22 84 29 50", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://foreninger.uio.no/jurk/" },
                    { 235, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Gatejuristen", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://kirkensbymisjon.no/gatejuristen/" },
                    { 236, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Barnevernvakten i Oslo", "40 42 77 77", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 237, "Dronningens gate 8 A, 0152 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Familievernkontoret Christiania", "23 28 39 40", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.bufdir.no" },
                    { 238, "Grønlandsleiret 25, 0190 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Familievernkontoret Enerhaugen", "466 17 010", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.bufdir.no" },
                    { 239, "Oscars gate 20, 0352 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Familievernkontoret Homansbyen", "466 16 660", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.bufdir.no" },
                    { 240, "Kabelgata 2, 0581 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Familievernkontoret Oslo Nord", "46 61 51 20", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.bufdir.no" },
                    { 241, "Hagegata 32, 0653 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Gamle Oslo helsestasjon for ungdom (HFU)", "415 65 535", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 242, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Helsestasjon for ungdom (HFU) i Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 243, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Oslohjelpa", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 244, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Boligkontorene i Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 245, "Bydel Stovner, Boligenheten, Karl Fossums vei 30, 0985 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Stovner boligkontor", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 246, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Økonomisk rådgivning og gjeldsrådgivning, Oslo kommune", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.oslo.kommune.no" },
                    { 247, "Herslebsgate 43, 0578 Oslo", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 8, "Bymisjonssenteret, Oslo (Kirkens Bymisjon)", "22 66 67 80", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://kirkensbymisjon.no" }
                });

            migrationBuilder.InsertData(
                table: "ResourceCategories",
                columns: new[] { "CategoryId", "ResourceId" },
                values: new object[,]
                {
                    { 1, 201 },
                    { 2, 201 },
                    { 7, 201 },
                    { 1, 202 },
                    { 2, 202 },
                    { 7, 202 },
                    { 1, 203 },
                    { 2, 203 },
                    { 7, 203 },
                    { 1, 204 },
                    { 2, 204 },
                    { 7, 204 },
                    { 1, 205 },
                    { 2, 205 },
                    { 7, 205 },
                    { 1, 206 },
                    { 2, 206 },
                    { 4, 206 },
                    { 7, 206 },
                    { 1, 207 },
                    { 2, 207 },
                    { 7, 207 },
                    { 1, 208 },
                    { 2, 208 },
                    { 7, 208 },
                    { 1, 209 },
                    { 2, 209 },
                    { 7, 209 },
                    { 1, 210 },
                    { 2, 210 },
                    { 7, 210 },
                    { 1, 211 },
                    { 2, 211 },
                    { 7, 211 },
                    { 1, 212 },
                    { 2, 212 },
                    { 7, 212 },
                    { 1, 213 },
                    { 2, 213 },
                    { 7, 213 },
                    { 1, 214 },
                    { 2, 214 },
                    { 7, 214 },
                    { 1, 215 },
                    { 2, 215 },
                    { 7, 215 },
                    { 2, 216 },
                    { 5, 216 },
                    { 9, 216 },
                    { 3, 217 },
                    { 5, 217 },
                    { 5, 218 },
                    { 9, 218 },
                    { 3, 219 },
                    { 5, 219 },
                    { 3, 220 },
                    { 5, 220 },
                    { 3, 221 },
                    { 5, 221 },
                    { 9, 221 },
                    { 3, 222 },
                    { 9, 222 },
                    { 3, 223 },
                    { 4, 223 },
                    { 3, 224 },
                    { 4, 224 },
                    { 2, 225 },
                    { 3, 225 },
                    { 4, 225 },
                    { 4, 226 },
                    { 2, 227 },
                    { 4, 227 },
                    { 3, 228 },
                    { 3, 229 },
                    { 4, 229 },
                    { 3, 230 },
                    { 4, 230 },
                    { 3, 231 },
                    { 4, 231 },
                    { 3, 232 },
                    { 6, 232 },
                    { 1, 233 },
                    { 2, 233 },
                    { 8, 233 },
                    { 1, 234 },
                    { 5, 234 },
                    { 8, 234 },
                    { 4, 235 },
                    { 8, 235 },
                    { 5, 236 },
                    { 6, 236 },
                    { 9, 236 },
                    { 6, 237 },
                    { 6, 238 },
                    { 6, 239 },
                    { 6, 240 },
                    { 3, 241 },
                    { 6, 241 },
                    { 3, 242 },
                    { 6, 242 },
                    { 3, 243 },
                    { 6, 243 },
                    { 2, 244 },
                    { 2, 245 },
                    { 1, 246 },
                    { 3, 247 },
                    { 4, 247 }
                });

            migrationBuilder.InsertData(
                table: "ResourceTranslations",
                columns: new[] { "Id", "Description", "LanguageCode", "OpeningHours", "ResourceId" },
                values: new object[,]
                {
                    { 89, "Nav-kontoret for deg som bor i bydel Alna, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 201 },
                    { 90, "The Nav office for people living in the Alna district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 201 },
                    { 91, "Nav-kontoret for deg som bor i bydel Bjerke, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 202 },
                    { 92, "The Nav office for people living in the Bjerke district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 202 },
                    { 93, "Nav-kontoret for deg som bor i bydel Frogner, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 203 },
                    { 94, "The Nav office for people living in the Frogner district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 203 },
                    { 95, "Nav-kontoret for deg som bor i bydel Gamle Oslo, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 204 },
                    { 96, "The Nav office for people living in the Gamle Oslo district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 204 },
                    { 97, "Nav-kontoret for deg som bor i bydel Grorud, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 205 },
                    { 98, "The Nav office for people living in the Grorud district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 205 },
                    { 99, "Nav-kontoret for deg som bor i bydel Grünerløkka. Kontoret hjelper med arbeid, nødhjelp, økonomisk rådgivning, bolig, flyktningtjeneste og oppfølging ved rusproblemer.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 206 },
                    { 100, "The Nav office for people living in the Grünerløkka district. The office helps with work, emergency assistance, money advice, housing, refugee services and substance use follow-up.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 206 },
                    { 101, "Nav-kontoret for deg som bor i bydel Nordre Aker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 207 },
                    { 102, "The Nav office for people living in the Nordre Aker district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 207 },
                    { 103, "Nav-kontoret for deg som bor i bydel Nordstrand, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 208 },
                    { 104, "The Nav office for people living in the Nordstrand district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 208 },
                    { 105, "Nav-kontoret for deg som bor i bydel Sagene, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Hver onsdag er det drop-in for økonomirådgivning fra klokken 9 til 11.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15. Drop-in økonomirådgivning onsdager 9–11", 209 },
                    { 106, "The Nav office for people living in the Sagene district, with help on financial assistance, work, housing and other social services. Every Wednesday there is a drop-in for money advice from 9 to 11.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15. Money-advice drop-in Wednesdays 9–11", 209 },
                    { 107, "Nav-kontoret for deg som bor i bydel St. Hanshaugen, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 210 },
                    { 108, "The Nav office for people living in the St. Hanshaugen district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 210 },
                    { 109, "Nav-kontoret for deg som bor i bydel Stovner, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 211 },
                    { 110, "The Nav office for people living in the Stovner district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 211 },
                    { 111, "Nav-kontoret for deg som bor i bydel Søndre Nordstrand, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 212 },
                    { 112, "The Nav office for people living in the Søndre Nordstrand district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 212 },
                    { 113, "Nav-kontoret for deg som bor i bydel Ullern, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 213 },
                    { 114, "The Nav office for people living in the Ullern district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 213 },
                    { 115, "Nav-kontoret for deg som bor i bydel Vestre Aker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 214 },
                    { 116, "The Nav office for people living in the Vestre Aker district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 214 },
                    { 117, "Nav-kontoret for deg som bor i bydel Østensjø, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.", "nb", "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15", 215 },
                    { 118, "The Nav office for people living in the Østensjø district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.", "en", "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15", 215 },
                    { 119, "Gratis døgnåpent tilbud til deg som er utsatt for vold i nære relasjoner. Du kan ringe for råd og veiledning, og senteret har også botilbud. Adressen er hemmelig av hensyn til sikkerheten.", "nb", "Døgnåpent", 216 },
                    { 120, "A free 24-hour service for anyone affected by violence in a close relationship. You can call for advice and guidance, and the centre also offers a place to stay. The address is kept secret for safety reasons.", "en", "Open 24 hours", 216 },
                    { 121, "Anonym chat for deg mellom 16 og 25 år som er i en usunn relasjon. Du chatter med fagpersoner som har lang erfaring med vold i nære relasjoner.", "nb", "Chat tirsdag 12–20 og fredag 12–15", 217 },
                    { 122, "An anonymous chat for people aged 16 to 25 who are in an unhealthy relationship. You chat with professionals who have long experience with violence in close relationships.", "en", "Chat Tuesday 12–20 and Friday 12–15", 217 },
                    { 123, "Gratis døgnåpent helsetilbud for deg fra 14 år som har vært utsatt for voldtekt, voldtektsforsøk eller andre seksuelle overgrep. Du kan komme uten å ha anmeldt forholdet til politiet. Gjelder det et barn under 14 år, skal henvendelsen gå til barnemottaket.", "nb", "Døgnåpent", 218 },
                    { 124, "A free 24-hour health service for people aged 14 and over who have experienced rape, attempted rape or other sexual assault. You can come without having reported it to the police. For a child under 14, the enquiry goes to the children's unit instead.", "en", "Open 24 hours", 218 },
                    { 125, "Behandlingstilbud til deg over 18 år som bruker vold eller har problemer med sinne og aggresjon. Både kvinner og menn kan få behandling, individuelt eller i gruppe.", "nb", "Telefontid mandag–fredag 09.00–15.00", 219 },
                    { 126, "A treatment service for people over 18 who use violence or struggle with anger and aggression. Both women and men can receive treatment, individually or in a group.", "en", "Phone hours Monday–Friday 09.00–15.00", 219 },
                    { 127, "Ressurssenter for deg som har opplevd seksuelle overgrep eller vold, med samtaler og veiledning. Du kan ta kontakt på telefon eller SMS.", "nb", null, 220 },
                    { 128, "A resource centre for people who have experienced sexual abuse or violence, offering counselling and guidance. You can get in touch by phone or text message.", "en", null, 220 },
                    { 129, "Kommunens døgnåpne tjeneste ved akutt oppståtte kriser. Du kan få samtale på legevakten, på telefon eller video, og tjenesten kan også komme hjem til deg. Du trenger ikke henvisning, og tilbudet er gratis.", "nb", "Døgnåpent", 221 },
                    { 130, "The city's 24-hour service for people in an acute crisis. You can talk at the emergency clinic, by phone or by video, and the service can also come to your home. No referral is needed and it is free.", "en", "Open 24 hours", 221 },
                    { 131, "Legevakten i Oslo er åpen hele døgnet for deg som trenger rask helsehjelp når fastlegen er stengt. Ved fare for liv og helse skal du ringe 113.", "nb", "Åpent 00–24", 222 },
                    { 132, "The Oslo emergency clinic is open around the clock for anyone needing urgent medical help when their regular doctor is closed. If there is danger to life, call 113 instead.", "en", "Open 24 hours", 222 },
                    { 133, "Oslo kommunes oppsøkende tjeneste i sentrum, med særlig fokus på unge opptil 25 år. Patruljer er ute hver dag og kveld, og du kan også komme til rådgivningstjenesten eller ringe eller sende SMS.", "nb", "Rådgivningstjenesten i Maridalsveien 3 mandag–fredag 10:00–15:00", 223 },
                    { 134, "The City of Oslo's outreach service in the city centre, with a particular focus on young people up to 25. Patrols are out every day and evening, and you can also visit the advice service or call or text.", "en", "Advice service at Maridalsveien 3 Monday–Friday 10:00–15:00", 223 },
                    { 135, "Psykologhjelp for deg under 25 år, gjennom Uteseksjonen. Du kan ta kontakt selv på telefon eller SMS, uten henvisning.", "nb", null, 224 },
                    { 136, "Psychological help for people under 25, through the outreach service. You can get in touch yourself by phone or text, without a referral.", "en", null, 224 },
                    { 137, "Lavterskeltilbud med helse- og sosialtjenester for deg med rusutfordringer, med brukerrom, feltpleie, lege og akutt overnatting. Du trenger ikke henvisning for å komme.", "nb", "Brukerrom mandag–søndag 09:00–22:00. Feltpleie mandag–fredag 09:00–22:00, lørdag–søndag 10:00–20:00", 225 },
                    { 138, "A low-threshold centre with health and social services for people with substance use difficulties, offering a drug consumption room, field nursing, a doctor and emergency overnight accommodation. No referral is needed.", "en", "Consumption room Monday–Sunday 09:00–22:00. Field nursing Monday–Friday 09:00–22:00, Saturday–Sunday 10:00–20:00", 225 },
                    { 139, "Helsehjelp for deg som lever med rusproblemer, med sårstell, prevensjon og andre helsetjenester uten timeavtale. Lege er til stede onsdag og fredag.", "nb", "Mandag–fredag 09.00–15.00", 226 },
                    { 140, "Health care for people living with substance use problems, with wound care, contraception and other health services without an appointment. A doctor is present on Wednesdays and Fridays.", "en", "Monday–Friday 09.00–15.00", 226 },
                    { 141, "Kontaktsenter for deg over 18 år med rusproblemer, der du kan få mat, drikke, klær og mulighet til å vaske deg. Du kan komme innom uten avtale.", "nb", "Hverdager 09.00–14.30, søndager 11.00–13.00", 227 },
                    { 142, "A drop-in centre for people over 18 with substance use problems, where you can get food, drink, clothes and a chance to wash. You can come without an appointment.", "en", "Weekdays 09.00–14.30, Sundays 11.00–13.00", 227 },
                    { 143, "Senter for selvhjelp og mestring, der du kan få hjelp til å starte eller finne en selvhjelpsgruppe. Tilbudet er gratis og du trenger ingen henvisning.", "nb", "Telefon hverdager 9–15", 228 },
                    { 144, "A centre for self-help and coping, where you can get help starting or finding a self-help group. The service is free and needs no referral.", "en", "Phone weekdays 9–15", 228 },
                    { 145, "Kortvarig og gratis behandling for deg med bostedsadresse i bydel Alna som har milde til moderate psykiske plager. Du tar kontakt selv, uten henvisning fra lege.", "nb", null, 229 },
                    { 146, "Short-term, free treatment for people registered as living in the Alna district with mild to moderate mental health difficulties. You get in touch yourself, without a doctor's referral.", "en", null, 229 },
                    { 147, "Kortvarig og gratis behandling for deg i bydel Ullern som har milde til moderate psykiske plager. Telefonen er bare bemannet én time i uken, så ring innenfor telefontiden.", "nb", "Telefonen er bemannet torsdager 12:00–13:00", 230 },
                    { 148, "Short-term, free treatment for people in the Ullern district with mild to moderate mental health difficulties. The phone is staffed only one hour a week, so call within the stated time.", "en", "Phone staffed Thursdays 12:00–13:00", 230 },
                    { 149, "Gratis korttidsbehandling for deg over 16 år i bydel Vestre Aker med milde til moderate psykiske utfordringer. Du trenger ikke henvisning.", "nb", null, 231 },
                    { 150, "Free short-term treatment for people over 16 in the Vestre Aker district with mild to moderate mental health difficulties. No referral is needed.", "en", null, 231 },
                    { 151, "Gratis lavterskeltilbud med samtaler og veiledning for deg mellom 12 og 25 år som har det vanskelig psykisk. Du trenger ingen henvisning, og på torsdager kan du komme på drop-in.", "nb", "Drop-in torsdager 14:00–17:00", 232 },
                    { 152, "A free low-threshold service offering conversations and guidance for people aged 12 to 25 who are struggling mentally. No referral is needed, and on Thursdays you can drop in.", "en", "Drop-in Thursdays 14:00–17:00", 232 },
                    { 153, "Gratis juridisk rådgivning fra advokater for deg som bor i Oslo og omegn. Alle får inntil en halvtime med advokat, og du kan bestille time eller komme på drop-in på ettermiddagen.", "nb", "Timeavtaler mandag–fredag 08:00–15:30. Drop-in mandag–torsdag 16:00–19:00", 233 },
                    { 154, "Free legal advice from lawyers for people living in Oslo and the surrounding area. Everyone gets up to half an hour with a lawyer, and you can book a time or come to the afternoon drop-in.", "en", "Appointments Monday–Friday 08:00–15:30. Drop-in Monday–Thursday 16:00–19:00", 233 },
                    { 155, "Gratis rettshjelp fra jusstudenter til kvinner og personer som definerer seg som kvinner, i saker om blant annet vold, familie, arbeid, bolig og gjeld. Nye saker tas imot i egne tider.", "nb", "Nye saker: mandag 12:00–15:00, onsdag 09:00–12:00 (kun telefon) og onsdag 17:00–20:00", 234 },
                    { 156, "Free legal aid from law students for women and people who identify as women, in areas such as violence, family, work, housing and debt. New cases are taken during separate opening times.", "en", "New cases: Monday 12:00–15:00, Wednesday 09:00–12:00 (phone only) and Wednesday 17:00–20:00", 234 },
                    { 157, "Gratis rettshjelp til deg som har eller har hatt rusproblemer. Kontaktinformasjon må hentes fra Gatejuristens egne nettsider.", "nb", null, 235 },
                    { 158, "Free legal aid for people who have, or have had, substance use problems. Contact details must be taken from Gatejuristen's own website.", "en", null, 235 },
                    { 159, "Barnevernets akuttberedskap for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret for et barn kan ta kontakt.", "nb", null, 236 },
                    { 160, "The child welfare emergency service for children and young people in urgent situations. Both children themselves and adults worried about a child can get in touch.", "en", null, 236 },
                    { 161, "Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Søndre Nordstrand, Nordstrand, Grünerløkka og Frogner.", "nb", "Åpent 08.15–15.30, telefontid 08.30–15.00", 237 },
                    { 162, "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Søndre Nordstrand, Nordstrand, Grünerløkka and Frogner districts.", "en", "Open 08.15–15.30, phone hours 08.30–15.00", 237 },
                    { 163, "Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Alna, Gamle Oslo, Østensjø og Nordre Aker.", "nb", "08.30–15.00", 238 },
                    { 164, "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Alna, Gamle Oslo, Østensjø and Nordre Aker districts.", "en", "08.30–15.00", 238 },
                    { 165, "Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene St. Hanshaugen, Ullern, Sagene og Vestre Aker.", "nb", "08.30–15.00", 239 },
                    { 166, "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the St. Hanshaugen, Ullern, Sagene and Vestre Aker districts.", "en", "08.30–15.00", 239 },
                    { 167, "Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Bjerke, Grorud og Stovner.", "nb", "08.30–15.30", 240 },
                    { 168, "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Bjerke, Grorud and Stovner districts.", "en", "08.30–15.30", 240 },
                    { 169, "Gratis helsestasjon for ungdom, med helsesykepleier, lege og samtaler om kropp, seksualitet, psykisk helse og andre ting du lurer på. Du kan bruke hvilken som helst helsestasjon for ungdom i Oslo.", "nb", "Telefontid tirsdag og torsdag 11:00–14:00", 241 },
                    { 170, "A free youth health clinic with nurses, a doctor and conversations about your body, sexuality, mental health and anything else on your mind. You can use any youth health clinic in Oslo.", "en", "Phone hours Tuesday and Thursday 11:00–14:00", 241 },
                    { 171, "Alle ungdommer i Oslo mellom 12 og 24 år kan bruke helsestasjon for ungdom, og tjenestene er gratis. Du velger fritt hvilken helsestasjon du vil gå til.", "nb", null, 242 },
                    { 172, "All young people in Oslo aged 12 to 24 can use a youth health clinic, and the services are free. You are free to choose whichever clinic you want to go to.", "en", null, 242 },
                    { 173, "Gratis lavterskeltilbud som skal hjelpe barn, unge og familier raskt når de trenger det. Du trenger ingen henvisning, og du tar kontakt med Oslohjelpa i din egen bydel.", "nb", null, 243 },
                    { 174, "A free low-threshold service meant to help children, young people and families quickly when they need it. No referral is needed, and you contact Oslohjelpa in your own district.", "en", null, 243 },
                    { 175, "Alle bydeler i Oslo har et boligkontor som hjelper deg med å søke kommunal bolig og kommunal bostøtte. Du finner riktig kontor ved å velge bydelen din eller søke opp adressen din.", "nb", null, 244 },
                    { 176, "Every district in Oslo has a housing office that helps you apply for municipal housing and municipal housing benefit. You find the right office by choosing your district or searching for your address.", "en", null, 244 },
                    { 177, "Boligkontoret i bydel Stovner, som hjelper deg med å søke kommunal bolig og kommunal bostøtte. Du kan få hjelp til å fylle ut søknaden.", "nb", null, 245 },
                    { 178, "The housing office in the Stovner district, which helps you apply for municipal housing and municipal housing benefit. You can get help filling in the application.", "en", null, 245 },
                    { 179, "Hjelp til deg som sliter med å betale regninger eller gjeld, med råd om økonomi og gjeldsordning. Du tar kontakt med Nav-kontoret i bydelen din for å avtale time.", "nb", null, 246 },
                    { 180, "Help for people struggling to pay bills or debt, with advice on finances and debt settlement. You contact the Nav office in your district to book an appointment.", "en", null, 246 },
                    { 181, "Kirkens Bymisjons senter på Grønland, med møteplasser, aktiviteter og oppfølging for mennesker i vanskelige livssituasjoner.", "nb", null, 247 },
                    { 182, "Kirkens Bymisjon's centre at Grønland, with meeting places, activities and follow-up for people in difficult life situations.", "en", null, 247 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 201 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 201 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 201 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 202 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 202 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 202 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 203 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 203 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 203 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 204 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 204 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 204 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 205 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 205 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 205 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 206 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 206 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 206 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 206 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 207 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 207 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 207 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 208 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 208 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 208 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 209 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 209 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 209 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 210 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 210 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 210 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 211 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 211 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 211 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 212 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 212 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 212 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 213 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 213 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 213 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 214 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 214 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 214 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 215 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 215 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 215 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 216 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 216 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 216 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 217 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 217 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 218 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 218 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 219 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 219 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 220 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 220 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 221 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 221 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 221 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 222 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 222 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 223 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 223 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 224 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 224 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 225 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 225 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 225 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 226 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 227 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 227 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 228 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 229 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 229 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 230 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 230 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 231 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 231 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 232 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 232 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 233 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 233 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 8, 233 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 234 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 234 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 8, 234 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 235 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 8, 235 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 236 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 236 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 236 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 237 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 238 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 239 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 240 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 241 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 241 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 242 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 242 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 243 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 243 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 244 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 245 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 246 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 247 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 247 });

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 89);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 90);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 91);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 92);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 93);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 94);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 95);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 96);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 97);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 98);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 99);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 100);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 101);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 102);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 103);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 104);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 105);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 106);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 107);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 108);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 109);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 110);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 111);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 112);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 113);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 114);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 115);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 116);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 117);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 118);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 119);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 120);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 121);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 122);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 123);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 124);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 125);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 126);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 127);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 128);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 129);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 130);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 131);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 132);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 133);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 134);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 135);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 136);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 137);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 138);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 139);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 140);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 141);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 142);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 143);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 144);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 145);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 146);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 147);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 148);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 149);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 150);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 151);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 152);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 153);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 154);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 155);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 156);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 157);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 158);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 159);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 160);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 161);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 162);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 163);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 164);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 165);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 166);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 167);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 168);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 169);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 170);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 171);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 172);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 173);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 174);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 175);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 176);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 177);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 178);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 179);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 180);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 181);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 182);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 201);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 202);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 203);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 204);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 205);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 206);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 207);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 208);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 209);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 210);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 211);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 212);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 213);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 214);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 215);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 216);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 217);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 218);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 219);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 220);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 221);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 222);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 223);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 224);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 225);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 226);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 227);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 228);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 229);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 230);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 231);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 232);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 233);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 234);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 235);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 236);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 237);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 238);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 239);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 240);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 241);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 242);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 243);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 244);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 245);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 246);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 247);
        }
    }
}

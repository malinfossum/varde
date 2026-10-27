using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedLavterskelInnlandet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Resources",
                columns: new[] { "Id", "Address", "ChatUrl", "Cost", "CreatedAt", "Email", "IsAlwaysOpen", "IsLowThreshold", "IsNational", "LastVerified", "MunicipalityId", "Name", "ParentId", "Phone", "PhoneMenuOption", "UpdatedAt", "Website" },
                values: new object[,]
                {
                    { 301, "Sagatunvegen 47A, 2317 Hamar", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@sagatun.no", false, true, false, new DateOnly(2026, 10, 27), 1, "Sagatun Brukerstyrt Senter", null, "62 50 97 55", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://sagatun.no/" },
                    { 302, "Torggata 73, 2317 Hamar", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "hamar@frivillighet.no", false, false, false, new DateOnly(2026, 10, 27), 1, "Hamar Frivilligsentral", null, "62 51 00 96", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://hamar.frivilligsentral.no/" },
                    { 303, "Torggata 83, 2317 Hamar", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "postmottak@hamar.kommune.no", false, false, false, new DateOnly(2026, 10, 27), 1, "Høbben, et sted for ungdom", null, "477 86 203", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.hamar.kommune.no/hobben/hobben-et-sted-for-ungdom" },
                    { 304, "Grønnegt. 51, inngang Håkons gate, 2317 Hamar", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "hamartiltakene@stiftelsencrux.no", false, false, false, new DateOnly(2026, 10, 27), 1, "CRUX Arbeideren", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://stiftelsencrux.no/vare-virksomheter/hamartiltakene/crux-arbeideren" },
                    { 305, "Torggata 71, Hamar", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@evangeliesenteret.no", false, true, false, new DateOnly(2026, 10, 27), 1, "Evangeliesenteret kontaktsenter Hamar", null, "21 00 49 00", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.evangeliesenteret.no/kontaktsenter/hamar" },
                    { 306, "Grønnegata 134, 2317 Hamar", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "barnasstasjonhamar@bks.no", false, true, false, new DateOnly(2026, 10, 27), 1, "Blå Kors barnas stasjon Hamar", null, "990 93 994", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.blakors.no/barnas-stasjon/hamar/" },
                    { 307, "Høyensalgata 74, 2317 Hamar", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "hei@sangen.no", false, true, false, new DateOnly(2026, 10, 27), 1, "Støttesenter for pårørende, Hospice Sangen", null, "62 54 20 90", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.haraldsplass.org/hospice-sangen/" },
                    { 308, "Stormyrveien 9, 2315 HAMAR", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "hamar@redcross.no", false, false, false, new DateOnly(2026, 10, 27), 1, "Hamar Røde Kors", null, "918 21 211", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.rodekors.no/lokalforeninger/hedmark/hamar/" },
                    { 309, "Torggata 83, på Torghjørnet ved Stortorget, Hamar", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "buahamar101@gmail.com", false, false, false, new DateOnly(2026, 10, 27), 1, "BUA Hamar", null, "477 76 977", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://stiftelsencrux.no/vare-virksomheter/hamartiltakene/bua-hamar" },
                    { 310, "Frivilligsentralens lokaler, Torggata 73, 2317 Hamar", null, 2, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, false, new DateOnly(2026, 10, 27), 1, "Åpen barnehage (Ankerløkken barnehage)", null, "909 98 617", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.hamar.kommune.no/category1034.html" },
                    { 311, "Møtested for ungdommer på iskroa i CC amfi/hockeyhallen", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, false, new DateOnly(2026, 10, 27), 1, "Prestrud ungdomsklubb", null, "950 39 833", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 312, "Øvre Vang samfunnshus", null, 2, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, false, new DateOnly(2026, 10, 27), 1, "Fritidsklubb Wiik", null, "950 39 833", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 313, "Foajeen, Hamar Kulturhus, Torggata 100, 2317 Hamar", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@terningkast7.org", false, false, false, new DateOnly(2026, 10, 27), 1, "Terningkast 7", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.terningkast7.no/" },
                    { 314, "Ankerskogen", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, false, new DateOnly(2026, 10, 27), 1, "Parkrun Ankerskogen", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.parkrun.no/ankerskogen/" },
                    { 315, "Storgata 9B", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, new DateOnly(2026, 10, 27), 2, "Lavterskeltilbud Storgata 9B", null, "949 74 618", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/arbeid-og-aktivitetstilbud/lavterskeltilbud-storgata-9b/" },
                    { 316, "Gamlevegen 101", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, new DateOnly(2026, 10, 27), 2, "Lavterskeltilbud Gamlevegen 101", null, "902 43 733", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/lavterskeltilbud-for-personer-med-rusutfordringer/" },
                    { 317, "Brubakken 14, 2615 Lillehammer", null, 3, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@lillehammer.frivilligsentral.no", false, false, false, new DateOnly(2026, 10, 27), 2, "Lillehammer Frivilligsentral", null, "992 69 600", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://lillehammer.frivilligsentral.no/" },
                    { 318, "Anne Mouruds veg 10 G, 2615 Lillehammer", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "lillehammer@rodekors.org", false, false, false, new DateOnly(2026, 10, 27), 2, "Lillehammer Røde Kors", null, "415 80 011", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.rodekors.no/lokalforeninger/oppland/lillehammer/" },
                    { 320, "Øvre Torvgate 8, 2815 Gjøvik", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, new DateOnly(2026, 10, 27), 3, "Blå Kors gatenært Gjøvik (Kafe Kampen)", null, "61 17 04 80", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.blakors.no/gatenaert/kampen/" },
                    { 321, "Strandgata 38, 2821 Gjøvik", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@fontenehusetgjovik.no", false, true, false, new DateOnly(2026, 10, 27), 3, "Fontenehuset Gjøvik", null, "977 30 330", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.fontenehusetgjovik.no/" },
                    { 322, "Øvre Torvgate 2, Gjøvik", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "frivilligsentral@gjovik.kommune.no", false, false, false, new DateOnly(2026, 10, 27), 3, "Gjøvik frivilligsentral avd. Sentrum", null, "61 15 85 55", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://gjovik.frivilligsentral.no/" },
                    { 323, "Øverbyvegen 95, Gjøvik", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "frivilligsentral@gjovik.kommune.no", false, false, false, new DateOnly(2026, 10, 27), 3, "Gjøvik frivilligsentral avd. Øverby (Øverbykafeen og Torsdagstreff)", null, "61 15 85 55", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://gjovik.frivilligsentral.no/overby" },
                    { 324, "Bakkegata 14, 2821 Gjøvik", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "puls@frelsesarmeen.no", false, false, false, new DateOnly(2026, 10, 27), 3, "PULS - ditt værested (Frelsesarmeen Gjøvik og Toten)", null, "409 12 050", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://frelsesarmeen.no/korps/puls-ditt-vaerested" },
                    { 326, "Trondhjemsvegen 8, 2821 Gjøvik", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, false, new DateOnly(2026, 10, 27), 3, "Ung i Gjøvik (Ungdommens hus)", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.gjovik.kommune.no/tjenester/barn-ungdom-og-familie/ung-i-gjovik/" },
                    { 327, "Mimes veg 3, 2817 Gjøvik", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@ashverdag.no", false, false, false, new DateOnly(2026, 10, 27), 3, "Hverdag - Mat & Mening", null, "929 29 994", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.ashverdag.no/" },
                    { 328, "Gjøvik Læringssenter, Teknologiveien 8, Kallerud, Gjøvik", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "gjovik.rode.kors@gmail.com", false, true, false, new DateOnly(2026, 10, 27), 3, "Norsktrening (Gjøvik Røde Kors)", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.rodekors.no/lokalforeninger/oppland/gjovik/" },
                    { 329, "Nordåsveien 6, 2380 Brumunddal", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, false, new DateOnly(2026, 10, 27), 4, "Solsia aktivitetshus", null, "907 78 510", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.ringsaker.kommune.no/tjenester/helse-og-omsorg/psykisk-helse-og-rustjenester/kortvarig-psykisk-helsehjelp" },
                    { 330, "Sjurstuvegen 2B, 2383 Brumunddal", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "ringsaker@mentalhelse.no", false, false, false, new DateOnly(2026, 10, 27), 4, "Mental Helse Ringsaker", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://mentalhelse.no/ringsaker/" },
                    { 331, "Sjurstuvegen 2B, 2383 Brumunddal", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "brumunddal@frivillighet.no", false, false, false, new DateOnly(2026, 10, 27), 4, "Brumunddal frivilligsentral", null, "973 47 717", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://brumunddal.frivilligsentral.no/" },
                    { 332, "Storgata 119, 2390 Moelv", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@moelvfrivilligsentral.no", false, false, false, new DateOnly(2026, 10, 27), 4, "Moelv frivilligsentral", null, "974 34 918", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://moelvfrivilligsentral.no" },
                    { 333, "Kilde Skole, Storgate 31, 2390 Moelv", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "ringsaker@rodekors.org", false, true, false, new DateOnly(2026, 10, 27), 4, "Ringsaker Røde Kors: Norsktrening", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.rodekors.no/lokalforeninger/hedmark/ringsaker/" },
                    { 334, "Buttekvern Aktivitetssenter, Buttekvernveien 1, Brumunddal", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, new DateOnly(2026, 10, 27), 4, "LHL Ringsaker: lavterskeltrim i Brumunddal", null, "22 79 90 00", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.lhl.no/lokallag/lhl-innlandet/lhl-ringsaker/fysisk-aktivitet-brumunddal77/" },
                    { 335, "Skolegata 13, 2335 Stange", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, new DateOnly(2026, 10, 27), 5, "Stangehjelpa aktivitetshus", null, "911 65 956", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/stangehjelpa/voksne/stangehjelpa-aktivitetshus/" },
                    { 336, "Kjonerudvegen 9, 2312 Ottestad (2. etasje Amtmannsbygget)", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "ST-frivilligsentralen@stange.kommune.no", false, false, false, new DateOnly(2026, 10, 27), 5, "Ottestad frivilligsentral", null, "940 93 665", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.stange.kommune.no/kultur-og-frivillighet/frivillighet/ottestad-frivilligsentral/" },
                    { 337, "Statsminister Otto Blehrs 2, 2312 Ottestad", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, new DateOnly(2026, 10, 27), 5, "Ungdomshuset i Ottestad", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.stange.kommune.no/kultur-og-frivillighet/aktiviteter-for-ungdom/" },
                    { 338, "Skolegata 13, 2335 Stange", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, new DateOnly(2026, 10, 27), 5, "Stange musikkverksted", null, null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.stange.kommune.no/kultur-og-frivillighet/aktiviteter-for-ungdom/" },
                    { 339, "Stasjonsvegen 23, Bøndernes Hus, 2340 Løten", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@loten.frivilligsentral.no", false, false, false, new DateOnly(2026, 10, 27), 6, "Løten Frivilligsentral", null, "481 41 769", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://loten.frivilligsentral.no/" },
                    { 340, "Venslivegen 13, 2340 Løten", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@loten.kommune.no", false, false, false, new DateOnly(2026, 10, 27), 6, "Ungdommens hus", null, "62 56 40 00", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.loten.kommune.no/helse-sosial-og-familie/barn-unge-og-familie/ungdom/ungdommens-hus/" },
                    { 341, "Løtenhallen", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@loten.kommune.no", false, false, false, new DateOnly(2026, 10, 27), 6, "Felles aktivitet i Løtenhallen", null, "62 56 40 00", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rustjenesten/aktiviteter-og-kurs/felles-aktivitet-i-lotenhallen/" },
                    { 342, "Skolevegen 6, 2340 Løten", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@loten.kommune.no", false, false, false, new DateOnly(2026, 10, 27), 6, "BUA Løten", null, "990 80 167", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.loten.kommune.no/kultur-og-aktivitet/fritidstilbud/bua-loten/" },
                    { 343, "Lærerskolealleen 1, 2408 Elverum", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@elverumfrivilligsentral.no", false, false, false, new DateOnly(2026, 10, 27), 7, "Elverum frivilligsentral", null, "62 43 64 55", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://elverum.frivilligsentral.no/" },
                    { 344, "Lærerskolealléen 1, 2408 Elverum", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "post@moteplassen.elverum.no", false, false, false, new DateOnly(2026, 10, 27), 7, "Møteplassen Elverum", null, "911 84 893", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://moteplassen.elverum.no/" },
                    { 345, "Lærerskolealléen 1, 2408 Elverum", null, null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, true, false, new DateOnly(2026, 10, 27), 7, "Treffpunktet (Møteplassen Elverum)", null, "942 02 575", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://moteplassen.elverum.no/index.php/treffpunkt" },
                    { 346, "St. Olavsgate 6, 2414 Elverum", null, 1, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, false, new DateOnly(2026, 10, 27), 7, "Ungdommens hus", null, "489 57 545", null, new DateTime(2026, 10, 27, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.elverum.kommune.no/vare-tjenester/barn-og-familie/ungdommens-hus/" }
                });

            migrationBuilder.InsertData(
                table: "ResourceCategories",
                columns: new[] { "CategoryId", "ResourceId" },
                values: new object[,]
                {
                    { 3, 301 },
                    { 10, 301 },
                    { 10, 302 },
                    { 10, 303 },
                    { 4, 304 },
                    { 10, 304 },
                    { 4, 305 },
                    { 10, 305 },
                    { 6, 306 },
                    { 10, 306 },
                    { 10, 307 },
                    { 10, 308 },
                    { 10, 309 },
                    { 6, 310 },
                    { 10, 310 },
                    { 10, 311 },
                    { 10, 312 },
                    { 10, 313 },
                    { 10, 314 },
                    { 3, 315 },
                    { 10, 315 },
                    { 4, 316 },
                    { 10, 316 },
                    { 10, 317 },
                    { 10, 318 },
                    { 4, 320 },
                    { 10, 320 },
                    { 3, 321 },
                    { 10, 321 },
                    { 10, 322 },
                    { 10, 323 },
                    { 10, 324 },
                    { 10, 326 },
                    { 10, 327 },
                    { 10, 328 },
                    { 3, 329 },
                    { 4, 329 },
                    { 10, 329 },
                    { 3, 330 },
                    { 10, 330 },
                    { 10, 331 },
                    { 10, 332 },
                    { 10, 333 },
                    { 10, 334 },
                    { 10, 335 },
                    { 10, 336 },
                    { 10, 337 },
                    { 10, 338 },
                    { 10, 339 },
                    { 10, 340 },
                    { 3, 341 },
                    { 10, 341 },
                    { 10, 342 },
                    { 10, 343 },
                    { 10, 344 },
                    { 3, 345 },
                    { 10, 345 },
                    { 10, 346 }
                });

            migrationBuilder.InsertData(
                table: "ResourceMunicipalities",
                columns: new[] { "MunicipalityId", "ResourceId" },
                values: new object[,]
                {
                    { 5, 304 },
                    { 1, 321 },
                    { 2, 321 },
                    { 4, 321 },
                    { 5, 321 },
                    { 6, 321 },
                    { 7, 321 }
                });

            migrationBuilder.InsertData(
                table: "ResourceTranslations",
                columns: new[] { "Id", "CostNote", "Description", "LanguageCode", "OpeningHours", "ResourceId" },
                values: new object[,]
                {
                    { 189, null, "Brukerstyrt senter i Hamar med kafé, kreative og musikalske verksteder, friluftsliv og arbeidstrening. Alle aktiviteter er rusfrie, og du kan ta kontakt selv.", "nb", "Mandag til fredag, 08:00–15:30 (kontor). Mandag til torsdag, 11:30–13:00 (kafé).", 301 },
                    { 190, null, "A user-run centre in Hamar with a café, creative and music workshops, outdoor activities and work training. All activities are drug-free, and you can get in touch yourself.", "en", "Monday to Friday, 08:00–15:30 (office). Monday to Thursday, 11:30–13:00 (café).", 301 },
                    { 191, null, "Møteplass i Hamar sentrum som kobler folk i nærmiljøet, med grupper, kafeer og tjenester. Her holder blant annet Skeiv kafé ungdom (onsdager 18:00-21:00) til, for 13 til 19 år.", "nb", "Man-tor kl 10.00-15.00; Fre kl 10.00-13.00", 302 },
                    { 192, null, "A meeting place in central Hamar that connects people locally, with groups, cafés and services. Skeiv kafé for young people (Wednesdays 18:00-21:00) is held here, for ages 13 to 19.", "en", "Monday to Thursday 10:00-15:00; Friday 10:00-13:00", 302 },
                    { 193, null, "Ungdomshus på Torghjørnet for ungdom på ungdomsskolen og videregående. Du kan komme innom for å møte trygge voksne, delta på aktiviteter eller bare være sammen med andre, og tilbudet er rusfritt.", "nb", "Mandag og onsdag klokka 14:30-21:30. Fredag klokka 14:30-22:00. Lørdag klokka 16:00-22:00.", 303 },
                    { 194, null, "A youth house at Torghjørnet for pupils at lower and upper secondary school. You can drop in to meet safe adults, join activities or just spend time with others, and it is drug-free.", "en", "Monday and Wednesday 14:30-21:30. Friday 14:30-22:00. Saturday 16:00-22:00.", 303 },
                    { 195, null, "Tilbud i Hamar sentrum for aktive rusmiddelavhengige over 18 år fra Hamar og Stange. Du kan få mat, sprøytebytte, sårstell og prevensjon, og juridisk hjelp.", "nb", "Tirsdag og torsdag: kl. 10-14.30. Onsdag: stengt. Mandag og fredag: kl. 9-15 (brukerutstyr).", 304 },
                    { 196, null, "A service in central Hamar for active drug users over 18 from Hamar and Stange. You can get food, syringe exchange, wound care and contraception, and legal help.", "en", "Tuesday and Thursday: 10:00-14:30. Wednesday: closed. Monday and Friday: 9:00-15:00 (user equipment).", 304 },
                    { 197, null, "Kontaktsenter i Torggata for mennesker som sliter med rus. Det deles ut mat hver onsdag, det serveres middag i kontaktkafeen, og du kan få samtale med sosionom.", "nb", "hver onsdag kl. 12:00 – 16:00", 305 },
                    { 198, null, "A contact centre in Torggata for people struggling with drug use. Food is handed out every Wednesday, dinner is served in the contact café, and you can talk to a social worker.", "en", "every Wednesday 12:00-16:00", 305 },
                    { 199, "Gratis lavterskeltilbud", "Møtested for familier med barn mellom 0 og 16 år og gravide, med lek, felles kjøkken, aktiviteter og samtaler. Du kan ta kontakt selv uten henvisning.", "nb", "Mandag til fredag: 08.00 til 16.00", 306 },
                    { 200, "Free low-threshold service", "A meeting place for families with children aged 0 to 16 and pregnant women, with play rooms, a shared kitchen, activities and conversations. You can get in touch yourself without a referral.", "en", "Monday to Friday: 08:00 to 16:00", 306 },
                    { 201, null, "Nytt støttesenter for pårørende og etterlatte til mennesker med uhelbredelig sykdom, åpnet 28. september 2026. Det skal være en åpen møteplass i Høyensalgata 74.", "nb", null, 307 },
                    { 202, null, "A new support centre for relatives and bereaved of people with an incurable illness, opened on 28 September 2026. It is meant to be an open meeting place at Høyensalgata 74.", "en", null, 307 },
                    { 203, null, "Lokalforening med faste ukentlige tilbud som Onsdagsgjengen for voksne mot sosial isolasjon, leksehjelp og Barnas Røde Kors for barn i 1. til 7. trinn, og besøkstjeneste.", "nb", null, 308 },
                    { 204, null, "A local association with weekly offers such as Onsdagsgjengen for adults against social isolation, homework help and Barnas Røde Kors for children in grades 1 to 7, and a visiting service.", "en", null, 308 },
                    { 205, "helt gratis", "Gratis utlån av sports- og friluftsutstyr for sommer og vinter, åpent for alle. Utlånet er på Torghjørnet ved Stortorget.", "nb", "Man., tors. og fred.: kl. 13.00-18.00.", 309 },
                    { 206, "completely free", "Free lending of sports and outdoor equipment for summer and winter, open to everyone. The lending point is at Torghjørnet by Stortorget.", "en", "Monday, Thursday and Friday: 13:00-18:00.", 309 },
                    { 207, "Pris kr 10 pr barn pr dag, ha med mat og drikke selv, kaffe / te kan kjøpes.", "Åpen barnehage for barn under skolealder sammen med en voksen, med fast sangstund og frilek i Frivilligsentralens lokaler. Ta med mat og drikke selv.", "nb", "Onsdager og torsdager kl. 10:00-14:00", 310 },
                    { 208, "Price kr 10 per child per day, bring your own food and drink, coffee / tea can be bought.", "An open kindergarten for children under school age together with an adult, with a set song time and free play at the volunteer centre's premises. Bring your own food and drink.", "en", "Wednesdays and Thursdays 10:00-14:00", 310 },
                    { 209, null, "Ungdomsklubb for 13 til 18 år på iskroa i CC amfi/hockeyhallen, med biljard, bordtennis, airhockey, matlaging, gaming og diskotek.", "nb", "Mandag og onsdag klokka 17.30-21.00, fredag klokka 18.00-23.00.", 311 },
                    { 210, null, "A youth club for ages 13 to 18 at iskroa in CC amfi/the hockey hall, with pool, table tennis, air hockey, cooking, gaming and discos.", "en", "Monday and Wednesday 17:30-21:00, Friday 18:00-23:00.", 311 },
                    { 211, "Medlemskap kr 120,- pr skoleår.", "Ungdomsklubb for 13 til 18 år i Øvre Vang samfunnshus, med biljard, bordtennis, kortspill, dansematte, TV-spill og diskotek.", "nb", "Åpen mandag, tirsdag og torsdag klokka 18.00 - 22.00.", 312 },
                    { 212, "Membership kr 120,- per school year.", "A youth club for ages 13 to 18 at Øvre Vang samfunnshus, with pool, table tennis, card games, a dance mat, video games and discos.", "en", "Open Monday, Tuesday and Thursday 18:00 - 22:00.", 312 },
                    { 213, "Spillkveldene våre på onsdager er helt gratis å delta på.", "Spillforening i Hamar for brettspill, rollespill, kortspill og miniatyrspill. Hver onsdag er det sosial brettspilling i Foajeen på Hamar Kulturhus, og alle er velkomne, også nybegynnere.", "nb", "hver onsdag kl 16:00", 313 },
                    { 214, "Our game nights on Wednesdays are completely free to join.", "A gaming club in Hamar for board games, role-playing, card games and miniature games. Every Wednesday there is social board gaming in the foyer at Hamar Kulturhus, and everyone is welcome, beginners too.", "en", "every Wednesday at 16:00", 313 },
                    { 215, "Gratis tilbud.", "Gratis ukentlig gå-, jogge- eller løpetilbud i Ankerskogen. Barn under 11 år kan løpe sammen med en voksen.", "nb", "Hver lørdag kl 09.30", 314 },
                    { 216, "Free of charge.", "A free weekly walk, jog or run in Ankerskogen. Children under 11 can run together with an adult.", "en", "Every Saturday at 09:30", 314 },
                    { 217, "Tilbudet er gratis, og du trenger ikke melde deg på.", "Kommunalt møtested i Storgata 9B for deg over 18 år som har erfaring med psykiske helseutfordringer og vil være med i et fellesskap med aktivitet og struktur. Du kan komme som du er, uten påmelding.", "nb", "Mandag og fredag: klokken 09.30 til 15.00; Onsdager: klokken 09:30 - 15:00 denne dagen er det tur fra 11.30 - 15.00", 315 },
                    { 218, "The service is free, and you do not need to sign up.", "A municipal meeting place at Storgata 9B for people over 18 who have experience with mental health challenges and want to take part in a community with activity and structure. You can come as you are, without signing up.", "en", "Monday and Friday: 09:30 to 15:00; Wednesday: 09:30 - 15:00, on this day there is a trip from 11:30 - 15:00", 315 },
                    { 219, "Tilbudet er gratis", "Drop-in-tilbud i Gamlevegen 101 for deg som har rusutfordringer eller er pårørende. Du kan komme innom for lunsj og en prat, få veiledning og hjelp med praktiske ting, og hente brukerutstyr. Det kreves ikke rusfrihet.", "nb", "Mandager og torsdager fra 11.00 til 13.00 hele året", 316 },
                    { 220, "The service is free", "A drop-in service at Gamlevegen 101 for people with substance use challenges and their relatives. You can come by for lunch and a chat, get guidance and help with practical things, and collect user equipment. You do not need to be drug-free.", "en", "Mondays and Thursdays from 11:00 to 13:00 all year", 316 },
                    { 221, "Alle våre aktiviteter er gratis og krever ingen påmelding. Vi tar 5 kroner for A4, 10 kr for A3, laminering/fotopapir 15 kroner.", "Møteplass i Lillehammer sentrum der du kan komme innom for kaffe og prat, kortspill, håndarbeid, språkkafé og andre fellesskap. Frivillige kan også hjelpe med besøksvenn, følge til lege, data og mobil, og skjemaer og brev fra det offentlige.", "nb", "Vår kjernetid er fra mandag til torsdag 10.00 til 14.00. Fredag fra 10.00 til 13.00.", 317 },
                    { 222, "All our activities are free and need no sign-up. We charge 5 kroner for A4, 10 kr for A3, 15 kroner for laminating/photo paper.", "A meeting place in central Lillehammer where you can drop in for coffee and a chat, card games, handicrafts, a language café and other social groups. Volunteers can also help with a visiting friend, accompaniment to the doctor, computers and phones, and forms and letters from public bodies.", "en", "Our core hours are Monday to Thursday 10:00 to 14:00. Friday from 10:00 to 13:00.", 317 },
                    { 223, null, "Lokalforeningen har faste møteplasser: Onsdagstreffen for seniorer med trim, kaffe og vafler, Barnas Røde Kors for barn i 1. til 7. klasse, og Norsktrening for deg som vil øve norsk. Besøksvenn-tilbudet er for deg som kjenner deg ensom.", "nb", "Onsdagstreffen: Onsdager (kl.10:30 for trim) kl.11:00-13:00; Barnas Røde Kors: Onsdager 18:00-19:30; Norsktrening: Tirsdager 17:00-19:00", 318 },
                    { 224, null, "The local branch runs regular meeting places: Onsdagstreffen for seniors with light exercise, coffee and waffles, Barnas Røde Kors for children in grades 1 to 7, and Norsktrening for people who want to practise Norwegian. The Besøksvenn visiting service is for people who feel lonely.", "en", "Onsdagstreffen: Wednesdays (10:30 for exercise) 11:00-13:00; Barnas Røde Kors: Wednesdays 18:00-19:30; Norsktrening: Tuesdays 17:00-19:00", 318 },
                    { 225, null, "Kafé og møtested i Gjøvik sentrum for rusavhengige og bostedsløse, med frokost, middag, kaffe og gratis aktiviteter som brettspill, quiz og kino. Du kan også snakke med en sosionom om livssituasjonen din.", "nb", "Mandag til fredag 12.00 – 15.00", 320 },
                    { 226, null, "A café and meeting place in central Gjøvik for people with substance dependence and people without housing, with breakfast, dinner, coffee and free activities such as board games, quiz and cinema. You can also talk to a social worker about your situation.", "en", "Monday to Friday 12.00 – 15.00", 320 },
                    { 227, "Å være medlem på Fontenehuset koster ingenting.", "Arbeidsfellesskap for deg som er 16 år eller eldre og har eller har hatt en psykisk helseutfordring. Du blir medlem gratis, uten henvisning, og kan bruke huset til arbeid, studier og sosialt fellesskap.", "nb", "Mandag – fredag kl 08:00-15:30", 321 },
                    { 228, "Being a member of Fontenehuset costs nothing.", "A work community for people aged 16 or older who have or have had a mental health challenge. Membership is free and needs no referral, and you can use the house for work, studies and social community.", "en", "Monday – Friday 08:00-15:30", 321 },
                    { 229, null, "Frivilligsentralen i Gjøvik sentrum er en møteplass som formidler kontakt mellom folk i lokalmiljøet. Faste tilbud er blant annet Globus kafé (mandag, tirsdag, onsdag og fredag kl. 11.00-15.00 og torsdager kl. 11.00-13.00), Kaffetreff på Sørbyen omsorgssenter (torsdager kl. 11.00-13.00, kaffe og vaffel 30 kr, ingen påmelding), Strikkekafé (mandager på like uker kl. 11:00-14:00, servering 20 kr), Turgruppa (tirsdager fra kl. 11.00), Kom og spis (onsdager, 120 kr, krever påmelding) og gratis advokathjelp annenhver onsdag kl. 18.00-20.00.", "nb", null, 322 },
                    { 230, null, "The volunteer centre in central Gjøvik is a meeting place that connects people in the local community. Regular offers include Globus café (Monday, Tuesday, Wednesday and Friday 11.00-15.00 and Thursdays 11.00-13.00), a coffee meeting at Sørbyen care centre (Thursdays 11.00-13.00, coffee and waffle 30 kr, no sign-up), a knitting café (Mondays in even weeks 11:00-14:00, refreshments 20 kr), a walking group (Tuesdays from 11.00), Kom og spis (Wednesdays, 120 kr, sign-up required) and free legal advice every other Wednesday 18.00-20.00.", "en", null, 322 },
                    { 231, null, "Avdeling Øverby av frivilligsentralen driver Øverbykafeen og Torsdagstreff i Øverbyvegen 95, drevet av frivillige. Du kan komme innom i åpningstiden.", "nb", "Mandager: 11.00-13.30 Torsdager: 10.00-13.00 Søndager: 11.00-14.00", 323 },
                    { 232, null, "The Øverby branch of the volunteer centre runs the Øverby café and a Thursday meeting at Øverbyvegen 95, run by volunteers. You can drop in during opening hours.", "en", "Mondays: 11.00-13.30 Thursdays: 10.00-13.00 Sundays: 11.00-14.00", 323 },
                    { 233, null, "Værested og kafé for alle, særlig for deg som er ensom, innvandrer eller har en åndelig lengsel. Det er blant annet kreativ kafé og baby- og småbarnskafé på torsdager, kulturkafé annenhver torsdag og FredagsPULS annenhver fredag. På samme adresse holder Frelsesarmeen også Åpent Hus Velferd annenhver mandag kl. 10-12, et treffpunkt uten krav og forventninger for folk bosatt i Gjøvik, Vestre Toten og Østre Toten. Der kan du bli med på dagsturer, sang og musikk og kurs i selvhjelp, få hjelp med jobbsøknader og bruke PC, og det finnes en gratis samtale- og veiledningstjeneste.", "nb", "Onsdag og fredag kl. 11.00-15.00. Torsdag kl. 11.00-18.00 de torsdagene det er Kulturkafé. Ellers til kl. 15.00.", 324 },
                    { 234, null, "A drop-in place and café open to everyone, especially people who are lonely, immigrants or have a spiritual longing. It has a creative café and a baby and toddler café on Thursdays, a culture café every other Thursday and FredagsPULS every other Friday. At the same address Frelsesarmeen also runs Åpent Hus Velferd every other Monday 10-12, a meeting point without demands or expectations for people living in Gjøvik, Vestre Toten and Østre Toten. You can join day trips, singing and music and self-help courses, get help with job applications and use a PC, and there is a free conversation and guidance service.", "en", "Wednesday and Friday 11.00-15.00. Thursday 11.00-18.00 on the Thursdays with a culture café, otherwise until 15.00.", 324 },
                    { 235, null, "Ungdommens hus er et samlingspunkt for ungdom i Gjøvik med møteplasser, aktiviteter, turer og arrangementer, alltid med en trygg voksen til stede. Huset er åpent for deg som går på ungdomsskolen eller videregående.", "nb", "Mandag Stengt, Tirsdag 14:00-18:00, Onsdag 14:00-18:00, Torsdag 14:00-21:00, Fredag Stengt, Lørdag-søndag Stengt", 326 },
                    { 236, null, "The youth house is a gathering place for young people in Gjøvik with meeting places, activities, trips and events, always with a trusted adult present. It is open to pupils at lower and upper secondary school.", "en", "Monday closed, Tuesday 14:00-18:00, Wednesday 14:00-18:00, Thursday 14:00-21:00, Friday closed, Saturday-Sunday closed", 326 },
                    { 237, null, "Kafé, catering og utleie i Sørbyen, drevet av frivillige og folk på arbeidstrening. Hver onsdag er det langåpent med familievennlig middag og kulturelle opplevelser på kvelden.", "nb", "Onsdag: 11:00 - 18:00 Kjøkkenet stenger kl. 17:30 Torsdag: 11:00 - 16:00 Kjøkkenet stenger kl. 15:30 Fredag: 11:00 - 16:00 Kjøkkenet stenger kl. 15:30", 327 },
                    { 238, null, "A café, catering and venue hire in Sørbyen, run by volunteers and people in work training. Every Wednesday it stays open late with a family-friendly dinner and cultural events in the evening.", "en", "Wednesday: 11:00 - 18:00 the kitchen closes at 17:30 Thursday: 11:00 - 16:00 the kitchen closes at 15:30 Friday: 11:00 - 16:00 the kitchen closes at 15:30", 327 },
                    { 239, null, "Ukentlig møte der du kan øve på norsk i trygge og uformelle rammer sammen med frivillige fra lokalmiljøet, som et tillegg til norskundervisningen. Du trenger ikke melde deg på, det er bare å møte opp.", "nb", "hver tirsdag etter skoletid mellom 14.30 og 16.30", 328 },
                    { 240, null, "A weekly meeting where you can practise Norwegian in safe, informal settings with volunteers from the local community, as a supplement to formal Norwegian classes. You do not need to sign up, you just turn up.", "en", "every Tuesday after school between 14.30 and 16.30", 328 },
                    { 241, "Solsia aktivitetshus er gratis tilbud for deg over 18 år", "Aktivitetshus i Brumunddal for deg over 18 år som har utfordringer med psykisk helse og/eller rus og vil ha et sted å møte andre. Du velger selv hvilke aktiviteter du vil delta på, blant annet friluftsgruppe, trening og fredagsgruppe for unge voksne. Mandag og onsdag er åpent for alle, og torsdag er for deg med rusutfordringer. Én tirsdagskveld i måneden er det kveldsåpent for deg med rusutfordringer.", "nb", "Tidspunkt: 10:00-14:00 (unntatt tirsdag 17:00-19:00)", 329 },
                    { 242, "Solsia activity house is a free offer for you over 18 years old", "An activity house in Brumunddal for people over 18 who face mental health and/or substance use challenges and want a place to meet others. You choose which activities to join, including an outdoor group, exercise and a Friday group for young adults. Monday and Wednesday are open to everyone, and Thursday is for people with substance use challenges. One Tuesday evening a month is open to people with substance use challenges.", "en", "Time: 10:00-14:00 (except Tuesday 17:00-19:00)", 329 },
                    { 243, null, "Den lokale foreningen Mental Helse har en fast, åpen møteplass i lokalene til Brumunddal frivilligsentral hver tirsdag. Du kan komme for å treffe andre, spise lunsj og ta en kaffe.", "nb", "Tirsdag kl. 10.00 – 14.00", 330 },
                    { 244, null, "The local Mental Helse association runs a regular open meeting place every Tuesday in the premises of Brumunddal volunteer centre. You can come to meet others, have lunch and a coffee.", "en", "Tuesday 10.00 – 14.00", 330 },
                    { 245, "Alle gruppearrangement er åpne for alle og gratis å delta på.", "Frivilligsentral i Brumunddal som skal være en møteplass på tvers av generasjoner. Gruppene er åpne for alle, blant annet en turgruppe på onsdager og strikkekafé annenhver torsdag.", "nb", null, 331 },
                    { 246, "All group events are open to everyone and free to take part in.", "A volunteer centre in Brumunddal meant to be a meeting place across generations. The groups are open to everyone, including a walking group on Wednesdays and a knitting café every other Thursday.", "en", null, 331 },
                    { 247, null, "Frivilligsentral i Moelv med faste møter som Tirsdagskafé hver tirsdag kl. 11.00 – 13.00 og Strikkekafé og Hobbytreff hver torsdag kl. 11.00 - 13.00. Alle er velkommen, og kaffe, vafler og rundstykker selges i kafeen.", "nb", "Mandag til fredag er vår kjernetiden kl. 10.00 - 14.00.", 332 },
                    { 248, null, "A volunteer centre in Moelv with regular meetings such as the Tuesday café every Tuesday 11.00 – 13.00 and a knitting café and hobby meeting every Thursday 11.00 - 13.00. Everyone is welcome, and coffee, waffles and rolls are sold at the café.", "en", "Monday to Friday is our core time, 10.00 - 14.00.", 332 },
                    { 249, null, "Åpen møteplass i Moelv der du kan øve muntlig norsk og bli kjent med andre, uansett hvor mye norsk du kan fra før. Du trenger ikke melde deg på, du møter bare opp på Kilde Skole.", "nb", "Tirsdager fra kl. 18:00 – 20:00", 333 },
                    { 250, null, "An open meeting place in Moelv where you can practise spoken Norwegian and get to know others, whatever your level of Norwegian. You do not need to sign up, you just turn up at Kilde Skole.", "en", "Tuesdays from 18:00 – 20:00", 333 },
                    { 251, "Trimmen er gratis og åpen for alle.", "Ukentlig treningstime på Buttekvern Aktivitetssenter i Brumunddal som skal få opp pulsen og få kroppen i bevegelse. Trimmen er gratis og åpen for alle.", "nb", "Ukentlig kl. 11.00–13.00", 334 },
                    { 252, "The exercise session is free and open to everyone.", "A weekly exercise hour at Buttekvern activity centre in Brumunddal to raise your pulse and get your body moving. The session is free and open to everyone.", "en", "Weekly 11.00–13.00", 334 },
                    { 253, null, "Aktivitetshuset i Stange er et sted for mennesker med ulike livsutfordringer, med sosialt samvær, lunsj, kreative aktiviteter, kurs, hyggekvelder, sykkelverksted og bruktbutikken Loppa. Du kan ta direkte kontakt selv, og det finnes gratis transport for deg som trenger det.", "nb", "Allaktivitetshuset: mandag-fredag 09.00-15.00, Kjernetid (10.00-14.00). Loppa: mandag, onsdag, fredag 10.00-14.00. Sykkelverkstedet: mandag, onsdag, torsdag 10.00-14.00", 335 },
                    { 254, null, "The activity house in Stange is a place for people with different life challenges, with social time, lunch, creative activities, courses, evening get-togethers, a bike workshop and the second-hand shop Loppa. You can contact them yourself, and free transport is available if you need it.", "en", "Activity house: Monday to Friday 09.00-15.00, core hours 10.00-14.00. The second-hand shop Loppa: Monday, Wednesday, Friday 10.00-14.00. The bike workshop: Monday, Wednesday, Thursday 10.00-14.00", 335 },
                    { 255, null, "Frivilligsentralen i Ottestad er en åpen møteplass i Fløibygningen på Kjonerudtunet, drevet av kommunen. Den arrangerer aktiviteter og sammenkomster gjennom året, noen for bestemte grupper og andre for alle, og tar imot dem som vil bidra som frivillige.", "nb", "Mandag - torsdag kl. 10:00-14:00", 336 },
                    { 256, null, "The volunteer centre in Ottestad is an open meeting place in the Fløi building at Kjonerudtunet, run by the kommune. It holds activities and gatherings through the year, some for set groups and others for everyone, and welcomes people who want to volunteer.", "en", "Monday to Thursday 10:00-14:00", 336 },
                    { 257, null, "Ungdomshuset i Ottestad er et kommunalt tilbud om aktivitet og sosialt samvær for ungdom mellom 13 og 18 år. Der finnes biljard, bordtennis og et musikkverksted, og ungdommene kan være med på å påvirke aktivitetene.", "nb", "Mandag 15.00-21.00, Torsdag 15.00-21.00", 337 },
                    { 258, null, "The youth house in Ottestad is a municipal offer of activities and social time for young people aged 13 to 18. It has a pool table, table tennis and a music workshop, and the young people can help shape the activities.", "en", "Monday 15.00-21.00, Thursday 15.00-21.00", 337 },
                    { 259, null, "Musikkverkstedet i Stange er et tilbud for unge som holder på med musikk, med fullt utstyrt øvingslokale, studio for innspilling og veiledning. Det vil også være en møteplass for unge musikere.", "nb", "Mandag 14.00-21.00, Tirsdag 14.00-21.00, Onsdag 17.00-20.00", 338 },
                    { 260, null, "The music workshop in Stange is an offer for young people who play music, with a fully equipped rehearsal room, a recording studio and guidance. It also aims to be a meeting place for young musicians.", "en", "Monday 14.00-21.00, Tuesday 14.00-21.00, Wednesday 17.00-20.00", 338 },
                    { 261, null, "Frivilligsentralen er en sosial møteplass i Løten med faste tilbud som allværskafé på mandager, gågruppe på tirsdager, eldretreff på onsdager og nett-treff på fredager. Du kan også få en frivillig som følger deg til timer, eller selv melde deg som frivillig.", "nb", "mandag til fredag kl.10.00 – kl.14.00", 339 },
                    { 262, null, "The volunteer centre is a social meeting place in Løten with regular offers such as a café on Mondays, a walking group on Tuesdays, a meeting for older people on Wednesdays and a mobile and computer help hour on Fridays. You can also get a volunteer to accompany you to appointments, or sign up as a volunteer yourself.", "en", "Monday to Friday 10.00 – 14.00", 339 },
                    { 263, null, "Ungdomsklubb i Løten for barn og unge fra 5. klasse til 18 år, delt i juniorklubb og ungdomsklubb. Der kan du spille bordtennis, biljard og spill, høre på musikk og være ute ved bålpanner og diskgolfmål, med voksne til stede.", "nb", "Det er åpent mandag, tirsdag og torsdag.", 340 },
                    { 264, null, "A youth club in Løten for children and young people from 5th grade up to age 18, split into a junior club and a youth club. You can play table tennis, billiards and games, listen to music and be outdoors at the fire pits and disc golf target, with adults present.", "en", "Open Monday, Tuesday and Thursday.", 340 },
                    { 265, null, "Fysisk aktivitet i Løtenhallen med lekbetonte aktiviteter som lagleker, stafetter og lett styrketrening, drevet av psykisk helse- og rustjenesten. Aktivitetene tilpasses slik at alle kan delta.", "nb", "Hver onsdag er det tilbud om fysisk aktivitet i Løtenhallen fra kl. 14.00-15.00.", 341 },
                    { 266, null, "Physical activity in Løtenhallen with playful activities such as team games, relay races and light strength training, run by the mental health and substance use service. The activities are adapted so that everyone can take part.", "en", "Every Wednesday there is physical activity in Løtenhallen from 14.00-15.00.", 341 },
                    { 267, "helt gratis!", "Utlån av sports- og friluftsutstyr i Løten, som sykler, kajakker og telt om våren og sommeren og ski, skøyter og alpinutstyr om høsten og vinteren. Du må registrere en profil først.", "nb", null, 342 },
                    { 268, "completely free!", "Lending of sports and outdoor equipment in Løten, such as bikes, kayaks and tents in spring and summer and skis, skates and alpine gear in autumn and winter. You have to register a profile first.", "en", null, 342 },
                    { 269, null, "Frivilligsentral med åpen frivilligkafé alle hverdager og grupper som hobbyklubb, trimgruppe og språkkafé. Du kan komme innom for en kaffe, en prat eller for å delta i aktivitetene.", "nb", "Frivilligkaféen: Åpningstiden er mellom kl 10:00 og 14:00", 343 },
                    { 270, null, "A volunteer centre with an open café every weekday and groups such as the hobby club, exercise group and language café. You can drop in for a coffee, a chat or to join the activities.", "en", "The volunteer café: opening hours are between 10:00 and 14:00", 343 },
                    { 271, null, "Åpent møtested for småbarn, seniorer og alle som er midt imellom, med kafé på hverdager, hobbygrupper, boccia, sangkafé, kurs og turer. Stedet drives av en frivillig organisasjon og holder til i kommunehuset Folkvang.", "nb", "Mandag-fredag 09:00-15:00. Kafé: mandag - fredag 09:00-15:00, torsdag til 15:30.", 344 },
                    { 272, null, "An open meeting place for toddlers, seniors and everyone in between, with a café on weekdays, hobby groups, boccia, a singing café, courses and outings. It is run by a voluntary organisation and is based in the Folkvang municipal building.", "en", "Monday to Friday 09:00-15:00. Café: Monday to Friday 09:00-15:00, Thursday until 15:30.", 344 },
                    { 273, null, "Dagtilbud for deg som har eller har hatt psykiske utfordringer og trenger hjelp til å komme i aktivitet og gjenoppta et sosialt liv. Det er et sosialt fellesskap, ikke behandling, og det anbefales å ringe først.", "nb", "Mandag, onsdag, torsdag og fredag kl. 10:00 - 14:00", 345 },
                    { 274, null, "A day offer for people who have or have had psychological challenges and need help to get into activity and take up a social life again. It is a social community, not treatment, and the page recommends calling first.", "en", "Monday, Wednesday, Thursday and Friday 10:00 - 14:00", 345 },
                    { 275, "Her kan du være med på en hel haug med aktiviteter, og det er gratis.", "Gratis ungdomsklubb i sentrum for ungdom mellom 10 og 18 år, med blant annet spill, brettspill, musikk, dans, leksehjelp og skating. Tirsdag er det juniorklubb for 5. til 7. trinn.", "nb", "Mandag kl. 14.00 - 20.45; Tirsdag kl. 14.00 - 20.00 (Juniorklubben 5. - 7. trinn); Onsdag kl. 14.00 - 20.45; Torsdag kl. 14.00 - 20.45; Fredag kl. 14.00 - 20.45", 346 },
                    { 276, "You can join a whole bunch of activities here, and it is free.", "A free youth club in the town centre for young people aged 10 to 18, with gaming, board games, music, dance, homework help and skating. On Tuesdays there is a junior club for grades 5 to 7.", "en", "Monday 14.00 - 20.45; Tuesday 14.00 - 20.00 (junior club for grades 5 - 7); Wednesday 14.00 - 20.45; Thursday 14.00 - 20.45; Friday 14.00 - 20.45", 346 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 301 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 301 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 302 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 303 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 304 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 304 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 305 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 305 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 306 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 306 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 307 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 308 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 309 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 310 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 310 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 311 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 312 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 313 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 314 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 315 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 315 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 316 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 316 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 317 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 318 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 320 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 320 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 321 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 321 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 322 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 323 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 324 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 326 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 327 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 328 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 329 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 329 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 329 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 330 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 330 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 331 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 332 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 333 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 334 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 335 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 336 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 337 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 338 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 339 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 340 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 341 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 341 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 342 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 343 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 344 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 345 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 345 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 346 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 5, 304 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 1, 321 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 2, 321 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 4, 321 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 5, 321 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 6, 321 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 7, 321 });

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 189);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 190);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 191);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 192);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 193);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 194);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 195);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 196);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 197);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 198);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 199);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 200);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 201);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 202);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 203);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 204);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 205);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 206);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 207);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 208);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 209);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 210);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 211);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 212);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 213);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 214);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 215);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 216);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 217);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 218);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 219);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 220);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 221);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 222);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 223);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 224);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 225);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 226);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 227);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 228);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 229);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 230);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 231);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 232);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 233);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 234);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 235);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 236);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 237);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 238);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 239);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 240);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 241);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 242);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 243);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 244);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 245);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 246);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 247);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 248);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 249);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 250);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 251);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 252);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 253);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 254);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 255);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 256);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 257);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 258);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 259);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 260);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 261);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 262);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 263);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 264);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 265);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 266);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 267);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 268);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 269);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 270);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 271);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 272);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 273);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 274);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 275);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 276);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 301);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 302);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 303);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 304);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 305);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 306);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 307);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 308);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 309);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 310);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 311);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 312);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 313);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 314);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 315);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 316);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 317);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 318);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 320);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 321);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 322);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 323);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 324);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 326);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 327);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 328);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 329);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 330);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 331);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 332);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 333);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 334);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 335);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 336);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 337);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 338);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 339);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 340);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 341);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 342);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 343);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 344);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 345);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 346);
        }
    }
}

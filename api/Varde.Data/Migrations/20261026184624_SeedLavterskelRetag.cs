using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedLavterskelRetag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Slug" },
                values: new object[] { 10, "lavterskeltilbud" });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 1,
                column: "CostNote",
                value: "116 123 er en gratis og døgnåpen telefontjeneste for alle som trenger noen å snakke med.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 2,
                column: "CostNote",
                value: "116 123 is a free, 24-hour phone service for anyone who needs someone to talk to.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 3,
                column: "CostNote",
                value: "Kirkens SOS tar seg ikke betalt for tjenesten og tjener ingenting på tellerskrittene.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 4,
                column: "CostNote",
                value: "Kirkens SOS does not charge for the service and earns nothing from the call charges.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 5,
                column: "CostNote",
                value: "Når du bruker tjenester fra legevakt må du betale en egenandel hvis du ikke har frikort.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 6,
                column: "CostNote",
                value: "When you use out-of-hours medical services you must pay a co-payment if you do not have an exemption card.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 7,
                column: "CostNote",
                value: "Alarmtelefonen er en gratis tjeneste der du kan henvende deg anonymt.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 8,
                column: "CostNote",
                value: "The Alarm Phone is a free service where you can get in touch anonymously.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 9,
                column: "CostNote",
                value: "Helt gratis og anonymt.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 10,
                column: "CostNote",
                value: "Completely free and anonymous.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 11,
                column: "CostNote",
                value: "Tjenesten er gratis, og du bør søke hjelp så tidlig som mulig.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 12,
                column: "CostNote",
                value: "The service is free, and you should seek help as early as possible.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 13,
                column: "CostNote",
                value: "Jussbuss gir gratis rettshjelp i enkeltsaker, og er drevet av jusstudenter.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 14,
                column: "CostNote",
                value: "Jussbuss gives free legal aid in individual cases, and is run by law students.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 17,
                column: "OpeningHours",
                value: "Mandag, tirsdag, onsdag og fredag 08:30–16:00, torsdag 08:30–18:00");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 18,
                column: "OpeningHours",
                value: "Monday, Tuesday, Wednesday and Friday 08:30–16:00, Thursday 08:30–18:00");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 19,
                column: "CostNote",
                value: "Tilbudet er gratis.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 20,
                column: "CostNote",
                value: "The service is free.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 23,
                column: "CostNote",
                value: "Hamar interkommunale krisesenter er et gratis døgnåpent akuttsenter.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 24,
                column: "CostNote",
                value: "Hamar interkommunale krisesenter is a free 24-hour emergency centre.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 29,
                column: "CostNote",
                value: "Rask psykisk helsehjelp er et gratis og tidsavgrenset tilbud til deg fra 16 år som ønsker hjelp med begynnende og/eller lettere former for angst, depresjon, søvnvansker og alkohol-/rusproblemer.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 30,
                column: "CostNote",
                value: "Rask psykisk helsehjelp (rapid mental health help) is a free, time-limited service for you from age 16 who want help with early and/or milder forms of anxiety, depression, sleep problems and alcohol or drug problems.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 33,
                column: "CostNote",
                value: "Våre tjenester er gratis.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 34,
                column: "CostNote",
                value: "Our services are free.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 35,
                column: "CostNote",
                value: "Våre tjenester er gratis.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 36,
                column: "CostNote",
                value: "Our services are free.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 41,
                column: "CostNote",
                value: "Tilbudet er gratis.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 42,
                column: "CostNote",
                value: "The service is free.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 51,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "Nav-kontoret for innbyggere i Stange, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Veiledningssenteret er åpent for selvbetjening.", "Selvbetjent mottak mandag, tirsdag, torsdag og fredag 09.00-14.30 og onsdag 12.00-14.30; betjent mottak onsdag 09.00-12.00" });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 52,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "The Nav office for people living in Stange, offering help with financial assistance, work, housing and other social services. The guidance centre is open for self-service.", "Self-service reception Monday, Tuesday, Thursday and Friday 09.00-14.30 and Wednesday 12.00-14.30; staffed reception Wednesday 09.00-12.00" });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 53,
                column: "CostNote",
                value: "Det er gratis å motta hjelp hos oss.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 54,
                column: "CostNote",
                value: "It is free to receive help from us.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 55,
                column: "CostNote",
                value: "Kriseteam tilbyr gratis hjelp og støtte etter spesielt vanskelige hendelser.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 56,
                column: "CostNote",
                value: "The crisis team offers free help and support after especially difficult events.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 57,
                column: "OpeningHours",
                value: "Vakttelefon mandag–fredag 08.30–15.00");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 58,
                column: "OpeningHours",
                value: "Duty phone Monday–Friday 08.30–15.00");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 61,
                column: "CostNote",
                value: "Dette er en gratis tjeneste vi tilbyr personer som oppholder seg i Løten kommune, som har behov for det.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 62,
                column: "CostNote",
                value: "This is a free service we offer to people who are staying in Løten kommune and who need it.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 63,
                column: "CostNote",
                value: "Tjenesten er gratis.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 64,
                column: "CostNote",
                value: "The service is free.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 67,
                column: "CostNote",
                value: "Rask psykisk helsehjelp er gratis hjelp for deg over 16 år med milde til moderate psykiske plager.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 68,
                column: "CostNote",
                value: "Rask psykisk helsehjelp is free help for you over 16 years with mild to moderate mental health problems.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 69,
                column: "Description",
                value: "Nav-kontoret for innbyggere i Elverum, med hjelp til arbeid, økonomisk sosialhjelp, bolig og sosiale tjenester. Er du i en krisesituasjon uten penger til mat, medisin eller strøm, skal du ta kontakt med en gang.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 70,
                column: "Description",
                value: "The Nav office for people living in Elverum, offering help with work, financial assistance, housing and social services. If you are in a crisis with no money for food, medicine or electricity, get in touch straight away.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 73,
                column: "CostNote",
                value: "Våre tjenester er gratis.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 74,
                column: "CostNote",
                value: "Our services are free.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 77,
                column: "CostNote",
                value: "Tilbudet er gratis for innbyggerne på grunn av kommunens samarbeidsavtale med senteret, og det er kort ventetid.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 78,
                column: "CostNote",
                value: "The service is free for residents because of the municipality's cooperation agreement with the centre, and the waiting time is short.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 79,
                column: "CostNote",
                value: "Vi er et tverrfaglig, gratis og lavterskel hjelpetilbud og støttesenter for utsatte av seksuelle overgrep og deres pårørende.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 80,
                column: "CostNote",
                value: "We are a multidisciplinary, free and low-threshold help service and support centre for people subjected to sexual abuse and their relatives.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 83,
                column: "OpeningHours",
                value: "Åpningstiden vår er 09:00–15:00 alle hverdager");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 84,
                column: "OpeningHours",
                value: "Open 09:00–15:00 every weekday");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 85,
                column: "CostNote",
                value: "Tilbudet er gratis og du kan være anonym.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 86,
                column: "CostNote",
                value: "The service is free and you can be anonymous.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 87,
                column: "CostNote",
                value: "Ta kontakt med våre gratis og anonyme svartjenester: Hjelpetelefonen, Arbeidslivstelefonen, Sidetmedord.no eller Foreldresupport.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 88,
                column: "CostNote",
                value: "Get in touch with our free and anonymous answer services: Hjelpetelefonen, Arbeidslivstelefonen, Sidetmedord.no or Foreldresupport.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 119,
                column: "CostNote",
                value: "Det koster ingenting å bo på eller få hjelp av krisesenteret.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 120,
                column: "CostNote",
                value: "It costs nothing to stay at or get help from the crisis centre.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 121,
                column: "CostNote",
                value: "Tjenesten vår er helt gratis å bruke, og du kan ta kontakt så mange ganger du vil.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 122,
                column: "CostNote",
                value: "Our service is completely free to use, and you can get in touch as many times as you like.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 123,
                column: "CostNote",
                value: "Mottaket tilbyr gratis medisinsk og psykososial akuttbehandling, krisehjelp og rettsmedisinske undersøkelser.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 124,
                column: "CostNote",
                value: "The reception offers free medical and psychosocial emergency treatment, crisis help and forensic examinations.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 125,
                column: "CostNote",
                value: "ATV har en egenandel på kr 350,- for voksne utøverklienter i individualterapi. For gruppebehandling vil egenandelen variere uavhengig hva slags gruppe det dreier seg om. Mange av tilbudene på ATV har en egenandelsbetaling, mens enkelte kontorer og tilbud er gratis.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 126,
                column: "CostNote",
                value: "ATV has a co-payment of kr 350,- for adult perpetrator clients in individual therapy. For group treatment the co-payment will vary regardless of what kind of group it is. Many of ATV's services have a co-payment, while some offices and services are free.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 129,
                column: "CostNote",
                value: "Tjenesten er gratis, krever ikke henvisning og de ansatte har taushetsplikt etter helsepersonelloven.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 130,
                column: "CostNote",
                value: "The service is free, requires no referral, and the staff are bound by confidentiality under the Health Personnel Act.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 131,
                column: "CostNote",
                value: "Du må som hovedregel betale egenandel for behandling på legevakten. Det er ulike priser for behandling på allmennlegevakten, skadelegevakten og psykiatrisk legevakt.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 132,
                column: "CostNote",
                value: "As a rule you must pay a co-payment for treatment at the emergency clinic. There are different prices for treatment at the general emergency clinic, the injury emergency clinic and the psychiatric emergency clinic.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 167,
                column: "OpeningHours",
                value: "08.30–15.30. Telefontider 08.30–14.00");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 168,
                column: "OpeningHours",
                value: "08.30–15.30. Phone hours 08.30–14.00");

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 2, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 9,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Address", "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { "Kronborgvegen 23, 2318 Hamar", 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "IsLowThreshold", "LastVerified" },
                values: new object[] { true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 104,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 106,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 107,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 109,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 110,
                columns: new[] { "Cost", "LastVerified", "Name" },
                values: new object[] { 1, new DateOnly(2026, 10, 26), "Psykisk helse-team, Løten kommune" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 112,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 113,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 115,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 117,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified", "Website" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26), "https://nokelverum.no" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 118,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 120,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 121,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 122,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 209,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 211,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 216,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 217,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 218,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 219,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 2, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 220,
                columns: new[] { "Address", "LastVerified", "Website" },
                values: new object[] { "Lovisenberggata 15A, 0456 Oslo", new DateOnly(2026, 10, 26), "https://www.ressurssenteret.no" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 221,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 222,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 2, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 223,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 224,
                columns: new[] { "IsLowThreshold", "LastVerified" },
                values: new object[] { true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 225,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 226,
                columns: new[] { "IsLowThreshold", "LastVerified" },
                values: new object[] { true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 227,
                columns: new[] { "IsLowThreshold", "LastVerified" },
                values: new object[] { true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 228,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 229,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 230,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 231,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 232,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 233,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 234,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 235,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 237,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 238,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 239,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 240,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 241,
                columns: new[] { "Cost", "LastVerified", "Name", "Phone" },
                values: new object[] { 1, new DateOnly(2026, 10, 26), "Sentrum helsestasjon for ungdom (HFU)", "23 43 19 04" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 242,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { 1, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 243,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { 1, true, new DateOnly(2026, 10, 26) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 247,
                column: "LastVerified",
                value: new DateOnly(2026, 10, 26));

            migrationBuilder.InsertData(
                table: "CategoryTranslations",
                columns: new[] { "Id", "CategoryId", "LanguageCode", "Name" },
                values: new object[,]
                {
                    { 19, 10, "nb", "Lavterskeltilbud" },
                    { 20, 10, "en", "Drop-in and activities" }
                });

            migrationBuilder.InsertData(
                table: "ResourceCategories",
                columns: new[] { "CategoryId", "ResourceId" },
                values: new object[,]
                {
                    { 10, 115 },
                    { 10, 227 },
                    { 10, 228 },
                    { 10, 247 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 115 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 227 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 228 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 10, 247 });

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 10);

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
                keyValue: 17,
                column: "OpeningHours",
                value: null);

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 18,
                column: "OpeningHours",
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
                keyValue: 51,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "Nav-kontoret for innbyggere i Stange, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Veiledningssenteret er åpent for selvbetjening, og du kan komme innom i drop-in-tiden.", "Drop-in mandag, onsdag og fredag 10.00-12.00; selvbetjening hverdager 09.00-14.30" });

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 52,
                columns: new[] { "Description", "OpeningHours" },
                values: new object[] { "The Nav office for people living in Stange, offering help with financial assistance, work, housing and other social services. The guidance centre is open for self-service, and you can come by during drop-in hours.", "Drop-in Monday, Wednesday and Friday 10.00-12.00; self-service weekdays 09.00-14.30" });

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
                column: "OpeningHours",
                value: "Vakttelefon mandag–fredag 08.30–15.30");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 58,
                column: "OpeningHours",
                value: "Duty phone Monday–Friday 08.30–15.30");

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
                column: "Description",
                value: "Nav-kontoret for innbyggere i Elverum, med hjelp til arbeid, økonomisk sosialhjelp, bolig og sosiale tjenester. Er du i en krisesituasjon uten penger til mat, medisin eller strøm, skal du ta kontakt med en gang. Merk: mottaket er midlertidig stengt for ombygging (ca. 12 uker fra 3. august 2026) — ring eller bruk nav.no i denne perioden.");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 70,
                column: "Description",
                value: "The Nav office for people living in Elverum, offering help with work, financial assistance, housing and social services. If you are in a crisis with no money for food, medicine or electricity, get in touch straight away. Note: the reception is temporarily closed for renovation (about 12 weeks from 3 August 2026) — call or use nav.no during this period.");

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
                keyValue: 83,
                column: "OpeningHours",
                value: "Åpningstiden vår er 09:00–14:30 alle hverdager");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 84,
                column: "OpeningHours",
                value: "Open 09:00–14:30 every weekday");

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
                keyValue: 167,
                column: "OpeningHours",
                value: "08.30–15.30");

            migrationBuilder.UpdateData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 168,
                column: "OpeningHours",
                value: "08.30–15.30");

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 9, 7) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 9,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Address", "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { "Kronborgveien 23, 2318 Hamar", null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "IsLowThreshold", "LastVerified" },
                values: new object[] { false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 104,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 106,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 107,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 109,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 110,
                columns: new[] { "Cost", "LastVerified", "Name" },
                values: new object[] { null, new DateOnly(2026, 8, 13), "Psykisk helse og rus-teamet (ROP-team), Løten kommune" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 112,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 113,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 115,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 117,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified", "Website" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13), "https://www.nokelverum.no" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 118,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 17) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 120,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 121,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 122,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 209,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 211,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 216,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 217,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 218,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 219,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 220,
                columns: new[] { "Address", "LastVerified", "Website" },
                values: new object[] { "Lovisenberggata 15 C, 0456 Oslo", new DateOnly(2026, 8, 13), "https://www.kirkeligressurssenter.no" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 221,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 222,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 223,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 224,
                columns: new[] { "IsLowThreshold", "LastVerified" },
                values: new object[] { false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 225,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 226,
                columns: new[] { "IsLowThreshold", "LastVerified" },
                values: new object[] { false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 227,
                columns: new[] { "IsLowThreshold", "LastVerified" },
                values: new object[] { false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 228,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 229,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 230,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 231,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 232,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 233,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 234,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 235,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 237,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 238,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 239,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 240,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 241,
                columns: new[] { "Cost", "LastVerified", "Name", "Phone" },
                values: new object[] { null, new DateOnly(2026, 8, 13), "Gamle Oslo helsestasjon for ungdom (HFU)", "415 65 535" });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 242,
                columns: new[] { "Cost", "LastVerified" },
                values: new object[] { null, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 243,
                columns: new[] { "Cost", "IsLowThreshold", "LastVerified" },
                values: new object[] { null, false, new DateOnly(2026, 8, 13) });

            migrationBuilder.UpdateData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 247,
                column: "LastVerified",
                value: new DateOnly(2026, 8, 13));
        }
    }
}

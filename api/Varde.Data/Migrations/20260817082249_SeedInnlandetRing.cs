using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedInnlandetRing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ResourceMunicipalities",
                columns: new[] { "MunicipalityId", "ResourceId" },
                values: new object[,]
                {
                    { 4, 12 },
                    { 5, 12 },
                    { 6, 12 },
                    { 7, 12 },
                    { 4, 14 },
                    { 5, 14 },
                    { 6, 14 },
                    { 7, 14 }
                });

            migrationBuilder.InsertData(
                table: "Resources",
                columns: new[] { "Id", "Address", "ChatUrl", "CreatedAt", "Email", "IsNational", "LastVerified", "MunicipalityId", "Name", "Phone", "UpdatedAt", "Website" },
                values: new object[,]
                {
                    { 101, "Nordåsvegen 4, 2382 Brumunddal", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 4, "Nav Ringsaker", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no/kontor/nav-ringsaker" },
                    { 102, "Brugata 3, 2380 Brumunddal", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "postmottak.psykisk.helse@ringsaker.kommune.no", false, new DateOnly(2026, 8, 13), 4, "Psykisk helse- og rustjenester, Ringsaker kommune", "62 33 52 20", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.ringsaker.kommune.no/tjenester/helse-og-omsorg/psykisk-helse-og-rustjenester" },
                    { 103, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 4, "Barneverntjenesten i Ringsaker", "47 47 27 87", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten" },
                    { 104, "Storgata 43, 2335 Stange", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "nav.stange@nav.no", false, new DateOnly(2026, 8, 13), 5, "Nav Stange", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no/kontor/nav-stange" },
                    { 105, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 5, "Stangehjelpa (avdeling for psykisk helse og rus), Stange kommune", "62 56 23 00", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/stangehjelpa/" },
                    { 106, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 5, "Psykososial krisehjelp, Stange kommune", "908 05 567", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/psykososial-krisehjelp/" },
                    { 107, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 5, "Barneverntjenesten i Stange", "905 42 305", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.stange.kommune.no/helse-og-mestring/barn-unge-og-familie/barnevern/" },
                    { 108, "Kildevegen 1, 2340 Løten", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "nav.loten@nav.no", false, new DateOnly(2026, 8, 13), 6, "Nav Løten", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no/kontor/nav-loten" },
                    { 109, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 6, "Økonomisk rådgivning, Nav Løten", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.loten.kommune.no/helse-sosial-og-familie/sosiale-tjenester-og-nav/okonomisk-radgivning/" },
                    { 110, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 6, "Psykisk helse og rus-teamet (ROP-team), Løten kommune", "904 74 982", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/psykisk-helse-og-rus-kategori/" },
                    { 111, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 6, "Barnevernet i Løten", "948 70 878", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.loten.kommune.no/helse-sosial-og-familie/barn-unge-og-familie/barnevern/" },
                    { 112, "Kildevegen 1, 2340 Løten", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 6, "Rask psykisk helsehjelp (RPH), Løten kommune", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/rask-psykisk-helsehjelp-rph/" },
                    { 113, "St. Olavs gate 4, 2414 Elverum", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 7, "Nav Elverum", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no/kontor/nav-elverum" },
                    { 114, "Helsehuset, Kirkevegen 47, 2413 Elverum", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 7, "Barneverntjenesten i Elverum", "940 17 770", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.elverum.kommune.no/vare-tjenester/barnehage-og-skole/barnevern/kontakt-barnevernet/" },
                    { 115, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 7, "Lavterskel rus- og psykisk helsehjelp (Annekset og Grip), Elverum kommune", "993 72 609", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/lavterskel-rus-og-psykisk-helsehjelp/" },
                    { 116, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 7, "Ambulant akutt enhet (AAE), DPS Elverum-Hamar", "915 06 200", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/er-du-i-en-krisesituasjon-og-trenger-akutt-hjelp/" },
                    { 117, "Storgata 10, 2408 Elverum", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "post@nokelverum.no", false, new DateOnly(2026, 8, 13), 7, "Nok. Elverum Ressurssenter", "971 59 810", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nokelverum.no" },
                    { 118, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "post@nokhamar.no", false, new DateOnly(2026, 8, 17), 1, "Nok. Hamar", "916 91 714", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nokhamar.no" },
                    { 119, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "post@husbanken.no", true, new DateOnly(2026, 8, 13), null, "Husbanken", "22 96 16 00", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://husbanken.no/person/" },
                    { 120, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Skatteetaten", "800 80 000", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.skatteetaten.no" },
                    { 121, null, "https://www.korspahalsen.no", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Kors på halsen (Røde Kors)", "800 33 321", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.korspahalsen.no" },
                    { 122, null, "https://sidetmedord.mentalhelse.no/", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Sidetmedord (Mental Helse)", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://sidetmedord.mentalhelse.no/" }
                });

            migrationBuilder.InsertData(
                table: "ResourceCategories",
                columns: new[] { "CategoryId", "ResourceId" },
                values: new object[,]
                {
                    { 1, 101 },
                    { 2, 101 },
                    { 7, 101 },
                    { 3, 102 },
                    { 4, 102 },
                    { 6, 103 },
                    { 1, 104 },
                    { 2, 104 },
                    { 7, 104 },
                    { 3, 105 },
                    { 4, 105 },
                    { 3, 106 },
                    { 6, 107 },
                    { 1, 108 },
                    { 2, 108 },
                    { 7, 108 },
                    { 1, 109 },
                    { 3, 110 },
                    { 4, 110 },
                    { 6, 111 },
                    { 3, 112 },
                    { 1, 113 },
                    { 2, 113 },
                    { 7, 113 },
                    { 6, 114 },
                    { 3, 115 },
                    { 4, 115 },
                    { 3, 116 },
                    { 5, 117 },
                    { 5, 118 },
                    { 1, 119 },
                    { 2, 119 },
                    { 1, 120 },
                    { 3, 121 },
                    { 6, 121 },
                    { 3, 122 }
                });

            migrationBuilder.InsertData(
                table: "ResourceMunicipalities",
                columns: new[] { "MunicipalityId", "ResourceId" },
                values: new object[] { 6, 118 });

            migrationBuilder.InsertData(
                table: "ResourceTranslations",
                columns: new[] { "Id", "Description", "LanguageCode", "OpeningHours", "ResourceId" },
                values: new object[,]
                {
                    { 45, "Nav-kontoret for innbyggere i Ringsaker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i drop-in-tiden, eller avtale time på forhånd.", "nb", "Mandag 12.00-14.00, onsdag 12.00-14.00, fredag 10.00-12.00", 101 },
                    { 46, "The Nav office for people living in Ringsaker, offering help with financial assistance, work, housing and other social services. You can come without an appointment during drop-in hours, or book a time in advance.", "en", "Monday 12.00-14.00, Wednesday 12.00-14.00, Friday 10.00-12.00", 101 },
                    { 47, "Kommunens tilbud til voksne med psykiske vansker eller rusproblemer, med samtaler, oppfølging og praktisk hjelp i hverdagen. Du kan få inntil fire samtaler uten henvisning.", "nb", "Kan kontaktes i tidsrommet 08-15.30", 102 },
                    { 48, "The municipality's service for adults with mental health or substance use difficulties, offering counselling, follow-up and practical everyday support. You can have up to four conversations without a referral.", "en", "Reachable between 08.00 and 15.30", 102 },
                    { 49, "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og gir hjelp til barn, unge og familier som har det vanskelig. Du kan ringe for å drøfte en bekymring før du melder.", "nb", "Hverdager 08.00–15.30", 103 },
                    { 50, "The municipal child welfare service, which receives reports of concern and helps children, young people and families in difficulty. You can call to discuss a worry before making a formal report.", "en", "Weekdays 08.00–15.30", 103 },
                    { 51, "Nav-kontoret for innbyggere i Stange, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Veiledningssenteret er åpent for selvbetjening, og du kan komme innom i drop-in-tiden.", "nb", "Drop-in mandag, onsdag og fredag 10.00-12.00; selvbetjening hverdager 09.00-14.30", 104 },
                    { 52, "The Nav office for people living in Stange, offering help with financial assistance, work, housing and other social services. The guidance centre is open for self-service, and you can come by during drop-in hours.", "en", "Drop-in Monday, Wednesday and Friday 10.00-12.00; self-service weekdays 09.00-14.30", 104 },
                    { 53, "Stange kommunes samlede lavterskeltilbud innen psykisk helse og rus, for både barn, unge og voksne. Du trenger ingen henvisning, og kan ta kontakt selv i telefontiden.", "nb", "Telefontid hverdager 09.00-15.00 (stengt 11.00-11.45)", 105 },
                    { 54, "Stange municipality's combined low-threshold service for mental health and substance use, for children, young people and adults alike. No referral is needed, and you can get in touch yourself during phone hours.", "en", "Phone hours weekdays 09.00-15.00 (closed 11.00-11.45)", 105 },
                    { 55, "Kommunens telefon for deg som står i en akutt psykisk krise og trenger noen å snakke med nå. På dagtid settes du over til Stangehjelpa, og i helgene til det interkommunale kriseteamet.", "nb", "Hverdager til 15.30 (16.00 fredag) settes over til Stangehjelpa", 106 },
                    { 56, "The municipality's line for anyone in an acute mental health crisis who needs to talk to someone now. During the day you are put through to Stangehjelpa, and at weekends to the intermunicipal crisis team.", "en", "Weekdays until 15.30 (16.00 on Fridays) the call goes through to Stangehjelpa", 106 },
                    { 57, "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og følger opp barn, unge og familier. Vakttelefonen er bemannet på dagtid i ukedagene.", "nb", "Vakttelefon mandag–fredag 08.30–15.30", 107 },
                    { 58, "The municipal child welfare service, which receives reports of concern and follows up children, young people and families. The duty phone is staffed during weekday daytime hours.", "en", "Duty phone Monday–Friday 08.30–15.30", 107 },
                    { 59, "Nav-kontoret for innbyggere i Løten, med hjelp til arbeid, økonomisk sosialhjelp, bolig og forvaltning av egen økonomi. Veiledningssenteret har PC-er du kan bruke, og du kan avtale time med en veileder.", "nb", null, 108 },
                    { 60, "The Nav office for people living in Løten, offering help with work, financial assistance, housing and managing your own money. The guidance centre has computers you can use, and you can book a meeting with an adviser.", "en", null, 108 },
                    { 61, "Gratis økonomisk rådgivning for deg som sliter med gjeld eller ikke får budsjettet til å gå opp. Rådgiveren hjelper deg med å få oversikt og ser på muligheter som refinansiering eller gjeldsordning.", "nb", "Mandag, onsdag og fredag 09.00 – 15.00; tirsdag og torsdag 09.00 – 13.00", 109 },
                    { 62, "Free financial counselling for anyone struggling with debt or unable to make the budget add up. The adviser helps you get an overview and looks at options such as refinancing or a debt settlement.", "en", "Monday, Wednesday and Friday 09.00 – 15.00; Tuesday and Thursday 09.00 – 13.00", 109 },
                    { 63, "Kommunens team for voksne med psykiske vansker, rusproblemer eller begge deler. Krisetelefonen er åpen på dagtid i ukedagene, og bemannes av teamet selv.", "nb", "Krisetelefon mandag – fredag kl. 08.00-15.00", 110 },
                    { 64, "The municipality's team for adults with mental health difficulties, substance use problems or both. The crisis line is open during weekday daytime hours and is staffed by the team itself.", "en", "Crisis line Monday – Friday 08.00-15.00", 110 },
                    { 65, "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og gir hjelp til barn, unge og familier. Resepsjonen kan svare på spørsmål og sette deg i kontakt med rett person.", "nb", "Mandag - fredag kl. 08:00-15:30", 111 },
                    { 66, "The municipal child welfare service, which receives reports of concern and helps children, young people and families. Reception can answer questions and put you through to the right person.", "en", "Monday - Friday 08:00-15:30", 111 },
                    { 67, "Gratis korttidsbehandling for deg fra 16 år med lettere angst, nedstemthet, stress eller søvnvansker. Hjelpen gis ofte over telefon, med veiledet selvhjelp, og du trenger ingen henvisning.", "nb", "kl. 08.00-15.30", 112 },
                    { 68, "Free short-term treatment for people aged 16 and over with mild anxiety, low mood, stress or sleep problems. Help is often given by phone, using guided self-help, and no referral is needed.", "en", "08.00-15.30", 112 },
                    { 69, "Nav-kontoret for innbyggere i Elverum, med hjelp til arbeid, økonomisk sosialhjelp, bolig og sosiale tjenester. Er du i en krisesituasjon uten penger til mat, medisin eller strøm, skal du ta kontakt med en gang. Merk: mottaket er midlertidig stengt for ombygging (ca. 12 uker fra 3. august 2026) — ring eller bruk nav.no i denne perioden.", "nb", "Telefontid hverdager kl. 09 - 15", 113 },
                    { 70, "The Nav office for people living in Elverum, offering help with work, financial assistance, housing and social services. If you are in a crisis with no money for food, medicine or electricity, get in touch straight away. Note: the reception is temporarily closed for renovation (about 12 weeks from 3 August 2026) — call or use nav.no during this period.", "en", "Phone hours weekdays 09.00 - 15.00", 113 },
                    { 71, "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og følger opp barn, unge og familier som trenger hjelp. Både barn selv og voksne som er bekymret kan ta kontakt.", "nb", "Mandag - fredag kl. 08 - 15", 114 },
                    { 72, "The municipal child welfare service, which receives reports of concern and follows up children, young people and families who need help. Both children themselves and worried adults can get in touch.", "en", "Monday - Friday 08.00 - 15.00", 114 },
                    { 73, "Kommunens lavterskeltilbud til voksne med rusproblemer eller psykiske helseutfordringer, med samtaler og oppfølging. Tilbudet er gratis, og du kan ta kontakt selv.", "nb", null, 115 },
                    { 74, "The municipality's low-threshold service for adults with substance use or mental health difficulties, offering conversations and follow-up. The service is free and you can make contact yourself.", "en", null, 115 },
                    { 75, "Akutteam i spesialisthelsetjenesten for deg som står i en alvorlig psykisk krise og trenger rask vurdering. Teamet kan komme til deg, og er tilgjengelig på dagtid i ukedagene.", "nb", "Mandag – fredag kl. 07.30 - 15.30", 116 },
                    { 76, "An acute team within the specialist health service for people in a serious mental health crisis who need a rapid assessment. The team can come to you and is available during weekday daytime hours.", "en", "Monday – Friday 07.30 - 15.30", 116 },
                    { 77, "Ressurssenter for deg som har opplevd seksuelle overgrep, og for pårørende. Du kan få samtaler og støtte gratis, uten henvisning og uten å ha anmeldt forholdet.", "nb", null, 117 },
                    { 78, "A resource centre for people who have experienced sexual abuse, and for their relatives. You can get conversations and support free of charge, without a referral and without having reported it.", "en", null, 117 },
                    { 79, "Ressurssenter for deg som har opplevd seksuelle overgrep eller incest, og for pårørende. Tilbudet er gratis, og du trenger ingen henvisning.", "nb", null, 118 },
                    { 80, "A resource centre for people who have experienced sexual abuse or incest, and for their relatives. The service is free and no referral is needed.", "en", null, 118 },
                    { 81, "Statens virkemiddel i boligpolitikken, med bostøtte til deg som har lav inntekt og høye boutgifter, og startlån og tilskudd til å kjøpe eller beholde bolig. Startlån søker du om gjennom kommunen din.", "nb", "Mandag - fredag, kl. 08.00 - 15.45 (15. september - 14. mai); mandag - fredag, kl. 08.00 - 15.00 (15. mai - 14. september)", 119 },
                    { 82, "The state housing bank, with housing benefit for people on low incomes with high housing costs, and start-up loans and grants to buy or keep a home. Start-up loans are applied for through your municipality.", "en", "Monday - Friday 08.00 - 15.45 (15 September - 14 May); Monday - Friday 08.00 - 15.00 (15 May - 14 September)", 119 },
                    { 83, "Statlig etat med ansvar for skatt, skattemelding og Folkeregisteret. Hit henvender du deg om skattekort, restskatt, flytting, navneendring og attester fra folkeregisteret.", "nb", "Åpningstiden vår er 09:00–14:30 alle hverdager", 120 },
                    { 84, "The national tax administration, responsible for tax, tax returns and the National Population Register. Contact them about tax cards, underpaid tax, changes of address, name changes and registry certificates.", "en", "Open 09:00–14:30 every weekday", 120 },
                    { 85, "Gratis og anonymt samtaletilbud for barn og unge under 18 år, på telefon, chat og e-post. Du kan snakke med en voksen om akkurat det du har på hjertet, uansett hvor stort eller lite det er.", "nb", "Åpent alle dager, hele året, kl. 14-22 (jule- og sommerferie 16-22)", 121 },
                    { 86, "A free and anonymous talking service for children and young people under 18, by phone, chat and email. You can talk to an adult about whatever is on your mind, however big or small.", "en", "Open every day, all year, 14.00-22.00 (16.00-22.00 during the Christmas and summer holidays)", 121 },
                    { 87, "Mental Helses nettsted der du kan skrive anonymt om det som er vanskelig, i chat eller i forum. Du kan lese om temaer som ensomhet, angst, depresjon og økonomi, og få svar fra andre.", "nb", null, 122 },
                    { 88, "Mental Helse's website where you can write anonymously about what is difficult, in chat or on the forum. You can read about topics such as loneliness, anxiety, depression and money, and get replies from others.", "en", null, 122 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 101 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 101 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 101 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 102 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 102 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 103 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 104 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 104 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 104 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 105 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 105 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 106 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 107 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 108 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 108 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 108 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 109 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 110 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 110 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 111 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 112 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 113 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 113 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 113 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 114 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 115 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 115 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 116 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 117 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 118 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 119 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 119 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 120 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 121 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 121 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 122 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 4, 12 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 5, 12 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 6, 12 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 7, 12 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 4, 14 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 5, 14 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 6, 14 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 7, 14 });

            migrationBuilder.DeleteData(
                table: "ResourceMunicipalities",
                keyColumns: new[] { "MunicipalityId", "ResourceId" },
                keyValues: new object[] { 6, 118 });

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 57);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 58);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 59);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 60);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 61);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 62);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 63);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 64);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 65);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 66);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 67);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 68);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 69);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 70);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 71);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 72);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 73);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 74);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 75);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 76);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 77);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 78);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 79);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 80);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 81);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 82);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 83);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 84);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 85);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 86);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 87);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 88);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 101);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 102);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 103);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 104);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 105);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 106);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 107);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 108);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 109);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 110);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 111);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 112);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 113);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 114);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 115);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 116);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 117);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 118);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 119);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 120);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 121);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 122);
        }
    }
}

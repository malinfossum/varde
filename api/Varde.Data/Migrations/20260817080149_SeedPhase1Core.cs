using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Varde.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedPhase1Core : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Slug" },
                values: new object[,]
                {
                    { 1, "okonomi" },
                    { 2, "bolig" },
                    { 3, "psykisk-helse" },
                    { 4, "rus" },
                    { 5, "vold-og-overgrep" },
                    { 6, "familie-og-barn" },
                    { 7, "arbeid" },
                    { 8, "juridisk-hjelp" },
                    { 9, "nodtjenester" }
                });

            migrationBuilder.InsertData(
                table: "Municipalities",
                columns: new[] { "Id", "County", "Name" },
                values: new object[,]
                {
                    { 1, "Innlandet", "Hamar" },
                    { 2, "Innlandet", "Lillehammer" },
                    { 3, "Innlandet", "Gjøvik" },
                    { 4, "Innlandet", "Ringsaker" },
                    { 5, "Innlandet", "Stange" },
                    { 6, "Innlandet", "Løten" },
                    { 7, "Innlandet", "Elverum" },
                    { 8, "Oslo", "Oslo" }
                });

            migrationBuilder.InsertData(
                table: "Resources",
                columns: new[] { "Id", "Address", "ChatUrl", "CreatedAt", "Email", "IsNational", "LastVerified", "MunicipalityId", "Name", "Phone", "UpdatedAt", "Website" },
                values: new object[,]
                {
                    { 1, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Hjelpetelefonen (Mental Helse)", "116 123", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://mentalhelse.no" },
                    { 2, null, "https://www.soschat.no", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Kirkens SOS", "22 40 00 40", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.kirkens-sos.no" },
                    { 3, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Legevakt", "116 117", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.helsenorge.no/legevakt/" },
                    { 4, null, "https://www.116111.no", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Alarmtelefonen for barn og unge", "116 111", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.116111.no" },
                    { 5, null, "https://www.volinjen.no", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "VO-linjen", "116 006", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.volinjen.no" },
                    { 6, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Navs økonomi- og gjeldsveiledningstelefon", "55 55 33 39", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 7, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Jussbuss", "22 84 29 00", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://foreninger.uio.no/jussbuss/" },
                    { 8, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Rustelefonen", "915 08 588", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://rustelefonen.no" },
                    { 9, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, true, new DateOnly(2026, 8, 13), null, "Arbeidslivstelefonen (Mental Helse)", "116 123", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://mentalhelse.no" }
                });

            migrationBuilder.InsertData(
                table: "CategoryTranslations",
                columns: new[] { "Id", "CategoryId", "LanguageCode", "Name" },
                values: new object[,]
                {
                    { 1, 1, "nb", "Økonomi og gjeld" },
                    { 2, 1, "en", "Money and debt" },
                    { 3, 2, "nb", "Bolig" },
                    { 4, 2, "en", "Housing" },
                    { 5, 3, "nb", "Psykisk helse" },
                    { 6, 3, "en", "Mental health" },
                    { 7, 4, "nb", "Rus og avhengighet" },
                    { 8, 4, "en", "Substance use and addiction" },
                    { 9, 5, "nb", "Vold og overgrep" },
                    { 10, 5, "en", "Violence and abuse" },
                    { 11, 6, "nb", "Familie og barn" },
                    { 12, 6, "en", "Family and children" },
                    { 13, 7, "nb", "Arbeid" },
                    { 14, 7, "en", "Work" },
                    { 15, 8, "nb", "Juridisk hjelp" },
                    { 16, 8, "en", "Legal help" },
                    { 17, 9, "nb", "Nødtjenester" },
                    { 18, 9, "en", "Emergency services" }
                });

            migrationBuilder.InsertData(
                table: "ResourceCategories",
                columns: new[] { "CategoryId", "ResourceId" },
                values: new object[,]
                {
                    { 3, 1 },
                    { 3, 2 },
                    { 3, 3 },
                    { 9, 3 },
                    { 5, 4 },
                    { 6, 4 },
                    { 9, 4 },
                    { 5, 5 },
                    { 9, 5 },
                    { 1, 6 },
                    { 8, 7 },
                    { 4, 8 },
                    { 3, 9 },
                    { 7, 9 }
                });

            migrationBuilder.InsertData(
                table: "ResourceTranslations",
                columns: new[] { "Id", "Description", "LanguageCode", "OpeningHours", "ResourceId" },
                values: new object[,]
                {
                    { 1, "Gratis og døgnåpen telefontjeneste for alle som trenger noen å snakke med om det som er vanskelig. Du kan være anonym, og de som svarer har taushetsplikt.", "nb", "Døgnåpent", 1 },
                    { 2, "A free 24-hour phone line for anyone who needs someone to talk to about what is difficult. You can stay anonymous, and everyone who answers is bound by confidentiality.", "en", "Open 24 hours", 1 },
                    { 3, "Døgnåpen krisetelefon for deg som har det vanskelig eller tenker på selvmord. Tjenesten er anonym, og du trenger ikke ha en bestemt grunn for å ringe.", "nb", "Døgnåpent", 2 },
                    { 4, "A 24-hour crisis line for anyone in distress or having thoughts of suicide. The service is anonymous, and you do not need a particular reason to call.", "en", "Open 24 hours", 2 },
                    { 5, "Nasjonalt nummer som setter deg over til legevaktsentralen der du befinner deg, når fastlegen er stengt og du trenger hjelp raskt. Ved akutt livsfare skal du ringe 113.", "nb", null, 3 },
                    { 6, "A national number that connects you to the out-of-hours medical service where you are, when your regular doctor is closed and you need help quickly. In a life-threatening emergency, call 113 instead.", "en", null, 3 },
                    { 7, "Gratis døgnåpen telefon for barn og unge som opplever vold, overgrep eller omsorgssvikt. Voksne som er bekymret for et barn kan også ringe.", "nb", "Døgnåpent", 4 },
                    { 8, "A free 24-hour phone line for children and young people experiencing violence, abuse or neglect. Adults who are worried about a child can call too.", "en", "Open 24 hours", 4 },
                    { 9, "Hjelpelinje for deg som opplever vold eller overgrep i nære relasjoner. Også for pårørende og hjelpere, og du kan være helt anonym.", "nb", "Døgnåpent", 5 },
                    { 10, "A helpline for anyone experiencing violence or abuse in a close relationship. It is also for relatives and professionals, and you can remain completely anonymous.", "en", "Open 24 hours", 5 },
                    { 11, "Gratis veiledning for deg som har økonomiske problemer eller gjeld du ikke klarer å betjene. Du kan få hjelp til å få oversikt over økonomien og sette opp et realistisk budsjett.", "nb", "Hverdager 09:00–15:00", 6 },
                    { 12, "Free guidance for anyone with money problems or debt they cannot manage. You can get help mapping out your finances and building a budget you can actually live with.", "en", "Weekdays 09:00–15:00", 6 },
                    { 13, "Gratis rettshjelp fra jusstudenter i saker om blant annet husleie, gjeld, trygd, arbeid, utlendingsrett og fengsel. Du trenger ikke advokat for å ta kontakt.", "nb", "Mandag 17:00–20:00 og tirsdag 10:00–15:00", 7 },
                    { 14, "Free legal aid from law students in areas such as rent, debt, benefits, employment, immigration and prison law. You do not need a lawyer to get in touch.", "en", "Monday 17:00–20:00 and Tuesday 10:00–15:00", 7 },
                    { 15, "Anonym telefontjeneste for spørsmål om rus, både for deg som bruker rusmidler selv og for pårørende. Du får informasjon og veiledning uten å bli møtt med pekefinger. Kortnummeret 08588 brukes også for tjenesten.", "nb", "Hverdager 11:00–14:30 og 15:00–18:00", 8 },
                    { 16, "An anonymous phone service for questions about drugs and alcohol, both for people who use substances and for their families. You get information and guidance without being judged. The short code 08588 is also used for the service.", "en", "Weekdays 11:00–14:30 and 15:00–18:00", 8 },
                    { 17, "Rådgivning om vanskelige forhold på jobben, som konflikt, mobbing, sykefravær eller oppsigelse. Åpen for arbeidstakere, ledere, tillitsvalgte og arbeidssøkere. Velg tast 3 i menyen.", "nb", null, 9 },
                    { 18, "Advice about difficult situations at work, such as conflict, bullying, sick leave or dismissal. Open to employees, managers, union representatives and jobseekers. Choose option 3 in the menu.", "en", null, 9 }
                });

            migrationBuilder.InsertData(
                table: "Resources",
                columns: new[] { "Id", "Address", "ChatUrl", "CreatedAt", "Email", "IsNational", "LastVerified", "MunicipalityId", "Name", "Phone", "UpdatedAt", "Website" },
                values: new object[,]
                {
                    { 10, "Vangsvegen 121, 2318 Hamar", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 1, "Familievernkontoret Innlandet Øst, avdeling Hamar", "466 17 130", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.bufdir.no/familie/familievernkontorer/oversikt/innlandet-ost/" },
                    { 11, "Torggata 63, 2317 Hamar", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 1, "Nav Hamar", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 12, "Kronborgveien 23, 2318 Hamar", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 1, "Hamar interkommunale krisesenter", "62 56 18 30", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/krisesenter/" },
                    { 13, "Vangsvegen 121, 2318 Hamar", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 1, "Tjeneste psykisk helse og rus, Hamar kommune", "916 03 327", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.hamar.kommune.no/helseogomsorg/psykisk-helse-og-rus/tjeneste-psykisk-helse-og-rus/" },
                    { 14, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 1, "Ringsaker interkommunale barnevernvakt", "404 04 015", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/hjelpetelefoner-for-familier-og-barn-unge/" },
                    { 15, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 2, "Rask psykisk helsehjelp, Lillehammer kommune", "917 13 338", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/rask-psykisk-helsehjelp/informasjon-om-rask-psykisk-helsehjelp/" },
                    { 16, "Skoletorget 6 D, 2609 Lillehammer", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 2, "Gudbrandsdal Krisesenter IKS", "414 81 220", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://gudbrandsdal-krisesenter.no" },
                    { 17, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 2, "Housing First, Lillehammer kommune", "451 64 131", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/om-psykisk-helse-og-rus/kontaktinformasjon/" },
                    { 18, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 2, "Oppfølgingsteamet, Lillehammer kommune", "902 43 733", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/om-psykisk-helse-og-rus/kontaktinformasjon/" },
                    { 19, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 2, "Mottak for seksuelle overgrep, Lillehammer", "61 27 22 16", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://lillehammer.kommune.no/om-kommunen/kontakt-oss/nod-og-vakttelefoner/" },
                    { 20, "Parkgata 10 A, 2815 Gjøvik", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 3, "Nav Gjøvik", "55 55 33 33", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.nav.no" },
                    { 21, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 3, "Gjøvik Krisesenter IKS", "61 17 55 60", new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.krisesenteret-gjovik.no" },
                    { 22, null, null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), null, false, new DateOnly(2026, 8, 13), 3, "Jobbhus Gjøvik", null, new DateTime(2026, 8, 17, 0, 0, 0, 0, DateTimeKind.Utc), "https://www.gjovik.kommune.no/jobbhus/jeg-onsker-jobb/" }
                });

            migrationBuilder.InsertData(
                table: "ResourceCategories",
                columns: new[] { "CategoryId", "ResourceId" },
                values: new object[,]
                {
                    { 6, 10 },
                    { 1, 11 },
                    { 7, 11 },
                    { 2, 12 },
                    { 5, 12 },
                    { 9, 12 },
                    { 3, 13 },
                    { 4, 13 },
                    { 5, 14 },
                    { 6, 14 },
                    { 9, 14 },
                    { 3, 15 },
                    { 4, 15 },
                    { 5, 16 },
                    { 9, 16 },
                    { 2, 17 },
                    { 3, 17 },
                    { 3, 18 },
                    { 4, 18 },
                    { 5, 19 },
                    { 9, 19 },
                    { 1, 20 },
                    { 2, 20 },
                    { 7, 20 },
                    { 5, 21 },
                    { 9, 21 },
                    { 7, 22 }
                });

            migrationBuilder.InsertData(
                table: "ResourceTranslations",
                columns: new[] { "Id", "Description", "LanguageCode", "OpeningHours", "ResourceId" },
                values: new object[,]
                {
                    { 19, "Gratis tilbud om samtale, parterapi og mekling for familier, par og enkeltpersoner. Du trenger ingen henvisning for å bestille time.", "nb", "08:30–15:00, redusert om sommeren", 10 },
                    { 20, "A free service offering counselling, couples therapy and mediation for families, couples and individuals. No referral is needed to book an appointment.", "en", "08:30–15:00, reduced in summer", 10 },
                    { 21, "Nav-kontoret for innbyggere i Hamar, med hjelp til økonomisk sosialhjelp, arbeid og andre sosiale tjenester. Du kan møte opp uten avtale i drop-in-tiden, eller avtale time på forhånd.", "nb", "Drop-in mandag og onsdag 12:00–14:00, fredag 10:00–12:00", 11 },
                    { 22, "The Nav office for people living in Hamar, offering help with financial assistance, work and other social services. You can come without an appointment during drop-in hours, or book a time in advance.", "en", "Drop-in Monday and Wednesday 12:00–14:00, Friday 10:00–12:00", 11 },
                    { 23, "Gratis døgnåpent tilbud til kvinner, menn, barn og eldre som er utsatt for vold i nære relasjoner. Senteret tilbyr både beskyttet botilbud og samtaler for dem som ikke trenger å bo der.", "nb", "Døgnåpent", 12 },
                    { 24, "A free 24-hour service for women, men, children and older people affected by violence in close relationships. The centre offers both protected accommodation and counselling for those who do not need to stay.", "en", "Open 24 hours", 12 },
                    { 25, "Kommunens tilbud til voksne med psykiske vansker eller rusproblemer, med samtaler, oppfølging og praktisk hjelp i hverdagen. Du kan ta kontakt selv, uten henvisning fra lege.", "nb", "Kun dagtid", 13 },
                    { 26, "The municipality's service for adults with mental health or substance use difficulties, offering counselling, follow-up and practical everyday support. You can make contact yourself, without a doctor's referral.", "en", "Daytime only", 13 },
                    { 27, "Barnevernets akuttberedskap på kveld, natt, helg og helligdager for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret kan ringe.", "nb", "Kveld og natt 15:30–08:00, samt helger og helligdager", 14 },
                    { 28, "The child welfare emergency service, staffed evenings, nights, weekends and public holidays for children and young people in urgent situations. Both children themselves and worried adults can call.", "en", "Evenings and nights 15:30–08:00 plus weekends and holidays", 14 },
                    { 29, "Korttidsbehandling for deg fra 16 år med lettere angst, depresjon, søvnvansker eller begynnende rusproblemer. Tilbudet er gratis, og du trenger ikke henvisning fra fastlegen.", "nb", "Mandag og onsdag 11:30–13:00", 15 },
                    { 30, "Short-term treatment for people aged 16 and over with mild anxiety, depression, sleep problems or early substance use difficulties. The service is free and needs no referral from your doctor.", "en", "Monday and Wednesday 11:30–13:00", 15 },
                    { 31, "Krisesenter for kvinner, menn og barn som er utsatt for vold eller trusler om vold i nære relasjoner. Tilbudet er gratis, og du trenger ingen henvisning.", "nb", null, 16 },
                    { 32, "A crisis centre for women, men and children affected by violence or threats of violence in close relationships. The service is free and needs no referral.", "en", null, 16 },
                    { 33, "Tilbud til bostedsløse med rus- eller psykiske helseutfordringer, der du først får en varig bolig og deretter oppfølging der du bor. Målet er en stabil bosituasjon uten krav om rusfrihet på forhånd.", "nb", "Hverdager 09:00–15:00", 17 },
                    { 34, "A service for homeless people with substance use or mental health difficulties, where you first get permanent housing and then receive support where you live. The aim is a stable home without requiring sobriety first.", "en", "Weekdays 09:00–15:00", 17 },
                    { 35, "Team som gir tett oppfølging til voksne med rusproblemer eller psykiske helseutfordringer i hverdagen. Teamet har lang åpningstid, også i helgene.", "nb", "Hver dag 09:00–21:00", 18 },
                    { 36, "A team providing close everyday follow-up for adults with substance use or mental health difficulties. The team has long opening hours, including weekends.", "en", "Every day 09:00–21:00", 18 },
                    { 37, "Medisinsk hjelp, undersøkelse og sporsikring for deg som har vært utsatt for voldtekt eller seksuelt overgrep. Du kan ta kontakt uten å ha anmeldt forholdet til politiet.", "nb", null, 19 },
                    { 38, "Medical care, examination and forensic evidence collection for people who have experienced rape or sexual assault. You can get in touch without having reported it to the police.", "en", null, 19 },
                    { 39, "Nav-kontoret for innbyggere i Gjøvik, med oppfølging innen økonomi, arbeid, bolig og sosiale tjenester. Du kan komme innom i drop-in-tiden eller avtale time.", "nb", "Hverdager 09:00–15:00", 20 },
                    { 40, "The Nav office for people living in Gjøvik, offering support with money, work, housing and social services. You can drop in during open hours or book an appointment.", "en", "Weekdays 09:00–15:00", 20 },
                    { 41, "Gratis døgnåpent tilbud til kvinner, menn og barn som er utsatt for vold i nære relasjoner, voldtekt eller tvangsekteskap. Adressen oppgis først når du tar kontakt, av hensyn til sikkerheten.", "nb", "Døgnåpent", 21 },
                    { 42, "A free 24-hour service for women, men and children affected by violence in close relationships, rape or forced marriage. The address is only given when you make contact, for safety reasons.", "en", "Open 24 hours", 21 },
                    { 43, "Hjelp til å komme i arbeid for deg mellom 16 og 30 år i Gjøvik, med veiledning, jobbsøking, CV og arbeidspraksis. Drop-in-tilbudet er åpent for alle arbeidssøkere uansett alder og bosted.", "nb", null, 22 },
                    { 44, "Help getting into work for people aged 16 to 30 in Gjøvik, with guidance, job applications, CV writing and work placements. The drop-in service is open to all jobseekers regardless of age or where they live.", "en", null, 22 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "CategoryTranslations",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Municipalities",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Municipalities",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Municipalities",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Municipalities",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Municipalities",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 1 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 2 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 3 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 3 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 4 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 4 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 4 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 5 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 5 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 6 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 8, 7 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 8 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 9 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 9 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 10 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 11 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 11 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 12 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 12 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 12 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 13 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 13 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 14 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 6, 14 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 14 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 15 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 15 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 16 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 16 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 17 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 17 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 3, 18 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 4, 18 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 19 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 19 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 1, 20 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 2, 20 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 20 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 5, 21 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 9, 21 });

            migrationBuilder.DeleteData(
                table: "ResourceCategories",
                keyColumns: new[] { "CategoryId", "ResourceId" },
                keyValues: new object[] { 7, 22 });

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "ResourceTranslations",
                keyColumn: "Id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Resources",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Municipalities",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Municipalities",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Municipalities",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}

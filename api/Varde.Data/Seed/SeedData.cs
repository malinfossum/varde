using Microsoft.EntityFrameworkCore;
using Varde.Core.Models;

namespace Varde.Data.Seed;

/// <summary>
/// Phase-1 seed. Every value here is copied verbatim from docs/seed-data.md (and, for the chat
/// addenda on rows 2, 4 and 5, from docs/seed-data-innlandet-ring.md's "Chat addenda" section) —
/// that file is the source of truth, never this file's own memory of it. Resource ids match the
/// doc's row numbers so later batches (docs/seed-data-innlandet-ring.md rows 101+,
/// docs/seed-data-oslo.md rows 201+) can append without renumbering anything already shipped.
///
/// This batch (9a) seeds rows 1–22: nine categories, all eight municipalities, and the 22 core
/// services. Coverage joins (ResourceMunicipality) and rows 101+ arrive in later batches.
///
/// Every value here is a compile-time constant. HasData compares seed values against the model
/// on every `migrations add`, so a DateTime.UtcNow or a computed id would produce a spurious
/// migration on each run. DateTimes are explicitly Utc: Npgsql refuses any other Kind for
/// 'timestamp with time zone'.
///
/// Phone numbers follow the 2026-08-17 normalisation rule (digits never change, only grouping):
/// landline 8-digit numbers group as "xx xx xx xx", mobile numbers (leading 4 or 9) as
/// "xxx xx xxx", and 116-numbers are kept exactly as printed. Four rows needed re-grouping from
/// the doc's printed cell to match this rule — row 10 (46 61 71 30 -> 466 17 130), row 11
/// (555 53 333 -> 55 55 33 33), row 14 (40 40 40 15 -> 404 04 015) and row 15
/// (91 71 33 38 -> 917 13 338). Every regrouping is confirmed against an alternate grouping of
/// the same digits already present in the row's own Notes in docs/seed-data.md.
/// </summary>
public static class SeedData
{
    private static readonly DateTime SeededAt = new(2026, 8, 17, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateOnly Verified = new(2026, 8, 13);

    // Municipality ids — county = Innlandet for 1-7, Oslo for 8.
    private const int Hamar = 1;
    private const int Lillehammer = 2;
    private const int Gjovik = 3;
    private const int Ringsaker = 4;
    private const int Stange = 5;
    private const int Loten = 6;
    private const int Elverum = 7;
    private const int Oslo = 8;

    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Municipality>().HasData(
            new Municipality { Id = Hamar, Name = "Hamar", County = "Innlandet" },
            new Municipality { Id = Lillehammer, Name = "Lillehammer", County = "Innlandet" },
            new Municipality { Id = Gjovik, Name = "Gjøvik", County = "Innlandet" },
            new Municipality { Id = Ringsaker, Name = "Ringsaker", County = "Innlandet" },
            new Municipality { Id = Stange, Name = "Stange", County = "Innlandet" },
            new Municipality { Id = Loten, Name = "Løten", County = "Innlandet" },
            new Municipality { Id = Elverum, Name = "Elverum", County = "Innlandet" },
            new Municipality { Id = Oslo, Name = "Oslo", County = "Oslo" });

        modelBuilder.Entity<Category>().HasData(Categories.All);
        modelBuilder.Entity<CategoryTranslation>().HasData(Categories.Translations);

        modelBuilder.Entity<Resource>().HasData(
            new Resource
            {
                Id = 1,
                Name = "Hjelpetelefonen (Mental Helse)",
                IsNational = true,
                MunicipalityId = null,
                Phone = "116 123",
                Website = "https://mentalhelse.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 2,
                Name = "Kirkens SOS",
                IsNational = true,
                MunicipalityId = null,
                Phone = "22 40 00 40",
                Website = "https://www.kirkens-sos.no",
                ChatUrl = "https://www.soschat.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 3,
                Name = "Legevakt",
                IsNational = true,
                MunicipalityId = null,
                Phone = "116 117",
                Website = "https://www.helsenorge.no/legevakt/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 4,
                Name = "Alarmtelefonen for barn og unge",
                IsNational = true,
                MunicipalityId = null,
                Phone = "116 111",
                Website = "https://www.116111.no",
                ChatUrl = "https://www.116111.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 5,
                Name = "VO-linjen",
                IsNational = true,
                MunicipalityId = null,
                Phone = "116 006",
                Website = "https://www.volinjen.no",
                ChatUrl = "https://www.volinjen.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 6,
                Name = "Navs økonomi- og gjeldsveiledningstelefon",
                IsNational = true,
                MunicipalityId = null,
                Phone = "55 55 33 39",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 7,
                Name = "Jussbuss",
                IsNational = true,
                MunicipalityId = null,
                Phone = "22 84 29 00",
                Website = "https://foreninger.uio.no/jussbuss/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 8,
                Name = "Rustelefonen",
                IsNational = true,
                MunicipalityId = null,
                Phone = "915 08 588",
                Website = "https://rustelefonen.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 9,
                Name = "Arbeidslivstelefonen (Mental Helse)",
                IsNational = true,
                MunicipalityId = null,
                Phone = "116 123",
                Website = "https://mentalhelse.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 10,
                Name = "Familievernkontoret Innlandet Øst, avdeling Hamar",
                MunicipalityId = Hamar,
                Address = "Vangsvegen 121, 2318 Hamar",
                Phone = "466 17 130",
                Website = "https://www.bufdir.no/familie/familievernkontorer/oversikt/innlandet-ost/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 11,
                Name = "Nav Hamar",
                MunicipalityId = Hamar,
                Address = "Torggata 63, 2317 Hamar",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 12,
                Name = "Hamar interkommunale krisesenter",
                MunicipalityId = Hamar,
                Address = "Kronborgveien 23, 2318 Hamar",
                Phone = "62 56 18 30",
                Website = "https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/krisesenter/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 13,
                Name = "Tjeneste psykisk helse og rus, Hamar kommune",
                MunicipalityId = Hamar,
                Address = "Vangsvegen 121, 2318 Hamar",
                Phone = "916 03 327",
                Website = "https://www.hamar.kommune.no/helseogomsorg/psykisk-helse-og-rus/tjeneste-psykisk-helse-og-rus/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 14,
                Name = "Ringsaker interkommunale barnevernvakt",
                MunicipalityId = Hamar,
                Phone = "404 04 015",
                Website = "https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/hjelpetelefoner-for-familier-og-barn-unge/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 15,
                Name = "Rask psykisk helsehjelp, Lillehammer kommune",
                MunicipalityId = Lillehammer,
                Phone = "917 13 338",
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/rask-psykisk-helsehjelp/informasjon-om-rask-psykisk-helsehjelp/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 16,
                Name = "Gudbrandsdal Krisesenter IKS",
                MunicipalityId = Lillehammer,
                Address = "Skoletorget 6 D, 2609 Lillehammer",
                Phone = "414 81 220",
                Website = "https://gudbrandsdal-krisesenter.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 17,
                Name = "Housing First, Lillehammer kommune",
                MunicipalityId = Lillehammer,
                Phone = "451 64 131",
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/om-psykisk-helse-og-rus/kontaktinformasjon/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 18,
                Name = "Oppfølgingsteamet, Lillehammer kommune",
                MunicipalityId = Lillehammer,
                Phone = "902 43 733",
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/om-psykisk-helse-og-rus/kontaktinformasjon/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 19,
                Name = "Mottak for seksuelle overgrep, Lillehammer",
                MunicipalityId = Lillehammer,
                Phone = "61 27 22 16",
                Website = "https://lillehammer.kommune.no/om-kommunen/kontakt-oss/nod-og-vakttelefoner/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 20,
                Name = "Nav Gjøvik",
                MunicipalityId = Gjovik,
                Address = "Parkgata 10 A, 2815 Gjøvik",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 21,
                Name = "Gjøvik Krisesenter IKS",
                MunicipalityId = Gjovik,
                // Address deliberately withheld — the centre gives its visiting address only on
                // contact, for safety. See docs/seed-data.md row 21's Notes. Not missing data.
                Address = null,
                Phone = "61 17 55 60",
                Website = "https://www.krisesenteret-gjovik.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 22,
                Name = "Jobbhus Gjøvik",
                MunicipalityId = Gjovik,
                Website = "https://www.gjovik.kommune.no/jobbhus/jeg-onsker-jobb/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            });

        modelBuilder.Entity<ResourceTranslation>().HasData(
            new ResourceTranslation
            {
                Id = 1,
                ResourceId = 1,
                LanguageCode = "nb",
                Description = "Gratis og døgnåpen telefontjeneste for alle som trenger noen å snakke med om det som er vanskelig. Du kan være anonym, og de som svarer har taushetsplikt.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 2,
                ResourceId = 1,
                LanguageCode = "en",
                Description = "A free 24-hour phone line for anyone who needs someone to talk to about what is difficult. You can stay anonymous, and everyone who answers is bound by confidentiality.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 3,
                ResourceId = 2,
                LanguageCode = "nb",
                Description = "Døgnåpen krisetelefon for deg som har det vanskelig eller tenker på selvmord. Tjenesten er anonym, og du trenger ikke ha en bestemt grunn for å ringe.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 4,
                ResourceId = 2,
                LanguageCode = "en",
                Description = "A 24-hour crisis line for anyone in distress or having thoughts of suicide. The service is anonymous, and you do not need a particular reason to call.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 5,
                ResourceId = 3,
                LanguageCode = "nb",
                Description = "Nasjonalt nummer som setter deg over til legevaktsentralen der du befinner deg, når fastlegen er stengt og du trenger hjelp raskt. Ved akutt livsfare skal du ringe 113.",
            },
            new ResourceTranslation
            {
                Id = 6,
                ResourceId = 3,
                LanguageCode = "en",
                Description = "A national number that connects you to the out-of-hours medical service where you are, when your regular doctor is closed and you need help quickly. In a life-threatening emergency, call 113 instead.",
            },
            new ResourceTranslation
            {
                Id = 7,
                ResourceId = 4,
                LanguageCode = "nb",
                Description = "Gratis døgnåpen telefon for barn og unge som opplever vold, overgrep eller omsorgssvikt. Voksne som er bekymret for et barn kan også ringe.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 8,
                ResourceId = 4,
                LanguageCode = "en",
                Description = "A free 24-hour phone line for children and young people experiencing violence, abuse or neglect. Adults who are worried about a child can call too.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 9,
                ResourceId = 5,
                LanguageCode = "nb",
                Description = "Hjelpelinje for deg som opplever vold eller overgrep i nære relasjoner. Også for pårørende og hjelpere, og du kan være helt anonym.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 10,
                ResourceId = 5,
                LanguageCode = "en",
                Description = "A helpline for anyone experiencing violence or abuse in a close relationship. It is also for relatives and professionals, and you can remain completely anonymous.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 11,
                ResourceId = 6,
                LanguageCode = "nb",
                Description = "Gratis veiledning for deg som har økonomiske problemer eller gjeld du ikke klarer å betjene. Du kan få hjelp til å få oversikt over økonomien og sette opp et realistisk budsjett.",
                OpeningHours = "Hverdager 09:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 12,
                ResourceId = 6,
                LanguageCode = "en",
                Description = "Free guidance for anyone with money problems or debt they cannot manage. You can get help mapping out your finances and building a budget you can actually live with.",
                OpeningHours = "Weekdays 09:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 13,
                ResourceId = 7,
                LanguageCode = "nb",
                Description = "Gratis rettshjelp fra jusstudenter i saker om blant annet husleie, gjeld, trygd, arbeid, utlendingsrett og fengsel. Du trenger ikke advokat for å ta kontakt.",
                OpeningHours = "Mandag 17:00–20:00 og tirsdag 10:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 14,
                ResourceId = 7,
                LanguageCode = "en",
                Description = "Free legal aid from law students in areas such as rent, debt, benefits, employment, immigration and prison law. You do not need a lawyer to get in touch.",
                OpeningHours = "Monday 17:00–20:00 and Tuesday 10:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 15,
                ResourceId = 8,
                LanguageCode = "nb",
                Description = "Anonym telefontjeneste for spørsmål om rus, både for deg som bruker rusmidler selv og for pårørende. Du får informasjon og veiledning uten å bli møtt med pekefinger. Kortnummeret 08588 brukes også for tjenesten.",
                OpeningHours = "Hverdager 11:00–14:30 og 15:00–18:00",
            },
            new ResourceTranslation
            {
                Id = 16,
                ResourceId = 8,
                LanguageCode = "en",
                Description = "An anonymous phone service for questions about drugs and alcohol, both for people who use substances and for their families. You get information and guidance without being judged. The short code 08588 is also used for the service.",
                OpeningHours = "Weekdays 11:00–14:30 and 15:00–18:00",
            },
            new ResourceTranslation
            {
                Id = 17,
                ResourceId = 9,
                LanguageCode = "nb",
                Description = "Rådgivning om vanskelige forhold på jobben, som konflikt, mobbing, sykefravær eller oppsigelse. Åpen for arbeidstakere, ledere, tillitsvalgte og arbeidssøkere. Velg tast 3 i menyen.",
            },
            new ResourceTranslation
            {
                Id = 18,
                ResourceId = 9,
                LanguageCode = "en",
                Description = "Advice about difficult situations at work, such as conflict, bullying, sick leave or dismissal. Open to employees, managers, union representatives and jobseekers. Choose option 3 in the menu.",
            },
            new ResourceTranslation
            {
                Id = 19,
                ResourceId = 10,
                LanguageCode = "nb",
                Description = "Gratis tilbud om samtale, parterapi og mekling for familier, par og enkeltpersoner. Du trenger ingen henvisning for å bestille time.",
                OpeningHours = "08:30–15:00, redusert om sommeren",
            },
            new ResourceTranslation
            {
                Id = 20,
                ResourceId = 10,
                LanguageCode = "en",
                Description = "A free service offering counselling, couples therapy and mediation for families, couples and individuals. No referral is needed to book an appointment.",
                OpeningHours = "08:30–15:00, reduced in summer",
            },
            new ResourceTranslation
            {
                Id = 21,
                ResourceId = 11,
                LanguageCode = "nb",
                Description = "Nav-kontoret for innbyggere i Hamar, med hjelp til økonomisk sosialhjelp, arbeid og andre sosiale tjenester. Du kan møte opp uten avtale i drop-in-tiden, eller avtale time på forhånd.",
                OpeningHours = "Drop-in mandag og onsdag 12:00–14:00, fredag 10:00–12:00",
            },
            new ResourceTranslation
            {
                Id = 22,
                ResourceId = 11,
                LanguageCode = "en",
                Description = "The Nav office for people living in Hamar, offering help with financial assistance, work and other social services. You can come without an appointment during drop-in hours, or book a time in advance.",
                OpeningHours = "Drop-in Monday and Wednesday 12:00–14:00, Friday 10:00–12:00",
            },
            new ResourceTranslation
            {
                Id = 23,
                ResourceId = 12,
                LanguageCode = "nb",
                Description = "Gratis døgnåpent tilbud til kvinner, menn, barn og eldre som er utsatt for vold i nære relasjoner. Senteret tilbyr både beskyttet botilbud og samtaler for dem som ikke trenger å bo der.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 24,
                ResourceId = 12,
                LanguageCode = "en",
                Description = "A free 24-hour service for women, men, children and older people affected by violence in close relationships. The centre offers both protected accommodation and counselling for those who do not need to stay.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 25,
                ResourceId = 13,
                LanguageCode = "nb",
                Description = "Kommunens tilbud til voksne med psykiske vansker eller rusproblemer, med samtaler, oppfølging og praktisk hjelp i hverdagen. Du kan ta kontakt selv, uten henvisning fra lege.",
                OpeningHours = "Kun dagtid",
            },
            new ResourceTranslation
            {
                Id = 26,
                ResourceId = 13,
                LanguageCode = "en",
                Description = "The municipality's service for adults with mental health or substance use difficulties, offering counselling, follow-up and practical everyday support. You can make contact yourself, without a doctor's referral.",
                OpeningHours = "Daytime only",
            },
            new ResourceTranslation
            {
                Id = 27,
                ResourceId = 14,
                LanguageCode = "nb",
                Description = "Barnevernets akuttberedskap på kveld, natt, helg og helligdager for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret kan ringe.",
                OpeningHours = "Kveld og natt 15:30–08:00, samt helger og helligdager",
            },
            new ResourceTranslation
            {
                Id = 28,
                ResourceId = 14,
                LanguageCode = "en",
                Description = "The child welfare emergency service, staffed evenings, nights, weekends and public holidays for children and young people in urgent situations. Both children themselves and worried adults can call.",
                OpeningHours = "Evenings and nights 15:30–08:00 plus weekends and holidays",
            },
            new ResourceTranslation
            {
                Id = 29,
                ResourceId = 15,
                LanguageCode = "nb",
                Description = "Korttidsbehandling for deg fra 16 år med lettere angst, depresjon, søvnvansker eller begynnende rusproblemer. Tilbudet er gratis, og du trenger ikke henvisning fra fastlegen.",
                OpeningHours = "Mandag og onsdag 11:30–13:00",
            },
            new ResourceTranslation
            {
                Id = 30,
                ResourceId = 15,
                LanguageCode = "en",
                Description = "Short-term treatment for people aged 16 and over with mild anxiety, depression, sleep problems or early substance use difficulties. The service is free and needs no referral from your doctor.",
                OpeningHours = "Monday and Wednesday 11:30–13:00",
            },
            new ResourceTranslation
            {
                Id = 31,
                ResourceId = 16,
                LanguageCode = "nb",
                Description = "Krisesenter for kvinner, menn og barn som er utsatt for vold eller trusler om vold i nære relasjoner. Tilbudet er gratis, og du trenger ingen henvisning.",
            },
            new ResourceTranslation
            {
                Id = 32,
                ResourceId = 16,
                LanguageCode = "en",
                Description = "A crisis centre for women, men and children affected by violence or threats of violence in close relationships. The service is free and needs no referral.",
            },
            new ResourceTranslation
            {
                Id = 33,
                ResourceId = 17,
                LanguageCode = "nb",
                Description = "Tilbud til bostedsløse med rus- eller psykiske helseutfordringer, der du først får en varig bolig og deretter oppfølging der du bor. Målet er en stabil bosituasjon uten krav om rusfrihet på forhånd.",
                OpeningHours = "Hverdager 09:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 34,
                ResourceId = 17,
                LanguageCode = "en",
                Description = "A service for homeless people with substance use or mental health difficulties, where you first get permanent housing and then receive support where you live. The aim is a stable home without requiring sobriety first.",
                OpeningHours = "Weekdays 09:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 35,
                ResourceId = 18,
                LanguageCode = "nb",
                Description = "Team som gir tett oppfølging til voksne med rusproblemer eller psykiske helseutfordringer i hverdagen. Teamet har lang åpningstid, også i helgene.",
                OpeningHours = "Hver dag 09:00–21:00",
            },
            new ResourceTranslation
            {
                Id = 36,
                ResourceId = 18,
                LanguageCode = "en",
                Description = "A team providing close everyday follow-up for adults with substance use or mental health difficulties. The team has long opening hours, including weekends.",
                OpeningHours = "Every day 09:00–21:00",
            },
            new ResourceTranslation
            {
                Id = 37,
                ResourceId = 19,
                LanguageCode = "nb",
                Description = "Medisinsk hjelp, undersøkelse og sporsikring for deg som har vært utsatt for voldtekt eller seksuelt overgrep. Du kan ta kontakt uten å ha anmeldt forholdet til politiet.",
            },
            new ResourceTranslation
            {
                Id = 38,
                ResourceId = 19,
                LanguageCode = "en",
                Description = "Medical care, examination and forensic evidence collection for people who have experienced rape or sexual assault. You can get in touch without having reported it to the police.",
            },
            new ResourceTranslation
            {
                Id = 39,
                ResourceId = 20,
                LanguageCode = "nb",
                Description = "Nav-kontoret for innbyggere i Gjøvik, med oppfølging innen økonomi, arbeid, bolig og sosiale tjenester. Du kan komme innom i drop-in-tiden eller avtale time.",
                OpeningHours = "Hverdager 09:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 40,
                ResourceId = 20,
                LanguageCode = "en",
                Description = "The Nav office for people living in Gjøvik, offering support with money, work, housing and social services. You can drop in during open hours or book an appointment.",
                OpeningHours = "Weekdays 09:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 41,
                ResourceId = 21,
                LanguageCode = "nb",
                Description = "Gratis døgnåpent tilbud til kvinner, menn og barn som er utsatt for vold i nære relasjoner, voldtekt eller tvangsekteskap. Adressen oppgis først når du tar kontakt, av hensyn til sikkerheten.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 42,
                ResourceId = 21,
                LanguageCode = "en",
                Description = "A free 24-hour service for women, men and children affected by violence in close relationships, rape or forced marriage. The address is only given when you make contact, for safety reasons.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 43,
                ResourceId = 22,
                LanguageCode = "nb",
                Description = "Hjelp til å komme i arbeid for deg mellom 16 og 30 år i Gjøvik, med veiledning, jobbsøking, CV og arbeidspraksis. Drop-in-tilbudet er åpent for alle arbeidssøkere uansett alder og bosted.",
            },
            new ResourceTranslation
            {
                Id = 44,
                ResourceId = 22,
                LanguageCode = "en",
                Description = "Help getting into work for people aged 16 to 30 in Gjøvik, with guidance, job applications, CV writing and work placements. The drop-in service is open to all jobseekers regardless of age or where they live.",
            });

        modelBuilder.Entity<ResourceCategory>().HasData(
            new ResourceCategory { ResourceId = 1, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 2, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 3, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 3, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 4, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 4, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 4, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 5, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 5, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 6, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 7, CategoryId = Categories.JuridiskHjelp },
            new ResourceCategory { ResourceId = 8, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 9, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 9, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 10, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 11, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 11, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 12, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 12, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 12, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 13, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 13, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 14, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 14, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 14, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 15, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 15, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 16, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 16, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 17, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 17, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 18, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 18, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 19, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 19, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 20, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 20, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 20, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 21, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 21, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 22, CategoryId = Categories.Arbeid });
    }
}

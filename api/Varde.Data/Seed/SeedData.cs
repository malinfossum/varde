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
/// Batch 9a seeded rows 1–22: nine categories, all eight municipalities, and the 22 core
/// services. This batch (9b) adds rows 101–122 from docs/seed-data-innlandet-ring.md — the
/// Innlandet ring services — plus the ResourceMunicipality coverage joins that file's
/// "## Coverage map" section records for existing rows 12 and 14, and for new row 118. Only
/// non-national resources ever get coverage rows; IsNational already covers every municipality.
/// docs/seed-data-oslo.md's rows 201+ arrive in batch 9c.
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

    // Row 118 (Nok. Hamar) was re-verified 2026-08-17, a source-hierarchy re-check that landed
    // after the rest of the ring batch — see docs/seed-data-innlandet-ring.md row 118's Notes.
    private static readonly DateOnly VerifiedRow118 = new(2026, 8, 17);

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
                Website = "https://www.hamar.kommune.no/helseogomsorg/psykisk-helse-og-rus/",
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
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/",
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
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/",
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
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/",
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
            },
            new Resource
            {
                Id = 101,
                Name = "Nav Ringsaker",
                MunicipalityId = Ringsaker,
                // Besøksadresse conflicts between the kommune page ("Nordåsvegen 4, Brumunddal")
                // and nav.no ("Nordåsvegen 4, 2382 BRUMUNDDAL"); nav.no is the NAV office's own
                // page, so it wins per the file's source-hierarchy policy (same precedent as row
                // 113's postcode).
                Address = "Nordåsvegen 4, 2382 Brumunddal",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no/kontor/nav-ringsaker",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 102,
                Name = "Psykisk helse- og rustjenester, Ringsaker kommune",
                MunicipalityId = Ringsaker,
                Address = "Brugata 3, 2380 Brumunddal",
                Email = "postmottak.psykisk.helse@ringsaker.kommune.no",
                Phone = "62 33 52 20",
                Website = "https://www.ringsaker.kommune.no/tjenester/helse-og-omsorg/psykisk-helse-og-rustjenester",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 103,
                Name = "Barneverntjenesten i Ringsaker",
                MunicipalityId = Ringsaker,
                Address = "Administrasjonsbygget, Furnesvegen 28, 2382 Brumunddal",
                // Digits confirmed identical to Ringsaker's own vakttelefon-list grouping
                // ("474 72 787"); kept as the cited source page prints it per the row's
                // 2026-08-17 resolution rather than the standard mobile regrouping.
                Phone = "47 47 27 87",
                Website = "https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 104,
                Name = "Nav Stange",
                MunicipalityId = Stange,
                Address = "Storgata 43, 2335 Stange",
                Email = "nav.stange@nav.no",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no/kontor/nav-stange",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 105,
                Name = "Stangehjelpa (avdeling for psykisk helse og rus), Stange kommune",
                MunicipalityId = Stange,
                Phone = "62 56 23 00",
                Website = "https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/stangehjelpa/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 106,
                Name = "Psykososial krisehjelp, Stange kommune",
                MunicipalityId = Stange,
                Phone = "908 05 567",
                Website = "https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/psykososial-krisehjelp/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 107,
                Name = "Barneverntjenesten i Stange",
                MunicipalityId = Stange,
                Phone = "905 42 305",
                Website = "https://www.stange.kommune.no/helse-og-mestring/barn-unge-og-familie/barnevern/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 108,
                Name = "Nav Løten",
                MunicipalityId = Loten,
                Address = "Kildevegen 1, 2340 Løten",
                Email = "nav.loten@nav.no",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no/kontor/nav-loten",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 109,
                Name = "Økonomisk rådgivning, Nav Løten",
                MunicipalityId = Loten,
                Phone = "55 55 33 33",
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/sosiale-tjenester-og-nav/okonomisk-radgivning/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 110,
                Name = "Psykisk helse og rus-teamet (ROP-team), Løten kommune",
                MunicipalityId = Loten,
                Phone = "904 74 982",
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/psykisk-helse-og-rus-kategori/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 111,
                Name = "Barnevernet i Løten",
                MunicipalityId = Loten,
                Phone = "948 70 878",
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/barn-unge-og-familie/barnevern/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 112,
                Name = "Rask psykisk helsehjelp (RPH), Løten kommune",
                MunicipalityId = Loten,
                Address = "Kildevegen 1, 2340 Løten",
                // Phone deliberately empty — the only numbers on the page sit under two
                // therapists' first names, not a service line. Malin's 2026-08-17 decision.
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/rask-psykisk-helsehjelp-rph/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 113,
                Name = "Nav Elverum",
                MunicipalityId = Elverum,
                // nav.no's own postcode wins over the kommune page's "2406" per the row's
                // 2026-08-17 resolution (NAV's own source wins for a NAV office).
                Address = "St. Olavs gate 4, 2414 Elverum",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no/kontor/nav-elverum",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 114,
                Name = "Barneverntjenesten i Elverum",
                MunicipalityId = Elverum,
                Address = "Helsehuset, Kirkevegen 47, 2413 Elverum",
                Phone = "940 17 770",
                Website = "https://www.elverum.kommune.no/vare-tjenester/barnehage-og-skole/barnevern/kontakt-barnevernet/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 115,
                Name = "Lavterskel rus- og psykisk helsehjelp (Annekset og Grip), Elverum kommune",
                MunicipalityId = Elverum,
                Phone = "993 72 609",
                Website = "https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/lavterskel-rus-og-psykisk-helsehjelp/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 116,
                Name = "Ambulant akutt enhet (AAE), DPS Elverum-Hamar",
                MunicipalityId = Elverum,
                Phone = "915 06 200",
                Website = "https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/er-du-i-en-krisesituasjon-og-trenger-akutt-hjelp/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 117,
                Name = "Nok. Elverum Ressurssenter",
                MunicipalityId = Elverum,
                Address = "Storgata 10, 2408 Elverum",
                Email = "post@nokelverum.no",
                Phone = "971 59 810",
                Website = "https://www.nokelverum.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 118,
                Name = "Nok. Hamar",
                MunicipalityId = Hamar,
                Email = "post@nokhamar.no",
                Phone = "916 91 714",
                Website = "https://www.nokhamar.no",
                LastVerified = VerifiedRow118,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 119,
                Name = "Husbanken",
                IsNational = true,
                MunicipalityId = null,
                Email = "post@husbanken.no",
                Phone = "22 96 16 00",
                Website = "https://husbanken.no/person/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 120,
                Name = "Skatteetaten",
                IsNational = true,
                MunicipalityId = null,
                Phone = "800 80 000",
                Website = "https://www.skatteetaten.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 121,
                Name = "Kors på halsen (Røde Kors)",
                IsNational = true,
                MunicipalityId = null,
                Phone = "800 33 321",
                Website = "https://www.korspahalsen.no",
                ChatUrl = "https://www.korspahalsen.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 122,
                Name = "Sidetmedord (Mental Helse)",
                IsNational = true,
                MunicipalityId = null,
                Website = "https://sidetmedord.mentalhelse.no/",
                ChatUrl = "https://sidetmedord.mentalhelse.no/",
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
            },
            new ResourceTranslation
            {
                Id = 45,
                ResourceId = 101,
                LanguageCode = "nb",
                Description = "Nav-kontoret for innbyggere i Ringsaker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i drop-in-tiden, eller avtale time på forhånd.",
                OpeningHours = "Mandag 12.00-14.00, onsdag 12.00-14.00, fredag 10.00-12.00",
            },
            new ResourceTranslation
            {
                Id = 46,
                ResourceId = 101,
                LanguageCode = "en",
                Description = "The Nav office for people living in Ringsaker, offering help with financial assistance, work, housing and other social services. You can come without an appointment during drop-in hours, or book a time in advance.",
                OpeningHours = "Monday 12.00-14.00, Wednesday 12.00-14.00, Friday 10.00-12.00",
            },
            new ResourceTranslation
            {
                Id = 47,
                ResourceId = 102,
                LanguageCode = "nb",
                Description = "Kommunens tilbud til voksne med psykiske vansker eller rusproblemer, med samtaler, oppfølging og praktisk hjelp i hverdagen. Du kan få inntil fire samtaler uten henvisning.",
                OpeningHours = "Kan kontaktes i tidsrommet 08-15.30",
            },
            new ResourceTranslation
            {
                Id = 48,
                ResourceId = 102,
                LanguageCode = "en",
                Description = "The municipality's service for adults with mental health or substance use difficulties, offering counselling, follow-up and practical everyday support. You can have up to four conversations without a referral.",
                OpeningHours = "Reachable between 08.00 and 15.30",
            },
            new ResourceTranslation
            {
                Id = 49,
                ResourceId = 103,
                LanguageCode = "nb",
                Description = "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og gir hjelp til barn, unge og familier som har det vanskelig. Du kan ringe for å drøfte en bekymring før du melder.",
                OpeningHours = "Hverdager 08.00–15.30",
            },
            new ResourceTranslation
            {
                Id = 50,
                ResourceId = 103,
                LanguageCode = "en",
                Description = "The municipal child welfare service, which receives reports of concern and helps children, young people and families in difficulty. You can call to discuss a worry before making a formal report.",
                OpeningHours = "Weekdays 08.00–15.30",
            },
            new ResourceTranslation
            {
                Id = 51,
                ResourceId = 104,
                LanguageCode = "nb",
                Description = "Nav-kontoret for innbyggere i Stange, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Veiledningssenteret er åpent for selvbetjening, og du kan komme innom i drop-in-tiden.",
                OpeningHours = "Drop-in mandag, onsdag og fredag 10.00-12.00; selvbetjening hverdager 09.00-14.30",
            },
            new ResourceTranslation
            {
                Id = 52,
                ResourceId = 104,
                LanguageCode = "en",
                Description = "The Nav office for people living in Stange, offering help with financial assistance, work, housing and other social services. The guidance centre is open for self-service, and you can come by during drop-in hours.",
                OpeningHours = "Drop-in Monday, Wednesday and Friday 10.00-12.00; self-service weekdays 09.00-14.30",
            },
            new ResourceTranslation
            {
                Id = 53,
                ResourceId = 105,
                LanguageCode = "nb",
                Description = "Stange kommunes samlede lavterskeltilbud innen psykisk helse og rus, for både barn, unge og voksne. Du trenger ingen henvisning, og kan ta kontakt selv i telefontiden.",
                OpeningHours = "Telefontid hverdager 09.00-15.00 (stengt 11.00-11.45)",
            },
            new ResourceTranslation
            {
                Id = 54,
                ResourceId = 105,
                LanguageCode = "en",
                Description = "Stange municipality's combined low-threshold service for mental health and substance use, for children, young people and adults alike. No referral is needed, and you can get in touch yourself during phone hours.",
                OpeningHours = "Phone hours weekdays 09.00-15.00 (closed 11.00-11.45)",
            },
            new ResourceTranslation
            {
                Id = 55,
                ResourceId = 106,
                LanguageCode = "nb",
                Description = "Kommunens telefon for deg som står i en akutt psykisk krise og trenger noen å snakke med nå. På dagtid settes du over til Stangehjelpa, og i helgene til det interkommunale kriseteamet.",
                OpeningHours = "Hverdager til 15.30 (16.00 fredag) settes over til Stangehjelpa",
            },
            new ResourceTranslation
            {
                Id = 56,
                ResourceId = 106,
                LanguageCode = "en",
                Description = "The municipality's line for anyone in an acute mental health crisis who needs to talk to someone now. During the day you are put through to Stangehjelpa, and at weekends to the intermunicipal crisis team.",
                OpeningHours = "Weekdays until 15.30 (16.00 on Fridays) the call goes through to Stangehjelpa",
            },
            new ResourceTranslation
            {
                Id = 57,
                ResourceId = 107,
                LanguageCode = "nb",
                Description = "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og følger opp barn, unge og familier. Vakttelefonen er bemannet på dagtid i ukedagene.",
                OpeningHours = "Vakttelefon mandag–fredag 08.30–15.30",
            },
            new ResourceTranslation
            {
                Id = 58,
                ResourceId = 107,
                LanguageCode = "en",
                Description = "The municipal child welfare service, which receives reports of concern and follows up children, young people and families. The duty phone is staffed during weekday daytime hours.",
                OpeningHours = "Duty phone Monday–Friday 08.30–15.30",
            },
            new ResourceTranslation
            {
                Id = 59,
                ResourceId = 108,
                LanguageCode = "nb",
                // OpeningHours deliberately null: the row's table cell was cleared by the
                // 2026-08-17 resolution ("omit the selvbetjening/drop-in detail entirely" —
                // an unresolvable conflict between the kommune page and nav.no). The doc's
                // Descriptions section still carries the old hours text; the dated per-row
                // resolution is treated as authoritative over it. Flagged in the task report.
                Description = "Nav-kontoret for innbyggere i Løten, med hjelp til arbeid, økonomisk sosialhjelp, bolig og forvaltning av egen økonomi. Veiledningssenteret har PC-er du kan bruke, og du kan avtale time med en veileder.",
            },
            new ResourceTranslation
            {
                Id = 60,
                ResourceId = 108,
                LanguageCode = "en",
                Description = "The Nav office for people living in Løten, offering help with work, financial assistance, housing and managing your own money. The guidance centre has computers you can use, and you can book a meeting with an adviser.",
            },
            new ResourceTranslation
            {
                Id = 61,
                ResourceId = 109,
                LanguageCode = "nb",
                Description = "Gratis økonomisk rådgivning for deg som sliter med gjeld eller ikke får budsjettet til å gå opp. Rådgiveren hjelper deg med å få oversikt og ser på muligheter som refinansiering eller gjeldsordning.",
                OpeningHours = "Mandag, onsdag og fredag 09.00 – 15.00; tirsdag og torsdag 09.00 – 13.00",
            },
            new ResourceTranslation
            {
                Id = 62,
                ResourceId = 109,
                LanguageCode = "en",
                Description = "Free financial counselling for anyone struggling with debt or unable to make the budget add up. The adviser helps you get an overview and looks at options such as refinancing or a debt settlement.",
                OpeningHours = "Monday, Wednesday and Friday 09.00 – 15.00; Tuesday and Thursday 09.00 – 13.00",
            },
            new ResourceTranslation
            {
                Id = 63,
                ResourceId = 110,
                LanguageCode = "nb",
                Description = "Kommunens team for voksne med psykiske vansker, rusproblemer eller begge deler. Krisetelefonen er åpen på dagtid i ukedagene, og bemannes av teamet selv.",
                OpeningHours = "Krisetelefon mandag – fredag kl. 08.00-15.00",
            },
            new ResourceTranslation
            {
                Id = 64,
                ResourceId = 110,
                LanguageCode = "en",
                Description = "The municipality's team for adults with mental health difficulties, substance use problems or both. The crisis line is open during weekday daytime hours and is staffed by the team itself.",
                OpeningHours = "Crisis line Monday – Friday 08.00-15.00",
            },
            new ResourceTranslation
            {
                Id = 65,
                ResourceId = 111,
                LanguageCode = "nb",
                Description = "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og gir hjelp til barn, unge og familier. Resepsjonen kan svare på spørsmål og sette deg i kontakt med rett person.",
                OpeningHours = "Mandag - fredag kl. 08:00-15:30",
            },
            new ResourceTranslation
            {
                Id = 66,
                ResourceId = 111,
                LanguageCode = "en",
                Description = "The municipal child welfare service, which receives reports of concern and helps children, young people and families. Reception can answer questions and put you through to the right person.",
                OpeningHours = "Monday - Friday 08:00-15:30",
            },
            new ResourceTranslation
            {
                Id = 67,
                ResourceId = 112,
                LanguageCode = "nb",
                Description = "Gratis korttidsbehandling for deg fra 16 år med lettere angst, nedstemthet, stress eller søvnvansker. Hjelpen gis ofte over telefon, med veiledet selvhjelp, og du trenger ingen henvisning.",
                OpeningHours = "kl. 08.00-15.30",
            },
            new ResourceTranslation
            {
                Id = 68,
                ResourceId = 112,
                LanguageCode = "en",
                Description = "Free short-term treatment for people aged 16 and over with mild anxiety, low mood, stress or sleep problems. Help is often given by phone, using guided self-help, and no referral is needed.",
                OpeningHours = "08.00-15.30",
            },
            new ResourceTranslation
            {
                Id = 69,
                ResourceId = 113,
                LanguageCode = "nb",
                Description = "Nav-kontoret for innbyggere i Elverum, med hjelp til arbeid, økonomisk sosialhjelp, bolig og sosiale tjenester. Er du i en krisesituasjon uten penger til mat, medisin eller strøm, skal du ta kontakt med en gang. Merk: mottaket er midlertidig stengt for ombygging (ca. 12 uker fra 3. august 2026) — ring eller bruk nav.no i denne perioden.",
                OpeningHours = "Telefontid hverdager kl. 09 - 15",
            },
            new ResourceTranslation
            {
                Id = 70,
                ResourceId = 113,
                LanguageCode = "en",
                Description = "The Nav office for people living in Elverum, offering help with work, financial assistance, housing and social services. If you are in a crisis with no money for food, medicine or electricity, get in touch straight away. Note: the reception is temporarily closed for renovation (about 12 weeks from 3 August 2026) — call or use nav.no during this period.",
                OpeningHours = "Phone hours weekdays 09.00 - 15.00",
            },
            new ResourceTranslation
            {
                Id = 71,
                ResourceId = 114,
                LanguageCode = "nb",
                Description = "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og følger opp barn, unge og familier som trenger hjelp. Både barn selv og voksne som er bekymret kan ta kontakt.",
                OpeningHours = "Mandag - fredag kl. 08 - 15",
            },
            new ResourceTranslation
            {
                Id = 72,
                ResourceId = 114,
                LanguageCode = "en",
                Description = "The municipal child welfare service, which receives reports of concern and follows up children, young people and families who need help. Both children themselves and worried adults can get in touch.",
                OpeningHours = "Monday - Friday 08.00 - 15.00",
            },
            new ResourceTranslation
            {
                Id = 73,
                ResourceId = 115,
                LanguageCode = "nb",
                Description = "Kommunens lavterskeltilbud til voksne med rusproblemer eller psykiske helseutfordringer, med samtaler og oppfølging. Tilbudet er gratis, og du kan ta kontakt selv.",
            },
            new ResourceTranslation
            {
                Id = 74,
                ResourceId = 115,
                LanguageCode = "en",
                Description = "The municipality's low-threshold service for adults with substance use or mental health difficulties, offering conversations and follow-up. The service is free and you can make contact yourself.",
            },
            new ResourceTranslation
            {
                Id = 75,
                ResourceId = 116,
                LanguageCode = "nb",
                Description = "Akutteam i spesialisthelsetjenesten for deg som står i en alvorlig psykisk krise og trenger rask vurdering. Teamet kan komme til deg, og er tilgjengelig på dagtid i ukedagene.",
                OpeningHours = "Mandag – fredag kl. 07.30 - 15.30",
            },
            new ResourceTranslation
            {
                Id = 76,
                ResourceId = 116,
                LanguageCode = "en",
                Description = "An acute team within the specialist health service for people in a serious mental health crisis who need a rapid assessment. The team can come to you and is available during weekday daytime hours.",
                OpeningHours = "Monday – Friday 07.30 - 15.30",
            },
            new ResourceTranslation
            {
                Id = 77,
                ResourceId = 117,
                LanguageCode = "nb",
                Description = "Ressurssenter for deg som har opplevd seksuelle overgrep, og for pårørende. Du kan få samtaler og støtte gratis, uten henvisning og uten å ha anmeldt forholdet.",
            },
            new ResourceTranslation
            {
                Id = 78,
                ResourceId = 117,
                LanguageCode = "en",
                Description = "A resource centre for people who have experienced sexual abuse, and for their relatives. You can get conversations and support free of charge, without a referral and without having reported it.",
            },
            new ResourceTranslation
            {
                Id = 79,
                ResourceId = 118,
                LanguageCode = "nb",
                Description = "Ressurssenter for deg som har opplevd seksuelle overgrep eller incest, og for pårørende. Tilbudet er gratis, og du trenger ingen henvisning.",
            },
            new ResourceTranslation
            {
                Id = 80,
                ResourceId = 118,
                LanguageCode = "en",
                Description = "A resource centre for people who have experienced sexual abuse or incest, and for their relatives. The service is free and no referral is needed.",
            },
            new ResourceTranslation
            {
                Id = 81,
                ResourceId = 119,
                LanguageCode = "nb",
                Description = "Statens virkemiddel i boligpolitikken, med bostøtte til deg som har lav inntekt og høye boutgifter, og startlån og tilskudd til å kjøpe eller beholde bolig. Startlån søker du om gjennom kommunen din.",
                OpeningHours = "Mandag - fredag, kl. 08.00 - 15.45 (15. september - 14. mai); mandag - fredag, kl. 08.00 - 15.00 (15. mai - 14. september)",
            },
            new ResourceTranslation
            {
                Id = 82,
                ResourceId = 119,
                LanguageCode = "en",
                Description = "The state housing bank, with housing benefit for people on low incomes with high housing costs, and start-up loans and grants to buy or keep a home. Start-up loans are applied for through your municipality.",
                OpeningHours = "Monday - Friday 08.00 - 15.45 (15 September - 14 May); Monday - Friday 08.00 - 15.00 (15 May - 14 September)",
            },
            new ResourceTranslation
            {
                Id = 83,
                ResourceId = 120,
                LanguageCode = "nb",
                Description = "Statlig etat med ansvar for skatt, skattemelding og Folkeregisteret. Hit henvender du deg om skattekort, restskatt, flytting, navneendring og attester fra folkeregisteret.",
                OpeningHours = "Åpningstiden vår er 09:00–14:30 alle hverdager",
            },
            new ResourceTranslation
            {
                Id = 84,
                ResourceId = 120,
                LanguageCode = "en",
                Description = "The national tax administration, responsible for tax, tax returns and the National Population Register. Contact them about tax cards, underpaid tax, changes of address, name changes and registry certificates.",
                OpeningHours = "Open 09:00–14:30 every weekday",
            },
            new ResourceTranslation
            {
                Id = 85,
                ResourceId = 121,
                LanguageCode = "nb",
                Description = "Gratis og anonymt samtaletilbud for barn og unge under 18 år, på telefon, chat og e-post. Du kan snakke med en voksen om akkurat det du har på hjertet, uansett hvor stort eller lite det er.",
                OpeningHours = "Åpent alle dager, hele året, kl. 14-22 (jule- og sommerferie 16-22)",
            },
            new ResourceTranslation
            {
                Id = 86,
                ResourceId = 121,
                LanguageCode = "en",
                Description = "A free and anonymous talking service for children and young people under 18, by phone, chat and email. You can talk to an adult about whatever is on your mind, however big or small.",
                OpeningHours = "Open every day, all year, 14.00-22.00 (16.00-22.00 during the Christmas and summer holidays)",
            },
            new ResourceTranslation
            {
                Id = 87,
                ResourceId = 122,
                LanguageCode = "nb",
                Description = "Mental Helses nettsted der du kan skrive anonymt om det som er vanskelig, i chat eller i forum. Du kan lese om temaer som ensomhet, angst, depresjon og økonomi, og få svar fra andre.",
            },
            new ResourceTranslation
            {
                Id = 88,
                ResourceId = 122,
                LanguageCode = "en",
                Description = "Mental Helse's website where you can write anonymously about what is difficult, in chat or on the forum. You can read about topics such as loneliness, anxiety, depression and money, and get replies from others.",
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
            new ResourceCategory { ResourceId = 22, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 101, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 101, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 101, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 102, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 102, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 103, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 104, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 104, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 104, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 105, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 105, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 106, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 107, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 108, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 108, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 108, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 109, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 110, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 110, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 111, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 112, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 113, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 113, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 113, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 114, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 115, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 115, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 116, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 117, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 118, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 119, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 119, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 120, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 121, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 121, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 122, CategoryId = Categories.PsykiskHelse });

        // Coverage joins from docs/seed-data-innlandet-ring.md's "## Coverage map" section, for
        // non-national resources only. National resources (rows 1, 2, 3, 4, 5, 6, 8, 9, 119, 120,
        // 121, 122) are never joined here — IsNational already puts them in every municipality's
        // results, so a coverage row would be redundant at best and double them up at worst.
        modelBuilder.Entity<ResourceMunicipality>().HasData(
            // Row 12 — Hamar interkommunale krisesenter. The kommune's own page states it serves
            // "innbyggerne i Hamar, Ringsaker, Løten, Stange, Elverum, Engerdal, Våler, Trysil og
            // Åmot kommune" — only the four ring kommuner already in this database are joined.
            new ResourceMunicipality { ResourceId = 12, MunicipalityId = Ringsaker },
            new ResourceMunicipality { ResourceId = 12, MunicipalityId = Stange },
            new ResourceMunicipality { ResourceId = 12, MunicipalityId = Loten },
            new ResourceMunicipality { ResourceId = 12, MunicipalityId = Elverum },
            // Row 14 — Ringsaker interkommunale barnevernvakt.
            new ResourceMunicipality { ResourceId = 14, MunicipalityId = Ringsaker },
            new ResourceMunicipality { ResourceId = 14, MunicipalityId = Stange },
            new ResourceMunicipality { ResourceId = 14, MunicipalityId = Loten },
            new ResourceMunicipality { ResourceId = 14, MunicipalityId = Elverum },
            // Row 118 — Nok. Hamar, per its own Serves cell (Løten kommune's kriseberedskap
            // page is the sole source for this coverage claim).
            new ResourceMunicipality { ResourceId = 118, MunicipalityId = Loten });
    }
}

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
/// services. Batch 9b added rows 101–122 from docs/seed-data-innlandet-ring.md — the
/// Innlandet ring services — plus the ResourceMunicipality coverage joins that file's
/// "## Coverage map" section records for existing rows 12 and 14, and for new row 118. Only
/// non-national resources ever get coverage rows; IsNational already covers every municipality.
/// This batch (9c) adds rows 201–247 from docs/seed-data-oslo.md — all Oslo, no coverage joins
/// (Oslo is one municipality; bydeler are not municipalities in this database). Row 216 (Oslo
/// Krisesenter) keeps Address = null deliberately — hemmelig adresse, a safety measure, not
/// missing data.
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
            },
            // Batch 9c: rows 201-247 from docs/seed-data-oslo.md. Oslo is one municipality in
            // this database — bydeler are not municipalities, so every row below is
            // MunicipalityId = Oslo, IsNational = false. No coverage joins in this batch.
            new Resource
            {
                Id = 201,
                Name = "Nav Alna",
                MunicipalityId = Oslo,
                Address = "Trygve Lies plass 5, 1051 Oslo (Furuset senter, Bydelshuset, Innbyggertorget, 1. etasje)",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 202,
                Name = "Nav Bjerke",
                MunicipalityId = Oslo,
                Address = "Ulvenveien 84A, 0581 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 203,
                Name = "Nav Frogner",
                MunicipalityId = Oslo,
                Address = "Drammensveien 60, 0271 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 204,
                Name = "Nav Gamle Oslo",
                MunicipalityId = Oslo,
                Address = "Hagegata 24, 0653 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 205,
                Name = "Nav Grorud",
                MunicipalityId = Oslo,
                Address = "Kakkelovnskroken 3A, 0954 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 206,
                Name = "Nav Grünerløkka",
                MunicipalityId = Oslo,
                Address = "Marstrandgata 6, 0566 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 207,
                Name = "Nav Nordre Aker",
                MunicipalityId = Oslo,
                Address = "Gullhaugveien 7, 0484 Oslo, inngang fra Sandakerveien 130–138",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 208,
                Name = "Nav Nordstrand",
                MunicipalityId = Oslo,
                Address = "Cecilie Thoresens vei 1, 1153 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 209,
                Name = "Nav Sagene",
                MunicipalityId = Oslo,
                Address = "Thorvald Meyers gate 9, 0555 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 210,
                Name = "Nav St. Hanshaugen",
                MunicipalityId = Oslo,
                Address = "Pilestredet 56, 0167 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 211,
                Name = "Nav Stovner",
                MunicipalityId = Oslo,
                Address = "Stovner Senter 17, 0985 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 212,
                Name = "Nav Søndre Nordstrand",
                MunicipalityId = Oslo,
                Address = "Ravnåsveien 3, 1254 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 213,
                Name = "Nav Ullern",
                MunicipalityId = Oslo,
                Address = "Hoffsveien 48, 0377 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 214,
                Name = "Nav Vestre Aker",
                MunicipalityId = Oslo,
                Address = "Sørkedalsveien 150A, 0754 Oslo, inngang til venstre når man kommer inn hovedinngangen",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 215,
                Name = "Nav Østensjø",
                MunicipalityId = Oslo,
                Address = "Olaf Helsets vei 6, 0694 Oslo",
                Phone = "55 55 33 33",
                Website = "https://www.nav.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 216,
                Name = "Oslo Krisesenter",
                MunicipalityId = Oslo,
                // Address deliberately null — hemmelig adresse for safety. The Postboks in the
                // doc's Notes is a postal address, not a visiting address, so it is not seeded
                // here either. See docs/seed-data-oslo.md row 216's Notes. Not missing data.
                Address = null,
                Phone = "22 48 03 80",
                Website = "https://www.oslokrisesenter.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 217,
                Name = "Unge Relasjoner",
                IsNational = true,
                MunicipalityId = null,
                Website = "https://www.ungerelasjoner.no",
                ChatUrl = "https://www.ungerelasjoner.no/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 218,
                Name = "Overgrepsmottaket, Legevakten i Oslo",
                MunicipalityId = Oslo,
                Address = "Trondheimsveien 233 (Aker sykehus), 0587 Oslo",
                // Number shared with row 221 (Psykososial akuttjeneste) — two real services
                // behind one real switchboard, no keypress invented. Staff line (23 04 04 90)
                // and barnemottaket (22 98 91 40) are named in the doc's Notes but deliberately
                // not seeded: staff-only / a different service.
                Phone = "23 04 05 00",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 219,
                Name = "Alternativ til Vold (ATV) Oslo",
                MunicipalityId = Oslo,
                Address = "Brugata 19, 0186 Oslo",
                Phone = "22 40 11 10",
                Website = "https://atv-stiftelsen.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 220,
                Name = "Vake kirkelig ressurssenter mot seksuelle overgrep",
                MunicipalityId = Oslo,
                Address = "Lovisenberggata 15 C, 0456 Oslo",
                Phone = "23 22 79 30",
                Website = "https://www.kirkeligressurssenter.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 221,
                Name = "Psykososial akuttjeneste, Legevakten i Oslo",
                MunicipalityId = Oslo,
                Address = "Trondheimsveien 233 (Aker sykehus), 0587 Oslo",
                // Same number as row 218 — see that row's note.
                Phone = "23 04 05 00",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 222,
                Name = "Legevakten i Oslo",
                MunicipalityId = Oslo,
                Address = "Trondheimsveien 233 (Aker sykehus)",
                // 116 117 shown per the 2026-08-17 no-calls resolution — the number on the
                // service's own page. A second Oslo-specific number (23 48 72 00) is
                // note-only, not seeded. Overlaps with national row 3 in seed-data.md.
                Phone = "116 117",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 223,
                Name = "Uteseksjonen, Oslo kommune",
                MunicipalityId = Oslo,
                Address = "Maridalsveien 3, 0178 Oslo",
                // Shared number and address with row 224 — kept as two rows, distinct services
                // with their own pages and target groups (2026-08-17 resolution).
                Phone = "913 03 913",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 224,
                Name = "Uteseksjonens psykologtjeneste",
                MunicipalityId = Oslo,
                Address = "Maridalsveien 3, 0178 Oslo",
                Phone = "913 03 913",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 225,
                Name = "Prindsen mottakssenter",
                MunicipalityId = Oslo,
                Address = "Hausmannsgate 11, 0182 Oslo",
                // A second number (23 04 05 00, the legevakt/psykososial line — rows 218/221)
                // and a Nav-inntak line (91 54 59 71) are named in Notes but not seeded: the
                // former belongs to a different service, the latter is staff-only per the
                // never-invent-staff-numbers rule.
                Phone = "23 42 72 00",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 226,
                Name = "Feltpleien i Oslo (Frelsesarmeen)",
                MunicipalityId = Oslo,
                Address = "Urtegata 16 A, 0187 Oslo",
                Phone = "22 67 43 45",
                Website = "https://frelsesarmeen.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 227,
                Name = "Fyrlyset, Oslo (Frelsesarmeen)",
                MunicipalityId = Oslo,
                Address = "Urtegata 16 A, 0187 Oslo",
                Email = "fyrlyset.oslo@frelsesarmeen.no",
                Phone = "23 03 66 80",
                Website = "https://frelsesarmeen.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 228,
                Name = "LINK Oslo",
                MunicipalityId = Oslo,
                Address = "Lilletorget 1, 5. etasje",
                Phone = "940 30 488",
                Website = "https://linkoslo.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 229,
                Name = "Rask psykisk helsehjelp – Bydel Alna",
                MunicipalityId = Oslo,
                Address = "Trygve Lies Plass 6, 1051 Oslo",
                Phone = "22 30 77 12",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 230,
                Name = "Rask psykisk helsehjelp – Bydel Ullern",
                MunicipalityId = Oslo,
                Address = "Hoffsveien 48, 0377 Oslo",
                Phone = "95 29 83 22",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 231,
                Name = "Rask psykisk helsehjelp – Bydel Vestre Aker",
                MunicipalityId = Oslo,
                Address = "Sørkedalsveien 150 A, 0754 Oslo",
                Phone = "47 78 13 15",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 232,
                Name = "Ung Arena Oslo sentrum",
                MunicipalityId = Oslo,
                Address = "Hagegata 32, 0653 Oslo",
                Phone = "904 15 388",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 233,
                Name = "Kontoret for fri rettshjelp, Oslo kommune",
                MunicipalityId = Oslo,
                Address = "Storgata 19, 0184 Oslo",
                Email = "frirettshjelp@vel.oslo.kommune.no",
                Phone = "23 48 79 00",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 234,
                Name = "JURK – Juridisk rådgivning for kvinner",
                MunicipalityId = Oslo,
                Address = "Skippergata 23, 0154 Oslo",
                Phone = "22 84 29 50",
                Website = "https://foreninger.uio.no/jurk/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 235,
                Name = "Gatejuristen",
                MunicipalityId = Oslo,
                // No phone, address or hours found on the source page — deliberately
                // contactless, ships website-only. See docs/seed-data-oslo.md row 235's Notes.
                Website = "https://kirkensbymisjon.no/gatejuristen/",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 236,
                Name = "Barnevernvakten i Oslo",
                MunicipalityId = Oslo,
                // Address and hours NOT FOUND per the doc — no dedicated service page found.
                Phone = "40 42 77 77",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 237,
                Name = "Familievernkontoret Christiania",
                MunicipalityId = Oslo,
                Address = "Dronningens gate 8 A, 0152 Oslo",
                Phone = "23 28 39 40",
                Website = "https://www.bufdir.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 238,
                Name = "Familievernkontoret Enerhaugen",
                MunicipalityId = Oslo,
                Address = "Grønlandsleiret 25, 0190 Oslo",
                Phone = "466 17 010",
                Website = "https://www.bufdir.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 239,
                Name = "Familievernkontoret Homansbyen",
                MunicipalityId = Oslo,
                Address = "Oscars gate 20, 0352 Oslo",
                Phone = "466 16 660",
                Website = "https://www.bufdir.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 240,
                Name = "Familievernkontoret Oslo Nord",
                MunicipalityId = Oslo,
                Address = "Kabelgata 2, 0581 Oslo",
                Phone = "46 61 51 20",
                Website = "https://www.bufdir.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 241,
                Name = "Gamle Oslo helsestasjon for ungdom (HFU)",
                MunicipalityId = Oslo,
                // Seeded as Gamle Oslo per Malin's 2026-08-17 resolution: page content (title +
                // Hagegata 32, postcode consistent with Gamle Oslo) wins over the URL slug,
                // which said "grunerlokka". See docs/seed-data-oslo.md's "Verify these first" §1.
                Address = "Hagegata 32, 0653 Oslo",
                Phone = "415 65 535",
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 242,
                Name = "Helsestasjon for ungdom (HFU) i Oslo",
                MunicipalityId = Oslo,
                // City-level overview row — no phone number or per-station contact printed on
                // the central page. Ships website-only, consistent with the Jobbhus/RPH
                // decisions elsewhere in this batch.
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 243,
                Name = "Oslohjelpa",
                MunicipalityId = Oslo,
                // No phone number printed — the page only says to contact Oslohjelpa in your
                // own bydel, without listing per-bydel numbers.
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 244,
                Name = "Boligkontorene i Oslo",
                MunicipalityId = Oslo,
                // City-level overview row — the page names no offices and prints no numbers.
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 245,
                Name = "Stovner boligkontor",
                MunicipalityId = Oslo,
                Address = "Bydel Stovner, Boligenheten, Karl Fossums vei 30, 0985 Oslo",
                // Phone deliberately empty — Malin's 2026-08-17 decision. The page prints only
                // "55553333", the national Nav line run together, not the office's own number.
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 246,
                Name = "Økonomisk rådgivning og gjeldsrådgivning, Oslo kommune",
                MunicipalityId = Oslo,
                // No phone or hours printed — the page routes to the local Nav office (rows
                // 201-215). See also seed-data.md row 6, the national gjeld line.
                Website = "https://www.oslo.kommune.no",
                LastVerified = Verified,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 247,
                Name = "Bymisjonssenteret, Oslo (Kirkens Bymisjon)",
                MunicipalityId = Oslo,
                Address = "Herslebsgate 43, 0578 Oslo",
                // No email seeded — the only address on the page is a named employee's
                // (operations manager), not a service address. Never-invent/never-personal rule.
                Phone = "22 66 67 80",
                Website = "https://kirkensbymisjon.no",
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
            },
            new ResourceTranslation
            {
                Id = 89,
                ResourceId = 201,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Alna, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 90,
                ResourceId = 201,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Alna district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 91,
                ResourceId = 202,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Bjerke, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 92,
                ResourceId = 202,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Bjerke district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 93,
                ResourceId = 203,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Frogner, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 94,
                ResourceId = 203,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Frogner district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 95,
                ResourceId = 204,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Gamle Oslo, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 96,
                ResourceId = 204,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Gamle Oslo district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 97,
                ResourceId = 205,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Grorud, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 98,
                ResourceId = 205,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Grorud district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 99,
                ResourceId = 206,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Grünerløkka. Kontoret hjelper med arbeid, nødhjelp, økonomisk rådgivning, bolig, flyktningtjeneste og oppfølging ved rusproblemer.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 100,
                ResourceId = 206,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Grünerløkka district. The office helps with work, emergency assistance, money advice, housing, refugee services and substance use follow-up.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 101,
                ResourceId = 207,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Nordre Aker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 102,
                ResourceId = 207,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Nordre Aker district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 103,
                ResourceId = 208,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Nordstrand, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 104,
                ResourceId = 208,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Nordstrand district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 105,
                ResourceId = 209,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Sagene, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Hver onsdag er det drop-in for økonomirådgivning fra klokken 9 til 11.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15. Drop-in økonomirådgivning onsdager 9–11",
            },
            new ResourceTranslation
            {
                Id = 106,
                ResourceId = 209,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Sagene district, with help on financial assistance, work, housing and other social services. Every Wednesday there is a drop-in for money advice from 9 to 11.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15. Money-advice drop-in Wednesdays 9–11",
            },
            new ResourceTranslation
            {
                Id = 107,
                ResourceId = 210,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel St. Hanshaugen, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 108,
                ResourceId = 210,
                LanguageCode = "en",
                Description = "The Nav office for people living in the St. Hanshaugen district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 109,
                ResourceId = 211,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Stovner, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 110,
                ResourceId = 211,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Stovner district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 111,
                ResourceId = 212,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Søndre Nordstrand, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 112,
                ResourceId = 212,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Søndre Nordstrand district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 113,
                ResourceId = 213,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Ullern, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 114,
                ResourceId = 213,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Ullern district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 115,
                ResourceId = 214,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Vestre Aker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 116,
                ResourceId = 214,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Vestre Aker district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 117,
                ResourceId = 215,
                LanguageCode = "nb",
                Description = "Nav-kontoret for deg som bor i bydel Østensjø, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.",
                OpeningHours = "Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 118,
                ResourceId = 215,
                LanguageCode = "en",
                Description = "The Nav office for people living in the Østensjø district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.",
                OpeningHours = "Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 119,
                ResourceId = 216,
                LanguageCode = "nb",
                Description = "Gratis døgnåpent tilbud til deg som er utsatt for vold i nære relasjoner. Du kan ringe for råd og veiledning, og senteret har også botilbud. Adressen er hemmelig av hensyn til sikkerheten.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 120,
                ResourceId = 216,
                LanguageCode = "en",
                Description = "A free 24-hour service for anyone affected by violence in a close relationship. You can call for advice and guidance, and the centre also offers a place to stay. The address is kept secret for safety reasons.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 121,
                ResourceId = 217,
                LanguageCode = "nb",
                Description = "Anonym chat for deg mellom 16 og 25 år som er i en usunn relasjon. Du chatter med fagpersoner som har lang erfaring med vold i nære relasjoner.",
                OpeningHours = "Chat tirsdag 12–20 og fredag 12–15",
            },
            new ResourceTranslation
            {
                Id = 122,
                ResourceId = 217,
                LanguageCode = "en",
                Description = "An anonymous chat for people aged 16 to 25 who are in an unhealthy relationship. You chat with professionals who have long experience with violence in close relationships.",
                OpeningHours = "Chat Tuesday 12–20 and Friday 12–15",
            },
            new ResourceTranslation
            {
                Id = 123,
                ResourceId = 218,
                LanguageCode = "nb",
                Description = "Gratis døgnåpent helsetilbud for deg fra 14 år som har vært utsatt for voldtekt, voldtektsforsøk eller andre seksuelle overgrep. Du kan komme uten å ha anmeldt forholdet til politiet. Gjelder det et barn under 14 år, skal henvendelsen gå til barnemottaket.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 124,
                ResourceId = 218,
                LanguageCode = "en",
                Description = "A free 24-hour health service for people aged 14 and over who have experienced rape, attempted rape or other sexual assault. You can come without having reported it to the police. For a child under 14, the enquiry goes to the children's unit instead.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 125,
                ResourceId = 219,
                LanguageCode = "nb",
                Description = "Behandlingstilbud til deg over 18 år som bruker vold eller har problemer med sinne og aggresjon. Både kvinner og menn kan få behandling, individuelt eller i gruppe.",
                OpeningHours = "Telefontid mandag–fredag 09.00–15.00",
            },
            new ResourceTranslation
            {
                Id = 126,
                ResourceId = 219,
                LanguageCode = "en",
                Description = "A treatment service for people over 18 who use violence or struggle with anger and aggression. Both women and men can receive treatment, individually or in a group.",
                OpeningHours = "Phone hours Monday–Friday 09.00–15.00",
            },
            new ResourceTranslation
            {
                Id = 127,
                ResourceId = 220,
                LanguageCode = "nb",
                Description = "Ressurssenter for deg som har opplevd seksuelle overgrep eller vold, med samtaler og veiledning. Du kan ta kontakt på telefon eller SMS.",
            },
            new ResourceTranslation
            {
                Id = 128,
                ResourceId = 220,
                LanguageCode = "en",
                Description = "A resource centre for people who have experienced sexual abuse or violence, offering counselling and guidance. You can get in touch by phone or text message.",
            },
            new ResourceTranslation
            {
                Id = 129,
                ResourceId = 221,
                LanguageCode = "nb",
                Description = "Kommunens døgnåpne tjeneste ved akutt oppståtte kriser. Du kan få samtale på legevakten, på telefon eller video, og tjenesten kan også komme hjem til deg. Du trenger ikke henvisning, og tilbudet er gratis.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 130,
                ResourceId = 221,
                LanguageCode = "en",
                Description = "The city's 24-hour service for people in an acute crisis. You can talk at the emergency clinic, by phone or by video, and the service can also come to your home. No referral is needed and it is free.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 131,
                ResourceId = 222,
                LanguageCode = "nb",
                Description = "Legevakten i Oslo er åpen hele døgnet for deg som trenger rask helsehjelp når fastlegen er stengt. Ved fare for liv og helse skal du ringe 113.",
                OpeningHours = "Åpent 00–24",
            },
            new ResourceTranslation
            {
                Id = 132,
                ResourceId = 222,
                LanguageCode = "en",
                Description = "The Oslo emergency clinic is open around the clock for anyone needing urgent medical help when their regular doctor is closed. If there is danger to life, call 113 instead.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 133,
                ResourceId = 223,
                LanguageCode = "nb",
                Description = "Oslo kommunes oppsøkende tjeneste i sentrum, med særlig fokus på unge opptil 25 år. Patruljer er ute hver dag og kveld, og du kan også komme til rådgivningstjenesten eller ringe eller sende SMS.",
                OpeningHours = "Rådgivningstjenesten i Maridalsveien 3 mandag–fredag 10:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 134,
                ResourceId = 223,
                LanguageCode = "en",
                Description = "The City of Oslo's outreach service in the city centre, with a particular focus on young people up to 25. Patrols are out every day and evening, and you can also visit the advice service or call or text.",
                OpeningHours = "Advice service at Maridalsveien 3 Monday–Friday 10:00–15:00",
            },
            new ResourceTranslation
            {
                Id = 135,
                ResourceId = 224,
                LanguageCode = "nb",
                Description = "Psykologhjelp for deg under 25 år, gjennom Uteseksjonen. Du kan ta kontakt selv på telefon eller SMS, uten henvisning.",
            },
            new ResourceTranslation
            {
                Id = 136,
                ResourceId = 224,
                LanguageCode = "en",
                Description = "Psychological help for people under 25, through the outreach service. You can get in touch yourself by phone or text, without a referral.",
            },
            new ResourceTranslation
            {
                Id = 137,
                ResourceId = 225,
                LanguageCode = "nb",
                Description = "Lavterskeltilbud med helse- og sosialtjenester for deg med rusutfordringer, med brukerrom, feltpleie, lege og akutt overnatting. Du trenger ikke henvisning for å komme.",
                OpeningHours = "Brukerrom mandag–søndag 09:00–22:00. Feltpleie mandag–fredag 09:00–22:00, lørdag–søndag 10:00–20:00",
            },
            new ResourceTranslation
            {
                Id = 138,
                ResourceId = 225,
                LanguageCode = "en",
                Description = "A low-threshold centre with health and social services for people with substance use difficulties, offering a drug consumption room, field nursing, a doctor and emergency overnight accommodation. No referral is needed.",
                OpeningHours = "Consumption room Monday–Sunday 09:00–22:00. Field nursing Monday–Friday 09:00–22:00, Saturday–Sunday 10:00–20:00",
            },
            new ResourceTranslation
            {
                Id = 139,
                ResourceId = 226,
                LanguageCode = "nb",
                Description = "Helsehjelp for deg som lever med rusproblemer, med sårstell, prevensjon og andre helsetjenester uten timeavtale. Lege er til stede onsdag og fredag.",
                OpeningHours = "Mandag–fredag 09.00–15.00",
            },
            new ResourceTranslation
            {
                Id = 140,
                ResourceId = 226,
                LanguageCode = "en",
                Description = "Health care for people living with substance use problems, with wound care, contraception and other health services without an appointment. A doctor is present on Wednesdays and Fridays.",
                OpeningHours = "Monday–Friday 09.00–15.00",
            },
            new ResourceTranslation
            {
                Id = 141,
                ResourceId = 227,
                LanguageCode = "nb",
                Description = "Kontaktsenter for deg over 18 år med rusproblemer, der du kan få mat, drikke, klær og mulighet til å vaske deg. Du kan komme innom uten avtale.",
                OpeningHours = "Hverdager 09.00–14.30, søndager 11.00–13.00",
            },
            new ResourceTranslation
            {
                Id = 142,
                ResourceId = 227,
                LanguageCode = "en",
                Description = "A drop-in centre for people over 18 with substance use problems, where you can get food, drink, clothes and a chance to wash. You can come without an appointment.",
                OpeningHours = "Weekdays 09.00–14.30, Sundays 11.00–13.00",
            },
            new ResourceTranslation
            {
                Id = 143,
                ResourceId = 228,
                LanguageCode = "nb",
                Description = "Senter for selvhjelp og mestring, der du kan få hjelp til å starte eller finne en selvhjelpsgruppe. Tilbudet er gratis og du trenger ingen henvisning.",
                OpeningHours = "Telefon hverdager 9–15",
            },
            new ResourceTranslation
            {
                Id = 144,
                ResourceId = 228,
                LanguageCode = "en",
                Description = "A centre for self-help and coping, where you can get help starting or finding a self-help group. The service is free and needs no referral.",
                OpeningHours = "Phone weekdays 9–15",
            },
            new ResourceTranslation
            {
                Id = 145,
                ResourceId = 229,
                LanguageCode = "nb",
                Description = "Kortvarig og gratis behandling for deg med bostedsadresse i bydel Alna som har milde til moderate psykiske plager. Du tar kontakt selv, uten henvisning fra lege.",
            },
            new ResourceTranslation
            {
                Id = 146,
                ResourceId = 229,
                LanguageCode = "en",
                Description = "Short-term, free treatment for people registered as living in the Alna district with mild to moderate mental health difficulties. You get in touch yourself, without a doctor's referral.",
            },
            new ResourceTranslation
            {
                Id = 147,
                ResourceId = 230,
                LanguageCode = "nb",
                Description = "Kortvarig og gratis behandling for deg i bydel Ullern som har milde til moderate psykiske plager. Telefonen er bare bemannet én time i uken, så ring innenfor telefontiden.",
                OpeningHours = "Telefonen er bemannet torsdager 12:00–13:00",
            },
            new ResourceTranslation
            {
                Id = 148,
                ResourceId = 230,
                LanguageCode = "en",
                Description = "Short-term, free treatment for people in the Ullern district with mild to moderate mental health difficulties. The phone is staffed only one hour a week, so call within the stated time.",
                OpeningHours = "Phone staffed Thursdays 12:00–13:00",
            },
            new ResourceTranslation
            {
                Id = 149,
                ResourceId = 231,
                LanguageCode = "nb",
                Description = "Gratis korttidsbehandling for deg over 16 år i bydel Vestre Aker med milde til moderate psykiske utfordringer. Du trenger ikke henvisning.",
            },
            new ResourceTranslation
            {
                Id = 150,
                ResourceId = 231,
                LanguageCode = "en",
                Description = "Free short-term treatment for people over 16 in the Vestre Aker district with mild to moderate mental health difficulties. No referral is needed.",
            },
            new ResourceTranslation
            {
                Id = 151,
                ResourceId = 232,
                LanguageCode = "nb",
                Description = "Gratis lavterskeltilbud med samtaler og veiledning for deg mellom 12 og 25 år som har det vanskelig psykisk. Du trenger ingen henvisning, og på torsdager kan du komme på drop-in.",
                OpeningHours = "Drop-in torsdager 14:00–17:00",
            },
            new ResourceTranslation
            {
                Id = 152,
                ResourceId = 232,
                LanguageCode = "en",
                Description = "A free low-threshold service offering conversations and guidance for people aged 12 to 25 who are struggling mentally. No referral is needed, and on Thursdays you can drop in.",
                OpeningHours = "Drop-in Thursdays 14:00–17:00",
            },
            new ResourceTranslation
            {
                Id = 153,
                ResourceId = 233,
                LanguageCode = "nb",
                Description = "Gratis juridisk rådgivning fra advokater for deg som bor i Oslo og omegn. Alle får inntil en halvtime med advokat, og du kan bestille time eller komme på drop-in på ettermiddagen.",
                OpeningHours = "Timeavtaler mandag–fredag 08:00–15:30. Drop-in mandag–torsdag 16:00–19:00",
            },
            new ResourceTranslation
            {
                Id = 154,
                ResourceId = 233,
                LanguageCode = "en",
                Description = "Free legal advice from lawyers for people living in Oslo and the surrounding area. Everyone gets up to half an hour with a lawyer, and you can book a time or come to the afternoon drop-in.",
                OpeningHours = "Appointments Monday–Friday 08:00–15:30. Drop-in Monday–Thursday 16:00–19:00",
            },
            new ResourceTranslation
            {
                Id = 155,
                ResourceId = 234,
                LanguageCode = "nb",
                Description = "Gratis rettshjelp fra jusstudenter til kvinner og personer som definerer seg som kvinner, i saker om blant annet vold, familie, arbeid, bolig og gjeld. Nye saker tas imot i egne tider.",
                OpeningHours = "Nye saker: mandag 12:00–15:00, onsdag 09:00–12:00 (kun telefon) og onsdag 17:00–20:00",
            },
            new ResourceTranslation
            {
                Id = 156,
                ResourceId = 234,
                LanguageCode = "en",
                Description = "Free legal aid from law students for women and people who identify as women, in areas such as violence, family, work, housing and debt. New cases are taken during separate opening times.",
                OpeningHours = "New cases: Monday 12:00–15:00, Wednesday 09:00–12:00 (phone only) and Wednesday 17:00–20:00",
            },
            new ResourceTranslation
            {
                Id = 157,
                ResourceId = 235,
                LanguageCode = "nb",
                Description = "Gratis rettshjelp til deg som har eller har hatt rusproblemer. Kontaktinformasjon må hentes fra Gatejuristens egne nettsider.",
            },
            new ResourceTranslation
            {
                Id = 158,
                ResourceId = 235,
                LanguageCode = "en",
                Description = "Free legal aid for people who have, or have had, substance use problems. Contact details must be taken from Gatejuristen's own website.",
            },
            new ResourceTranslation
            {
                Id = 159,
                ResourceId = 236,
                LanguageCode = "nb",
                Description = "Barnevernets akuttberedskap for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret for et barn kan ta kontakt.",
            },
            new ResourceTranslation
            {
                Id = 160,
                ResourceId = 236,
                LanguageCode = "en",
                Description = "The child welfare emergency service for children and young people in urgent situations. Both children themselves and adults worried about a child can get in touch.",
            },
            new ResourceTranslation
            {
                Id = 161,
                ResourceId = 237,
                LanguageCode = "nb",
                Description = "Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Søndre Nordstrand, Nordstrand, Grünerløkka og Frogner.",
                OpeningHours = "Åpent 08.15–15.30, telefontid 08.30–15.00",
            },
            new ResourceTranslation
            {
                Id = 162,
                ResourceId = 237,
                LanguageCode = "en",
                Description = "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Søndre Nordstrand, Nordstrand, Grünerløkka and Frogner districts.",
                OpeningHours = "Open 08.15–15.30, phone hours 08.30–15.00",
            },
            new ResourceTranslation
            {
                Id = 163,
                ResourceId = 238,
                LanguageCode = "nb",
                Description = "Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Alna, Gamle Oslo, Østensjø og Nordre Aker.",
                OpeningHours = "08.30–15.00",
            },
            new ResourceTranslation
            {
                Id = 164,
                ResourceId = 238,
                LanguageCode = "en",
                Description = "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Alna, Gamle Oslo, Østensjø and Nordre Aker districts.",
                OpeningHours = "08.30–15.00",
            },
            new ResourceTranslation
            {
                Id = 165,
                ResourceId = 239,
                LanguageCode = "nb",
                Description = "Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene St. Hanshaugen, Ullern, Sagene og Vestre Aker.",
                OpeningHours = "08.30–15.00",
            },
            new ResourceTranslation
            {
                Id = 166,
                ResourceId = 239,
                LanguageCode = "en",
                Description = "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the St. Hanshaugen, Ullern, Sagene and Vestre Aker districts.",
                OpeningHours = "08.30–15.00",
            },
            new ResourceTranslation
            {
                Id = 167,
                ResourceId = 240,
                LanguageCode = "nb",
                Description = "Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Bjerke, Grorud og Stovner.",
                OpeningHours = "08.30–15.30",
            },
            new ResourceTranslation
            {
                Id = 168,
                ResourceId = 240,
                LanguageCode = "en",
                Description = "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Bjerke, Grorud and Stovner districts.",
                OpeningHours = "08.30–15.30",
            },
            new ResourceTranslation
            {
                Id = 169,
                ResourceId = 241,
                LanguageCode = "nb",
                Description = "Gratis helsestasjon for ungdom, med helsesykepleier, lege og samtaler om kropp, seksualitet, psykisk helse og andre ting du lurer på. Du kan bruke hvilken som helst helsestasjon for ungdom i Oslo.",
                OpeningHours = "Telefontid tirsdag og torsdag 11:00–14:00",
            },
            new ResourceTranslation
            {
                Id = 170,
                ResourceId = 241,
                LanguageCode = "en",
                Description = "A free youth health clinic with nurses, a doctor and conversations about your body, sexuality, mental health and anything else on your mind. You can use any youth health clinic in Oslo.",
                OpeningHours = "Phone hours Tuesday and Thursday 11:00–14:00",
            },
            new ResourceTranslation
            {
                Id = 171,
                ResourceId = 242,
                LanguageCode = "nb",
                Description = "Alle ungdommer i Oslo mellom 12 og 24 år kan bruke helsestasjon for ungdom, og tjenestene er gratis. Du velger fritt hvilken helsestasjon du vil gå til.",
            },
            new ResourceTranslation
            {
                Id = 172,
                ResourceId = 242,
                LanguageCode = "en",
                Description = "All young people in Oslo aged 12 to 24 can use a youth health clinic, and the services are free. You are free to choose whichever clinic you want to go to.",
            },
            new ResourceTranslation
            {
                Id = 173,
                ResourceId = 243,
                LanguageCode = "nb",
                Description = "Gratis lavterskeltilbud som skal hjelpe barn, unge og familier raskt når de trenger det. Du trenger ingen henvisning, og du tar kontakt med Oslohjelpa i din egen bydel.",
            },
            new ResourceTranslation
            {
                Id = 174,
                ResourceId = 243,
                LanguageCode = "en",
                Description = "A free low-threshold service meant to help children, young people and families quickly when they need it. No referral is needed, and you contact Oslohjelpa in your own district.",
            },
            new ResourceTranslation
            {
                Id = 175,
                ResourceId = 244,
                LanguageCode = "nb",
                Description = "Alle bydeler i Oslo har et boligkontor som hjelper deg med å søke kommunal bolig og kommunal bostøtte. Du finner riktig kontor ved å velge bydelen din eller søke opp adressen din.",
            },
            new ResourceTranslation
            {
                Id = 176,
                ResourceId = 244,
                LanguageCode = "en",
                Description = "Every district in Oslo has a housing office that helps you apply for municipal housing and municipal housing benefit. You find the right office by choosing your district or searching for your address.",
            },
            new ResourceTranslation
            {
                Id = 177,
                ResourceId = 245,
                LanguageCode = "nb",
                Description = "Boligkontoret i bydel Stovner, som hjelper deg med å søke kommunal bolig og kommunal bostøtte. Du kan få hjelp til å fylle ut søknaden.",
            },
            new ResourceTranslation
            {
                Id = 178,
                ResourceId = 245,
                LanguageCode = "en",
                Description = "The housing office in the Stovner district, which helps you apply for municipal housing and municipal housing benefit. You can get help filling in the application.",
            },
            new ResourceTranslation
            {
                Id = 179,
                ResourceId = 246,
                LanguageCode = "nb",
                Description = "Hjelp til deg som sliter med å betale regninger eller gjeld, med råd om økonomi og gjeldsordning. Du tar kontakt med Nav-kontoret i bydelen din for å avtale time.",
            },
            new ResourceTranslation
            {
                Id = 180,
                ResourceId = 246,
                LanguageCode = "en",
                Description = "Help for people struggling to pay bills or debt, with advice on finances and debt settlement. You contact the Nav office in your district to book an appointment.",
            },
            new ResourceTranslation
            {
                Id = 181,
                ResourceId = 247,
                LanguageCode = "nb",
                Description = "Kirkens Bymisjons senter på Grønland, med møteplasser, aktiviteter og oppfølging for mennesker i vanskelige livssituasjoner.",
            },
            new ResourceTranslation
            {
                Id = 182,
                ResourceId = 247,
                LanguageCode = "en",
                Description = "Kirkens Bymisjon's centre at Grønland, with meeting places, activities and follow-up for people in difficult life situations.",
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
            new ResourceCategory { ResourceId = 122, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 201, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 201, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 201, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 202, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 202, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 202, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 203, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 203, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 203, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 204, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 204, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 204, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 205, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 205, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 205, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 206, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 206, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 206, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 206, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 207, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 207, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 207, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 208, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 208, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 208, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 209, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 209, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 209, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 210, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 210, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 210, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 211, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 211, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 211, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 212, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 212, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 212, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 213, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 213, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 213, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 214, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 214, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 214, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 215, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 215, CategoryId = Categories.Arbeid },
            new ResourceCategory { ResourceId = 215, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 216, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 216, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 216, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 217, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 217, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 218, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 218, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 219, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 219, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 220, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 220, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 221, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 221, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 221, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 222, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 222, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 223, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 223, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 224, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 224, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 225, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 225, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 225, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 226, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 227, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 227, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 228, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 229, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 229, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 230, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 230, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 231, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 231, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 232, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 232, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 233, CategoryId = Categories.JuridiskHjelp },
            new ResourceCategory { ResourceId = 233, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 233, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 234, CategoryId = Categories.JuridiskHjelp },
            new ResourceCategory { ResourceId = 234, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 234, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 235, CategoryId = Categories.JuridiskHjelp },
            new ResourceCategory { ResourceId = 235, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 236, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 236, CategoryId = Categories.VoldOgOvergrep },
            new ResourceCategory { ResourceId = 236, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 237, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 238, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 239, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 240, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 241, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 241, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 242, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 242, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 243, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 243, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 244, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 245, CategoryId = Categories.Bolig },
            new ResourceCategory { ResourceId = 246, CategoryId = Categories.Okonomi },
            new ResourceCategory { ResourceId = 247, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 247, CategoryId = Categories.Rus });

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

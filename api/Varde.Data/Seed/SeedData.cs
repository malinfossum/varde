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
/// Plan 4 Task 4 adds rows 23–25: the national emergency numbers 110 (Brannvesen), 112 (Politi)
/// and 113 (Ambulanse), for the redesign's acute strip. Fire has no single national site — the
/// 110 line runs through twelve regional 110-sentraler — so row 23 cites DSB (the directorate
/// responsible for how they're organised) as the official source instead.
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
///
/// C2a (2026-10-16) adds ParentId and PhoneMenuOption from docs/seed-data.md's "Parents and phone
/// menu options" table: rows 9 and 122 hang off row 1, and row 9's "tast 3" moved out of its
/// descriptions into PhoneMenuOption.
///
/// IsAlwaysOpen (added plan 2) is true exactly where the nb OpeningHours reads "Døgnåpent" — the
/// SeedDataTests guard enforces both directions.
///
/// Sub-project C1 (2026-10-15 spec) re-read every live row for its referral statement and price
/// wording: docs/seed-data-lavterskel-retag.md, checked in
/// docs/verification/seed-data-lavterskel-retag-check.md. IsLowThreshold, Cost and the
/// CostNote translations come from that doc, as does category 10 membership; rows it changed
/// carry VerifiedRetag. SeedDataTests checks every badge against the doc's referral quote.
///
/// C1 batch 1 adds rows 301 and up from docs/seed-data-lavterskel-innlandet.md (checked in
/// docs/verification/seed-data-lavterskel-innlandet-check.md): meeting places and activity
/// providers in the seven Innlandet kommuner.
/// </summary>
public static class SeedData
{
    private static readonly DateTime SeededAt = new(2026, 8, 17, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateOnly Verified = new(2026, 8, 13);

    // Rows 23-25 (nødnumre) were added and verified 2026-09-09 — see docs/seed-data.md.
    private static readonly DateOnly VerifiedRows23To25 = new(2026, 9, 9);

    // Rows the C1 re-read changed (docs/seed-data-lavterskel-retag.md, gate closed 2026-10-26)
    // carry the date the page was read. Rows the re-read left alone keep their own date.
    private static readonly DateOnly VerifiedRetag = new(2026, 10, 26);

    // C1 batch 1 (docs/seed-data-lavterskel-innlandet.md, gate closed 2026-10-27).
    private static readonly DateTime SeededAtLavterskelInnlandet = new(2026, 10, 27, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateOnly VerifiedLavterskelInnlandet = new(2026, 10, 27);

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
                IsAlwaysOpen = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                Phone = "116 123",
                Website = "https://mentalhelse.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 2,
                Name = "Kirkens SOS",
                IsNational = true,
                IsAlwaysOpen = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                Phone = "22 40 00 40",
                Website = "https://www.kirkens-sos.no",
                ChatUrl = "https://www.soschat.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 3,
                Name = "Legevakt",
                IsNational = true,
                IsAlwaysOpen = true,
                Cost = ResourceCost.Paid,
                MunicipalityId = null,
                Phone = "116 117",
                Website = "https://www.helsenorge.no/legevakt/",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 4,
                Name = "Alarmtelefonen for barn og unge",
                IsNational = true,
                IsAlwaysOpen = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                Phone = "116 111",
                Website = "https://www.116111.no",
                ChatUrl = "https://www.116111.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 5,
                Name = "VO-linjen",
                IsNational = true,
                IsAlwaysOpen = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                Phone = "116 006",
                Website = "https://www.volinjen.no",
                ChatUrl = "https://www.volinjen.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 6,
                Name = "Navs økonomi- og gjeldsveiledningstelefon",
                IsNational = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                Phone = "55 55 33 39",
                Website = "https://www.nav.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 7,
                Name = "Jussbuss",
                IsNational = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                Phone = "22 84 29 00",
                Website = "https://foreninger.uio.no/jussbuss/",
                LastVerified = VerifiedRetag,
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
                ParentId = 1,
                PhoneMenuOption = 3,
                Website = "https://mentalhelse.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 10,
                Name = "Familievernkontoret Innlandet Øst, avdeling Hamar",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Hamar,
                Address = "Vangsvegen 121, 2318 Hamar",
                Phone = "466 17 130",
                Website = "https://www.bufdir.no/familie/familievernkontorer/oversikt/innlandet-ost/",
                LastVerified = VerifiedRetag,
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
                IsAlwaysOpen = true,
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Hamar,
                Address = "Kronborgvegen 23, 2318 Hamar",
                Phone = "62 56 18 30",
                Website = "https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/krisesenter/",
                LastVerified = VerifiedRetag,
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
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Lillehammer,
                Phone = "917 13 338",
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 16,
                Name = "Gudbrandsdal Krisesenter IKS",
                Cost = ResourceCost.Free,
                MunicipalityId = Lillehammer,
                Address = "Skoletorget 6 D, 2609 Lillehammer",
                Phone = "414 81 220",
                Website = "https://gudbrandsdal-krisesenter.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 17,
                Name = "Housing First, Lillehammer kommune",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Lillehammer,
                Phone = "451 64 131",
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 18,
                Name = "Oppfølgingsteamet, Lillehammer kommune",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Lillehammer,
                Phone = "902 43 733",
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/",
                LastVerified = VerifiedRetag,
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
                IsAlwaysOpen = true,
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Gjovik,
                // Address deliberately withheld — the centre gives its visiting address only on
                // contact, for safety. See docs/seed-data.md row 21's Notes. Not missing data.
                Address = null,
                Phone = "61 17 55 60",
                Website = "https://www.krisesenteret-gjovik.no",
                LastVerified = VerifiedRetag,
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
            // Rows 23-25 — the national emergency numbers, added 2026-09-09 for the acute strip
            // (plan 4). Copied from docs/seed-data.md rows 23-25; each row's Notes quotes the
            // source page. web/src/services/emergency.ts carries the same numbers as constants
            // and a web test pins them to these rows.
            new Resource
            {
                Id = 23,
                Name = "Brannvesen (nødnummer)",
                IsNational = true,
                IsAlwaysOpen = true,
                MunicipalityId = null,
                Phone = "110",
                Website = "https://www.dsb.no/brannsikkerhet/nodmelding/110-sentralene/",
                LastVerified = VerifiedRows23To25,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 24,
                Name = "Politi (nødnummer)",
                IsNational = true,
                IsAlwaysOpen = true,
                MunicipalityId = null,
                Phone = "112",
                Website = "https://www.politiet.no/kontakt-politiet/ring-politiet",
                LastVerified = VerifiedRows23To25,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 25,
                Name = "Ambulanse (medisinsk nødhjelp)",
                IsNational = true,
                IsAlwaysOpen = true,
                MunicipalityId = null,
                Phone = "113",
                Website = "https://www.helsenorge.no/forstehjelp",
                LastVerified = VerifiedRows23To25,
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
                IsLowThreshold = true,
                MunicipalityId = Ringsaker,
                Address = "Brugata 3, 2380 Brumunddal",
                Email = "postmottak.psykisk.helse@ringsaker.kommune.no",
                Phone = "62 33 52 20",
                Website = "https://www.ringsaker.kommune.no/tjenester/helse-og-omsorg/psykisk-helse-og-rustjenester",
                LastVerified = VerifiedRetag,
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
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 105,
                Name = "Stangehjelpa (avdeling for psykisk helse og rus), Stange kommune",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Stange,
                Phone = "62 56 23 00",
                Website = "https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/stangehjelpa/",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 106,
                Name = "Psykososial krisehjelp, Stange kommune",
                Cost = ResourceCost.Free,
                MunicipalityId = Stange,
                Phone = "908 05 567",
                Website = "https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/psykososial-krisehjelp/",
                LastVerified = VerifiedRetag,
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
                LastVerified = VerifiedRetag,
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
                Cost = ResourceCost.Free,
                MunicipalityId = Loten,
                Phone = "55 55 33 33",
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/sosiale-tjenester-og-nav/okonomisk-radgivning/",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 110,
                Name = "Psykisk helse-team, Løten kommune",
                Cost = ResourceCost.Free,
                MunicipalityId = Loten,
                Phone = "904 74 982",
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/psykisk-helse-og-rus-kategori/",
                LastVerified = VerifiedRetag,
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
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Loten,
                Address = "Kildevegen 1, 2340 Løten",
                // Phone deliberately empty — the only numbers on the page sit under two
                // therapists' first names, not a service line. My 2026-08-17 decision.
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/rask-psykisk-helsehjelp-rph/",
                LastVerified = VerifiedRetag,
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
                LastVerified = VerifiedRetag,
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
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Elverum,
                Phone = "993 72 609",
                Website = "https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/lavterskel-rus-og-psykisk-helsehjelp/",
                LastVerified = VerifiedRetag,
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
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Elverum,
                Address = "Storgata 10, 2408 Elverum",
                Email = "post@nokelverum.no",
                Phone = "971 59 810",
                Website = "https://nokelverum.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 118,
                Name = "Nok. Hamar",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Hamar,
                Email = "post@nokhamar.no",
                Phone = "916 91 714",
                Website = "https://www.nokhamar.no",
                LastVerified = VerifiedRetag,
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
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 121,
                Name = "Kors på halsen (Røde Kors)",
                IsNational = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                Phone = "800 33 321",
                Website = "https://www.korspahalsen.no",
                ChatUrl = "https://www.korspahalsen.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 122,
                Name = "Sidetmedord (Mental Helse)",
                IsNational = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                ParentId = 1,
                Website = "https://sidetmedord.mentalhelse.no/",
                ChatUrl = "https://mentalhelse.no/hjelpechat/",
                LastVerified = VerifiedRetag,
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
                LastVerified = VerifiedRetag,
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
                LastVerified = VerifiedRetag,
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
                IsAlwaysOpen = true,
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                // Address deliberately null — hemmelig adresse for safety. The Postboks in the
                // doc's Notes is a postal address, not a visiting address, so it is not seeded
                // here either. See docs/seed-data-oslo.md row 216's Notes. Not missing data.
                Address = null,
                Phone = "22 48 03 80",
                Website = "https://www.oslokrisesenter.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 217,
                Name = "Unge Relasjoner",
                IsNational = true,
                Cost = ResourceCost.Free,
                MunicipalityId = null,
                Website = "https://www.ungerelasjoner.no",
                ChatUrl = "https://www.ungerelasjoner.no/",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 218,
                Name = "Overgrepsmottaket, Legevakten i Oslo",
                IsAlwaysOpen = true,
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Trondheimsveien 233 (Aker sykehus), 0587 Oslo",
                // Number shared with row 221 (Psykososial akuttjeneste) — two real services
                // behind one real switchboard, no keypress invented. Staff line (23 04 04 90)
                // and barnemottaket (22 98 91 40) are named in the doc's Notes but deliberately
                // not seeded: staff-only / a different service.
                Phone = "23 04 05 00",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 219,
                Name = "Alternativ til Vold (ATV) Oslo",
                IsLowThreshold = true,
                Cost = ResourceCost.Paid,
                MunicipalityId = Oslo,
                Address = "Brugata 19, 0186 Oslo",
                Phone = "22 40 11 10",
                Website = "https://atv-stiftelsen.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 220,
                Name = "Vake kirkelig ressurssenter mot seksuelle overgrep",
                MunicipalityId = Oslo,
                Address = "Lovisenberggata 15A, 0456 Oslo",
                Phone = "23 22 79 30",
                Website = "https://www.ressurssenteret.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 221,
                Name = "Psykososial akuttjeneste, Legevakten i Oslo",
                IsAlwaysOpen = true,
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Trondheimsveien 233 (Aker sykehus), 0587 Oslo",
                // Same number as row 218 — see that row's note.
                Phone = "23 04 05 00",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 222,
                Name = "Legevakten i Oslo",
                Cost = ResourceCost.Paid,
                MunicipalityId = Oslo,
                Address = "Trondheimsveien 233 (Aker sykehus)",
                // 116 117 shown per the 2026-08-17 no-calls resolution — the number on the
                // service's own page. A second Oslo-specific number (23 48 72 00) is
                // note-only, not seeded. Overlaps with national row 3 in seed-data.md.
                Phone = "116 117",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
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
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 224,
                Name = "Uteseksjonens psykologtjeneste",
                IsLowThreshold = true,
                MunicipalityId = Oslo,
                Address = "Maridalsveien 3, 0178 Oslo",
                Phone = "913 03 913",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 225,
                Name = "Prindsen mottakssenter",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Hausmannsgate 11, 0182 Oslo",
                // A second number (23 04 05 00, the legevakt/psykososial line — rows 218/221)
                // and a Nav-inntak line (91 54 59 71) are named in Notes but not seeded: the
                // former belongs to a different service, the latter is staff-only per the
                // never-invent-staff-numbers rule.
                Phone = "23 42 72 00",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 226,
                Name = "Feltpleien i Oslo (Frelsesarmeen)",
                IsLowThreshold = true,
                MunicipalityId = Oslo,
                Address = "Urtegata 16 A, 0187 Oslo",
                Phone = "22 67 43 45",
                Website = "https://frelsesarmeen.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 227,
                Name = "Fyrlyset, Oslo (Frelsesarmeen)",
                IsLowThreshold = true,
                MunicipalityId = Oslo,
                Address = "Urtegata 16 A, 0187 Oslo",
                Email = "fyrlyset.oslo@frelsesarmeen.no",
                Phone = "23 03 66 80",
                Website = "https://frelsesarmeen.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 228,
                Name = "LINK Oslo",
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Lilletorget 1, 5. etasje",
                Phone = "940 30 488",
                Website = "https://linkoslo.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 229,
                Name = "Rask psykisk helsehjelp – Bydel Alna",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Trygve Lies Plass 6, 1051 Oslo",
                Phone = "22 30 77 12",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 230,
                Name = "Rask psykisk helsehjelp – Bydel Ullern",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Hoffsveien 48, 0377 Oslo",
                Phone = "95 29 83 22",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 231,
                Name = "Rask psykisk helsehjelp – Bydel Vestre Aker",
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Sørkedalsveien 150 A, 0754 Oslo",
                Phone = "47 78 13 15",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 232,
                Name = "Ung Arena Oslo sentrum",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Hagegata 32, 0653 Oslo",
                Phone = "904 15 388",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
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
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 234,
                Name = "JURK – Juridisk rådgivning for kvinner",
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Skippergata 23, 0154 Oslo",
                Phone = "22 84 29 50",
                Website = "https://foreninger.uio.no/jurk/",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 235,
                Name = "Gatejuristen",
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                // No phone, address or hours found on the source page — deliberately
                // contactless, ships website-only. See docs/seed-data-oslo.md row 235's Notes.
                Website = "https://kirkensbymisjon.no/gatejuristen/",
                LastVerified = VerifiedRetag,
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
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Dronningens gate 8 A, 0152 Oslo",
                Phone = "23 28 39 40",
                Website = "https://www.bufdir.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 238,
                Name = "Familievernkontoret Enerhaugen",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Grønlandsleiret 25, 0190 Oslo",
                Phone = "466 17 010",
                Website = "https://www.bufdir.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 239,
                Name = "Familievernkontoret Homansbyen",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Oscars gate 20, 0352 Oslo",
                Phone = "466 16 660",
                Website = "https://www.bufdir.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 240,
                Name = "Familievernkontoret Oslo Nord",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                Address = "Kabelgata 2, 0581 Oslo",
                Phone = "46 61 51 20",
                Website = "https://www.bufdir.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 241,
                Name = "Sentrum helsestasjon for ungdom (HFU)",
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                // Renamed Sentrum 2026-10-26 (docs/seed-data-lavterskel-retag.md row 241). Seeded as
                // Gamle Oslo per my 2026-08-17 resolution: page content (title +
                // Hagegata 32, postcode consistent with Gamle Oslo) wins over the URL slug,
                // which said "grunerlokka". See docs/seed-data-oslo.md's "Verify these first" §1.
                Address = "Hagegata 32, 0653 Oslo",
                Phone = "23 43 19 04",
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 242,
                Name = "Helsestasjon for ungdom (HFU) i Oslo",
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                // City-level overview row — no phone number or per-station contact printed on
                // the central page. Ships website-only, consistent with the Jobbhus/RPH
                // decisions elsewhere in this batch.
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 243,
                Name = "Oslohjelpa",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Oslo,
                // No phone number printed — the page only says to contact Oslohjelpa in your
                // own bydel, without listing per-bydel numbers.
                Website = "https://www.oslo.kommune.no",
                LastVerified = VerifiedRetag,
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
                // Phone deliberately empty — my 2026-08-17 decision. The page prints only
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
                LastVerified = VerifiedRetag,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new Resource
            {
                Id = 301,
                Name = "Sagatun Brukerstyrt Senter",
                IsLowThreshold = true,
                MunicipalityId = Hamar,
                Address = "Sagatunvegen 47A, 2317 Hamar",
                Phone = "62 50 97 55",
                Email = "post@sagatun.no",
                Website = "https://sagatun.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 302,
                Name = "Hamar Frivilligsentral",
                MunicipalityId = Hamar,
                Address = "Torggata 73, 2317 Hamar",
                Phone = "62 51 00 96",
                Email = "hamar@frivillighet.no",
                Website = "https://hamar.frivilligsentral.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 303,
                Name = "Høbben, et sted for ungdom",
                MunicipalityId = Hamar,
                Address = "Torggata 83, 2317 Hamar",
                Phone = "477 86 203",
                Email = "postmottak@hamar.kommune.no",
                Website = "https://www.hamar.kommune.no/hobben/hobben-et-sted-for-ungdom",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 304,
                Name = "CRUX Arbeideren",
                MunicipalityId = Hamar,
                Address = "Grønnegt. 51, inngang Håkons gate, 2317 Hamar",
                Email = "hamartiltakene@stiftelsencrux.no",
                Website = "https://stiftelsencrux.no/vare-virksomheter/hamartiltakene/crux-arbeideren",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 305,
                Name = "Evangeliesenteret kontaktsenter Hamar",
                IsLowThreshold = true,
                MunicipalityId = Hamar,
                Address = "Torggata 71, Hamar",
                Phone = "21 00 49 00",
                Email = "post@evangeliesenteret.no",
                Website = "https://www.evangeliesenteret.no/kontaktsenter/hamar",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 306,
                Name = "Blå Kors barnas stasjon Hamar",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Hamar,
                Address = "Grønnegata 134, 2317 Hamar",
                Phone = "990 93 994",
                Email = "barnasstasjonhamar@bks.no",
                Website = "https://www.blakors.no/barnas-stasjon/hamar/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 307,
                Name = "Støttesenter for pårørende, Hospice Sangen",
                IsLowThreshold = true,
                MunicipalityId = Hamar,
                Address = "Høyensalgata 74, 2317 Hamar",
                Phone = "62 54 20 90",
                Email = "hei@sangen.no",
                Website = "https://www.haraldsplass.org/hospice-sangen/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 308,
                Name = "Hamar Røde Kors",
                MunicipalityId = Hamar,
                Address = "Stormyrveien 9, 2315 HAMAR",
                Phone = "918 21 211",
                Email = "hamar@redcross.no",
                Website = "https://www.rodekors.no/lokalforeninger/hedmark/hamar/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 309,
                Name = "BUA Hamar",
                Cost = ResourceCost.Free,
                MunicipalityId = Hamar,
                Address = "Torggata 83, på Torghjørnet ved Stortorget, Hamar",
                Phone = "477 76 977",
                Email = "buahamar101@gmail.com",
                Website = "https://stiftelsencrux.no/vare-virksomheter/hamartiltakene/bua-hamar",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 310,
                Name = "Åpen barnehage (Ankerløkken barnehage)",
                Cost = ResourceCost.Paid,
                MunicipalityId = Hamar,
                Address = "Frivilligsentralens lokaler, Torggata 73, 2317 Hamar",
                Phone = "909 98 617",
                Website = "https://www.hamar.kommune.no/category1034.html",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 311,
                Name = "Prestrud ungdomsklubb",
                MunicipalityId = Hamar,
                Address = "Møtested for ungdommer på iskroa i CC amfi/hockeyhallen",
                Phone = "950 39 833",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 312,
                Name = "Fritidsklubb Wiik",
                Cost = ResourceCost.Paid,
                MunicipalityId = Hamar,
                Address = "Øvre Vang samfunnshus",
                Phone = "950 39 833",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 313,
                Name = "Terningkast 7",
                Cost = ResourceCost.Free,
                MunicipalityId = Hamar,
                Address = "Foajeen, Hamar Kulturhus, Torggata 100, 2317 Hamar",
                Email = "post@terningkast7.org",
                Website = "https://www.terningkast7.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 314,
                Name = "Parkrun Ankerskogen",
                Cost = ResourceCost.Free,
                MunicipalityId = Hamar,
                Address = "Ankerskogen",
                Website = "https://www.parkrun.no/ankerskogen/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 315,
                Name = "Lavterskeltilbud Storgata 9B",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Lillehammer,
                Address = "Storgata 9B",
                Phone = "949 74 618",
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/arbeid-og-aktivitetstilbud/lavterskeltilbud-storgata-9b/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 316,
                Name = "Lavterskeltilbud Gamlevegen 101",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Lillehammer,
                Address = "Gamlevegen 101",
                Phone = "902 43 733",
                Website = "https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/lavterskeltilbud-for-personer-med-rusutfordringer/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 317,
                Name = "Lillehammer Frivilligsentral",
                Cost = ResourceCost.Partly,
                MunicipalityId = Lillehammer,
                Address = "Brubakken 14, 2615 Lillehammer",
                Phone = "992 69 600",
                Email = "post@lillehammer.frivilligsentral.no",
                Website = "https://lillehammer.frivilligsentral.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 318,
                Name = "Lillehammer Røde Kors",
                MunicipalityId = Lillehammer,
                Address = "Anne Mouruds veg 10 G, 2615 Lillehammer",
                Phone = "415 80 011",
                Email = "lillehammer@rodekors.org",
                Website = "https://www.rodekors.no/lokalforeninger/oppland/lillehammer/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 320,
                Name = "Blå Kors gatenært Gjøvik (Kafe Kampen)",
                IsLowThreshold = true,
                MunicipalityId = Gjovik,
                Address = "Øvre Torvgate 8, 2815 Gjøvik",
                Phone = "61 17 04 80",
                Website = "https://www.blakors.no/gatenaert/kampen/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 321,
                Name = "Fontenehuset Gjøvik",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Gjovik,
                Address = "Strandgata 38, 2821 Gjøvik",
                Phone = "977 30 330",
                Email = "post@fontenehusetgjovik.no",
                Website = "https://www.fontenehusetgjovik.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 322,
                Name = "Gjøvik frivilligsentral avd. Sentrum",
                MunicipalityId = Gjovik,
                Address = "Øvre Torvgate 2, Gjøvik",
                Phone = "61 15 85 55",
                Email = "frivilligsentral@gjovik.kommune.no",
                Website = "https://gjovik.frivilligsentral.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 323,
                Name = "Gjøvik frivilligsentral avd. Øverby (Øverbykafeen og Torsdagstreff)",
                MunicipalityId = Gjovik,
                Address = "Øverbyvegen 95, Gjøvik",
                Phone = "61 15 85 55",
                Email = "frivilligsentral@gjovik.kommune.no",
                Website = "https://gjovik.frivilligsentral.no/overby",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 324,
                Name = "PULS - ditt værested (Frelsesarmeen Gjøvik og Toten)",
                MunicipalityId = Gjovik,
                Address = "Bakkegata 14, 2821 Gjøvik",
                Phone = "409 12 050",
                Email = "puls@frelsesarmeen.no",
                Website = "https://frelsesarmeen.no/korps/puls-ditt-vaerested",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 326,
                Name = "Ung i Gjøvik (Ungdommens hus)",
                MunicipalityId = Gjovik,
                Address = "Trondhjemsvegen 8, 2821 Gjøvik",
                Website = "https://www.gjovik.kommune.no/tjenester/barn-ungdom-og-familie/ung-i-gjovik/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 327,
                Name = "Hverdag - Mat & Mening",
                MunicipalityId = Gjovik,
                Address = "Mimes veg 3, 2817 Gjøvik",
                Phone = "929 29 994",
                Email = "post@ashverdag.no",
                Website = "https://www.ashverdag.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 328,
                Name = "Norsktrening (Gjøvik Røde Kors)",
                IsLowThreshold = true,
                MunicipalityId = Gjovik,
                Address = "Gjøvik Læringssenter, Teknologiveien 8, Kallerud, Gjøvik",
                Email = "gjovik.rode.kors@gmail.com",
                Website = "https://www.rodekors.no/lokalforeninger/oppland/gjovik/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 329,
                Name = "Solsia aktivitetshus",
                Cost = ResourceCost.Free,
                MunicipalityId = Ringsaker,
                Address = "Nordåsveien 6, 2380 Brumunddal",
                Phone = "907 78 510",
                Website = "https://www.ringsaker.kommune.no/tjenester/helse-og-omsorg/psykisk-helse-og-rustjenester/kortvarig-psykisk-helsehjelp",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 330,
                Name = "Mental Helse Ringsaker",
                MunicipalityId = Ringsaker,
                Address = "Sjurstuvegen 2B, 2383 Brumunddal",
                Email = "ringsaker@mentalhelse.no",
                Website = "https://mentalhelse.no/ringsaker/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 331,
                Name = "Brumunddal frivilligsentral",
                Cost = ResourceCost.Free,
                MunicipalityId = Ringsaker,
                Address = "Sjurstuvegen 2B, 2383 Brumunddal",
                Phone = "973 47 717",
                Email = "brumunddal@frivillighet.no",
                Website = "https://brumunddal.frivilligsentral.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 332,
                Name = "Moelv frivilligsentral",
                MunicipalityId = Ringsaker,
                Address = "Storgata 119, 2390 Moelv",
                Phone = "974 34 918",
                Email = "post@moelvfrivilligsentral.no",
                Website = "https://moelvfrivilligsentral.no",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 333,
                Name = "Ringsaker Røde Kors: Norsktrening",
                IsLowThreshold = true,
                MunicipalityId = Ringsaker,
                Address = "Kilde Skole, Storgate 31, 2390 Moelv",
                Email = "ringsaker@rodekors.org",
                Website = "https://www.rodekors.no/lokalforeninger/hedmark/ringsaker/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 334,
                Name = "LHL Ringsaker: lavterskeltrim i Brumunddal",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Ringsaker,
                Address = "Buttekvern Aktivitetssenter, Buttekvernveien 1, Brumunddal",
                Phone = "22 79 90 00",
                Website = "https://www.lhl.no/lokallag/lhl-innlandet/lhl-ringsaker/fysisk-aktivitet-brumunddal77/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 335,
                Name = "Stangehjelpa aktivitetshus",
                IsLowThreshold = true,
                MunicipalityId = Stange,
                Address = "Skolegata 13, 2335 Stange",
                Phone = "911 65 956",
                Website = "https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/stangehjelpa/voksne/stangehjelpa-aktivitetshus/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 336,
                Name = "Ottestad frivilligsentral",
                MunicipalityId = Stange,
                Address = "Kjonerudvegen 9, 2312 Ottestad (2. etasje Amtmannsbygget)",
                Phone = "940 93 665",
                Email = "ST-frivilligsentralen@stange.kommune.no",
                Website = "https://www.stange.kommune.no/kultur-og-frivillighet/frivillighet/ottestad-frivilligsentral/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 337,
                Name = "Ungdomshuset i Ottestad",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Stange,
                Address = "Statsminister Otto Blehrs 2, 2312 Ottestad",
                Website = "https://www.stange.kommune.no/kultur-og-frivillighet/aktiviteter-for-ungdom/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 338,
                Name = "Stange musikkverksted",
                IsLowThreshold = true,
                Cost = ResourceCost.Free,
                MunicipalityId = Stange,
                Address = "Skolegata 13, 2335 Stange",
                Website = "https://www.stange.kommune.no/kultur-og-frivillighet/aktiviteter-for-ungdom/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 339,
                Name = "Løten Frivilligsentral",
                MunicipalityId = Loten,
                Address = "Stasjonsvegen 23, Bøndernes Hus, 2340 Løten",
                Phone = "481 41 769",
                Email = "post@loten.frivilligsentral.no",
                Website = "https://loten.frivilligsentral.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 340,
                Name = "Ungdommens hus",
                MunicipalityId = Loten,
                Address = "Venslivegen 13, 2340 Løten",
                Phone = "62 56 40 00",
                Email = "post@loten.kommune.no",
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/barn-unge-og-familie/ungdom/ungdommens-hus/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 341,
                Name = "Felles aktivitet i Løtenhallen",
                MunicipalityId = Loten,
                Address = "Løtenhallen",
                Phone = "62 56 40 00",
                Email = "post@loten.kommune.no",
                Website = "https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rustjenesten/aktiviteter-og-kurs/felles-aktivitet-i-lotenhallen/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 342,
                Name = "BUA Løten",
                Cost = ResourceCost.Free,
                MunicipalityId = Loten,
                Address = "Skolevegen 6, 2340 Løten",
                Phone = "990 80 167",
                Email = "post@loten.kommune.no",
                Website = "https://www.loten.kommune.no/kultur-og-aktivitet/fritidstilbud/bua-loten/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 343,
                Name = "Elverum frivilligsentral",
                MunicipalityId = Elverum,
                Address = "Lærerskolealleen 1, 2408 Elverum",
                Phone = "62 43 64 55",
                Email = "post@elverumfrivilligsentral.no",
                Website = "https://elverum.frivilligsentral.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 344,
                Name = "Møteplassen Elverum",
                MunicipalityId = Elverum,
                Address = "Lærerskolealléen 1, 2408 Elverum",
                Phone = "911 84 893",
                Email = "post@moteplassen.elverum.no",
                Website = "https://moteplassen.elverum.no/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 345,
                Name = "Treffpunktet (Møteplassen Elverum)",
                IsLowThreshold = true,
                MunicipalityId = Elverum,
                Address = "Lærerskolealléen 1, 2408 Elverum",
                Phone = "942 02 575",
                Website = "https://moteplassen.elverum.no/index.php/treffpunkt",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            },
            new Resource
            {
                Id = 346,
                Name = "Ungdommens hus",
                Cost = ResourceCost.Free,
                MunicipalityId = Elverum,
                Address = "St. Olavsgate 6, 2414 Elverum",
                Phone = "489 57 545",
                Website = "https://www.elverum.kommune.no/vare-tjenester/barn-og-familie/ungdommens-hus/",
                LastVerified = VerifiedLavterskelInnlandet,
                CreatedAt = SeededAtLavterskelInnlandet,
                UpdatedAt = SeededAtLavterskelInnlandet,
            });

        modelBuilder.Entity<ResourceTranslation>().HasData(
            new ResourceTranslation
            {
                Id = 1,
                ResourceId = 1,
                LanguageCode = "nb",
                Description = "Gratis og døgnåpen telefontjeneste for alle som trenger noen å snakke med om det som er vanskelig. Du kan være anonym, og de som svarer har taushetsplikt.",
                OpeningHours = "Døgnåpent",
                CostNote = "116 123 er en gratis og døgnåpen telefontjeneste for alle som trenger noen å snakke med.",
            },
            new ResourceTranslation
            {
                Id = 2,
                ResourceId = 1,
                LanguageCode = "en",
                Description = "A free 24-hour phone line for anyone who needs someone to talk to about what is difficult. You can stay anonymous, and everyone who answers is bound by confidentiality.",
                OpeningHours = "Open 24 hours",
                CostNote = "116 123 is a free, 24-hour phone service for anyone who needs someone to talk to.",
            },
            new ResourceTranslation
            {
                Id = 3,
                ResourceId = 2,
                LanguageCode = "nb",
                Description = "Døgnåpen krisetelefon for deg som har det vanskelig eller tenker på selvmord. Tjenesten er anonym, og du trenger ikke ha en bestemt grunn for å ringe.",
                OpeningHours = "Døgnåpent",
                CostNote = "Kirkens SOS tar seg ikke betalt for tjenesten og tjener ingenting på tellerskrittene.",
            },
            new ResourceTranslation
            {
                Id = 4,
                ResourceId = 2,
                LanguageCode = "en",
                Description = "A 24-hour crisis line for anyone in distress or having thoughts of suicide. The service is anonymous, and you do not need a particular reason to call.",
                OpeningHours = "Open 24 hours",
                CostNote = "Kirkens SOS does not charge for the service and earns nothing from the call charges.",
            },
            new ResourceTranslation
            {
                Id = 5,
                ResourceId = 3,
                LanguageCode = "nb",
                Description = "Nasjonalt nummer som setter deg over til legevaktsentralen der du befinner deg, når fastlegen er stengt og du trenger hjelp raskt. Ved akutt livsfare skal du ringe 113.",
                OpeningHours = "Døgnåpent",
                CostNote = "Når du bruker tjenester fra legevakt må du betale en egenandel hvis du ikke har frikort.",
            },
            new ResourceTranslation
            {
                Id = 6,
                ResourceId = 3,
                LanguageCode = "en",
                Description = "A national number that connects you to the out-of-hours medical service where you are, when your regular doctor is closed and you need help quickly. In a life-threatening emergency, call 113 instead.",
                OpeningHours = "Open 24 hours",
                CostNote = "When you use out-of-hours medical services you must pay a co-payment if you do not have an exemption card.",
            },
            new ResourceTranslation
            {
                Id = 7,
                ResourceId = 4,
                LanguageCode = "nb",
                Description = "Gratis døgnåpen telefon for barn og unge som opplever vold, overgrep eller omsorgssvikt. Voksne som er bekymret for et barn kan også ringe.",
                OpeningHours = "Døgnåpent",
                CostNote = "Alarmtelefonen er en gratis tjeneste der du kan henvende deg anonymt.",
            },
            new ResourceTranslation
            {
                Id = 8,
                ResourceId = 4,
                LanguageCode = "en",
                Description = "A free 24-hour phone line for children and young people experiencing violence, abuse or neglect. Adults who are worried about a child can call too.",
                OpeningHours = "Open 24 hours",
                CostNote = "The Alarm Phone is a free service where you can get in touch anonymously.",
            },
            new ResourceTranslation
            {
                Id = 9,
                ResourceId = 5,
                LanguageCode = "nb",
                Description = "Hjelpelinje for deg som opplever vold eller overgrep i nære relasjoner. Også for pårørende og hjelpere, og du kan være helt anonym.",
                OpeningHours = "Døgnåpent",
                CostNote = "Helt gratis og anonymt.",
            },
            new ResourceTranslation
            {
                Id = 10,
                ResourceId = 5,
                LanguageCode = "en",
                Description = "A helpline for anyone experiencing violence or abuse in a close relationship. It is also for relatives and professionals, and you can remain completely anonymous.",
                OpeningHours = "Open 24 hours",
                CostNote = "Completely free and anonymous.",
            },
            new ResourceTranslation
            {
                Id = 11,
                ResourceId = 6,
                LanguageCode = "nb",
                Description = "Gratis veiledning for deg som har økonomiske problemer eller gjeld du ikke klarer å betjene. Du kan få hjelp til å få oversikt over økonomien og sette opp et realistisk budsjett.",
                OpeningHours = "Hverdager 09:00–15:00",
                CostNote = "Tjenesten er gratis, og du bør søke hjelp så tidlig som mulig.",
            },
            new ResourceTranslation
            {
                Id = 12,
                ResourceId = 6,
                LanguageCode = "en",
                Description = "Free guidance for anyone with money problems or debt they cannot manage. You can get help mapping out your finances and building a budget you can actually live with.",
                OpeningHours = "Weekdays 09:00–15:00",
                CostNote = "The service is free, and you should seek help as early as possible.",
            },
            new ResourceTranslation
            {
                Id = 13,
                ResourceId = 7,
                LanguageCode = "nb",
                Description = "Gratis rettshjelp fra jusstudenter i saker om blant annet husleie, gjeld, trygd, arbeid, utlendingsrett og fengsel. Du trenger ikke advokat for å ta kontakt.",
                OpeningHours = "Mandag 17:00–20:00 og tirsdag 10:00–15:00",
                CostNote = "Jussbuss gir gratis rettshjelp i enkeltsaker, og er drevet av jusstudenter.",
            },
            new ResourceTranslation
            {
                Id = 14,
                ResourceId = 7,
                LanguageCode = "en",
                Description = "Free legal aid from law students in areas such as rent, debt, benefits, employment, immigration and prison law. You do not need a lawyer to get in touch.",
                OpeningHours = "Monday 17:00–20:00 and Tuesday 10:00–15:00",
                CostNote = "Jussbuss gives free legal aid in individual cases, and is run by law students.",
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
                Description = "Rådgivning om vanskelige forhold på jobben, som konflikt, mobbing, sykefravær eller oppsigelse. Åpen for arbeidstakere, ledere, tillitsvalgte og arbeidssøkere.",
                OpeningHours = "Mandag, tirsdag, onsdag og fredag 08:30–16:00, torsdag 08:30–18:00",
            },
            new ResourceTranslation
            {
                Id = 18,
                ResourceId = 9,
                LanguageCode = "en",
                Description = "Advice about difficult situations at work, such as conflict, bullying, sick leave or dismissal. Open to employees, managers, union representatives and jobseekers.",
                OpeningHours = "Monday, Tuesday, Wednesday and Friday 08:30–16:00, Thursday 08:30–18:00",
            },
            new ResourceTranslation
            {
                Id = 19,
                ResourceId = 10,
                LanguageCode = "nb",
                Description = "Gratis tilbud om samtale, parterapi og mekling for familier, par og enkeltpersoner. Du trenger ingen henvisning for å bestille time.",
                OpeningHours = "08:30–15:00, redusert om sommeren",
                CostNote = "Tilbudet er gratis.",
            },
            new ResourceTranslation
            {
                Id = 20,
                ResourceId = 10,
                LanguageCode = "en",
                Description = "A free service offering counselling, couples therapy and mediation for families, couples and individuals. No referral is needed to book an appointment.",
                OpeningHours = "08:30–15:00, reduced in summer",
                CostNote = "The service is free.",
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
                CostNote = "Hamar interkommunale krisesenter er et gratis døgnåpent akuttsenter.",
            },
            new ResourceTranslation
            {
                Id = 24,
                ResourceId = 12,
                LanguageCode = "en",
                Description = "A free 24-hour service for women, men, children and older people affected by violence in close relationships. The centre offers both protected accommodation and counselling for those who do not need to stay.",
                OpeningHours = "Open 24 hours",
                CostNote = "Hamar interkommunale krisesenter is a free 24-hour emergency centre.",
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
                CostNote = "Rask psykisk helsehjelp er et gratis og tidsavgrenset tilbud til deg fra 16 år som ønsker hjelp med begynnende og/eller lettere former for angst, depresjon, søvnvansker og alkohol-/rusproblemer.",
            },
            new ResourceTranslation
            {
                Id = 30,
                ResourceId = 15,
                LanguageCode = "en",
                Description = "Short-term treatment for people aged 16 and over with mild anxiety, depression, sleep problems or early substance use difficulties. The service is free and needs no referral from your doctor.",
                OpeningHours = "Monday and Wednesday 11:30–13:00",
                CostNote = "Rask psykisk helsehjelp (rapid mental health help) is a free, time-limited service for you from age 16 who want help with early and/or milder forms of anxiety, depression, sleep problems and alcohol or drug problems.",
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
                CostNote = "Våre tjenester er gratis.",
            },
            new ResourceTranslation
            {
                Id = 34,
                ResourceId = 17,
                LanguageCode = "en",
                Description = "A service for homeless people with substance use or mental health difficulties, where you first get permanent housing and then receive support where you live. The aim is a stable home without requiring sobriety first.",
                OpeningHours = "Weekdays 09:00–15:00",
                CostNote = "Our services are free.",
            },
            new ResourceTranslation
            {
                Id = 35,
                ResourceId = 18,
                LanguageCode = "nb",
                Description = "Team som gir tett oppfølging til voksne med rusproblemer eller psykiske helseutfordringer i hverdagen. Teamet har lang åpningstid, også i helgene.",
                OpeningHours = "Hver dag 09:00–21:00",
                CostNote = "Våre tjenester er gratis.",
            },
            new ResourceTranslation
            {
                Id = 36,
                ResourceId = 18,
                LanguageCode = "en",
                Description = "A team providing close everyday follow-up for adults with substance use or mental health difficulties. The team has long opening hours, including weekends.",
                OpeningHours = "Every day 09:00–21:00",
                CostNote = "Our services are free.",
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
                CostNote = "Tilbudet er gratis.",
            },
            new ResourceTranslation
            {
                Id = 42,
                ResourceId = 21,
                LanguageCode = "en",
                Description = "A free 24-hour service for women, men and children affected by violence in close relationships, rape or forced marriage. The address is only given when you make contact, for safety reasons.",
                OpeningHours = "Open 24 hours",
                CostNote = "The service is free.",
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
                Description = "Nav-kontoret for innbyggere i Stange, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Veiledningssenteret er åpent for selvbetjening.",
                OpeningHours = "Selvbetjent mottak mandag, tirsdag, torsdag og fredag 09.00-14.30 og onsdag 12.00-14.30; betjent mottak onsdag 09.00-12.00",
            },
            new ResourceTranslation
            {
                Id = 52,
                ResourceId = 104,
                LanguageCode = "en",
                Description = "The Nav office for people living in Stange, offering help with financial assistance, work, housing and other social services. The guidance centre is open for self-service.",
                OpeningHours = "Self-service reception Monday, Tuesday, Thursday and Friday 09.00-14.30 and Wednesday 12.00-14.30; staffed reception Wednesday 09.00-12.00",
            },
            new ResourceTranslation
            {
                Id = 53,
                ResourceId = 105,
                LanguageCode = "nb",
                Description = "Stange kommunes samlede lavterskeltilbud innen psykisk helse og rus, for både barn, unge og voksne. Du trenger ingen henvisning, og kan ta kontakt selv i telefontiden.",
                OpeningHours = "Telefontid hverdager 09.00-15.00 (stengt 11.00-11.45)",
                CostNote = "Det er gratis å motta hjelp hos oss.",
            },
            new ResourceTranslation
            {
                Id = 54,
                ResourceId = 105,
                LanguageCode = "en",
                Description = "Stange municipality's combined low-threshold service for mental health and substance use, for children, young people and adults alike. No referral is needed, and you can get in touch yourself during phone hours.",
                OpeningHours = "Phone hours weekdays 09.00-15.00 (closed 11.00-11.45)",
                CostNote = "It is free to receive help from us.",
            },
            new ResourceTranslation
            {
                Id = 55,
                ResourceId = 106,
                LanguageCode = "nb",
                Description = "Kommunens telefon for deg som står i en akutt psykisk krise og trenger noen å snakke med nå. På dagtid settes du over til Stangehjelpa, og i helgene til det interkommunale kriseteamet.",
                OpeningHours = "Hverdager til 15.30 (16.00 fredag) settes over til Stangehjelpa",
                CostNote = "Kriseteam tilbyr gratis hjelp og støtte etter spesielt vanskelige hendelser.",
            },
            new ResourceTranslation
            {
                Id = 56,
                ResourceId = 106,
                LanguageCode = "en",
                Description = "The municipality's line for anyone in an acute mental health crisis who needs to talk to someone now. During the day you are put through to Stangehjelpa, and at weekends to the intermunicipal crisis team.",
                OpeningHours = "Weekdays until 15.30 (16.00 on Fridays) the call goes through to Stangehjelpa",
                CostNote = "The crisis team offers free help and support after especially difficult events.",
            },
            new ResourceTranslation
            {
                Id = 57,
                ResourceId = 107,
                LanguageCode = "nb",
                Description = "Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og følger opp barn, unge og familier. Vakttelefonen er bemannet på dagtid i ukedagene.",
                OpeningHours = "Vakttelefon mandag–fredag 08.30–15.00",
            },
            new ResourceTranslation
            {
                Id = 58,
                ResourceId = 107,
                LanguageCode = "en",
                Description = "The municipal child welfare service, which receives reports of concern and follows up children, young people and families. The duty phone is staffed during weekday daytime hours.",
                OpeningHours = "Duty phone Monday–Friday 08.30–15.00",
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
                CostNote = "Dette er en gratis tjeneste vi tilbyr personer som oppholder seg i Løten kommune, som har behov for det.",
            },
            new ResourceTranslation
            {
                Id = 62,
                ResourceId = 109,
                LanguageCode = "en",
                Description = "Free financial counselling for anyone struggling with debt or unable to make the budget add up. The adviser helps you get an overview and looks at options such as refinancing or a debt settlement.",
                OpeningHours = "Monday, Wednesday and Friday 09.00 – 15.00; Tuesday and Thursday 09.00 – 13.00",
                CostNote = "This is a free service we offer to people who are staying in Løten kommune and who need it.",
            },
            new ResourceTranslation
            {
                Id = 63,
                ResourceId = 110,
                LanguageCode = "nb",
                Description = "Kommunens team for voksne med psykiske vansker, rusproblemer eller begge deler. Krisetelefonen er åpen på dagtid i ukedagene, og bemannes av teamet selv.",
                OpeningHours = "Krisetelefon mandag – fredag kl. 08.00-15.00",
                CostNote = "Tjenesten er gratis.",
            },
            new ResourceTranslation
            {
                Id = 64,
                ResourceId = 110,
                LanguageCode = "en",
                Description = "The municipality's team for adults with mental health difficulties, substance use problems or both. The crisis line is open during weekday daytime hours and is staffed by the team itself.",
                OpeningHours = "Crisis line Monday – Friday 08.00-15.00",
                CostNote = "The service is free.",
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
                CostNote = "Rask psykisk helsehjelp er gratis hjelp for deg over 16 år med milde til moderate psykiske plager.",
            },
            new ResourceTranslation
            {
                Id = 68,
                ResourceId = 112,
                LanguageCode = "en",
                Description = "Free short-term treatment for people aged 16 and over with mild anxiety, low mood, stress or sleep problems. Help is often given by phone, using guided self-help, and no referral is needed.",
                OpeningHours = "08.00-15.30",
                CostNote = "Rask psykisk helsehjelp is free help for you over 16 years with mild to moderate mental health problems.",
            },
            new ResourceTranslation
            {
                Id = 69,
                ResourceId = 113,
                LanguageCode = "nb",
                Description = "Nav-kontoret for innbyggere i Elverum, med hjelp til arbeid, økonomisk sosialhjelp, bolig og sosiale tjenester. Er du i en krisesituasjon uten penger til mat, medisin eller strøm, skal du ta kontakt med en gang.",
                OpeningHours = "Telefontid hverdager kl. 09 - 15",
            },
            new ResourceTranslation
            {
                Id = 70,
                ResourceId = 113,
                LanguageCode = "en",
                Description = "The Nav office for people living in Elverum, offering help with work, financial assistance, housing and social services. If you are in a crisis with no money for food, medicine or electricity, get in touch straight away.",
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
                CostNote = "Våre tjenester er gratis.",
            },
            new ResourceTranslation
            {
                Id = 74,
                ResourceId = 115,
                LanguageCode = "en",
                Description = "The municipality's low-threshold service for adults with substance use or mental health difficulties, offering conversations and follow-up. The service is free and you can make contact yourself.",
                CostNote = "Our services are free.",
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
                CostNote = "Tilbudet er gratis for innbyggerne på grunn av kommunens samarbeidsavtale med senteret, og det er kort ventetid.",
            },
            new ResourceTranslation
            {
                Id = 78,
                ResourceId = 117,
                LanguageCode = "en",
                Description = "A resource centre for people who have experienced sexual abuse, and for their relatives. You can get conversations and support free of charge, without a referral and without having reported it.",
                CostNote = "The service is free for residents because of the municipality's cooperation agreement with the centre, and the waiting time is short.",
            },
            new ResourceTranslation
            {
                Id = 79,
                ResourceId = 118,
                LanguageCode = "nb",
                Description = "Ressurssenter for deg som har opplevd seksuelle overgrep eller incest, og for pårørende. Tilbudet er gratis, og du trenger ingen henvisning.",
                CostNote = "Vi er et tverrfaglig, gratis og lavterskel hjelpetilbud og støttesenter for utsatte av seksuelle overgrep og deres pårørende.",
            },
            new ResourceTranslation
            {
                Id = 80,
                ResourceId = 118,
                LanguageCode = "en",
                Description = "A resource centre for people who have experienced sexual abuse or incest, and for their relatives. The service is free and no referral is needed.",
                CostNote = "We are a multidisciplinary, free and low-threshold help service and support centre for people subjected to sexual abuse and their relatives.",
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
                OpeningHours = "Åpningstiden vår er 09:00–15:00 alle hverdager",
            },
            new ResourceTranslation
            {
                Id = 84,
                ResourceId = 120,
                LanguageCode = "en",
                Description = "The national tax administration, responsible for tax, tax returns and the National Population Register. Contact them about tax cards, underpaid tax, changes of address, name changes and registry certificates.",
                OpeningHours = "Open 09:00–15:00 every weekday",
            },
            new ResourceTranslation
            {
                Id = 85,
                ResourceId = 121,
                LanguageCode = "nb",
                Description = "Gratis og anonymt samtaletilbud for barn og unge under 18 år, på telefon, chat og e-post. Du kan snakke med en voksen om akkurat det du har på hjertet, uansett hvor stort eller lite det er.",
                OpeningHours = "Åpent alle dager, hele året, kl. 14-22 (jule- og sommerferie 16-22)",
                CostNote = "Tilbudet er gratis og du kan være anonym.",
            },
            new ResourceTranslation
            {
                Id = 86,
                ResourceId = 121,
                LanguageCode = "en",
                Description = "A free and anonymous talking service for children and young people under 18, by phone, chat and email. You can talk to an adult about whatever is on your mind, however big or small.",
                OpeningHours = "Open every day, all year, 14.00-22.00 (16.00-22.00 during the Christmas and summer holidays)",
                CostNote = "The service is free and you can be anonymous.",
            },
            new ResourceTranslation
            {
                Id = 87,
                ResourceId = 122,
                LanguageCode = "nb",
                Description = "Mental Helses nettsted der du kan skrive anonymt om det som er vanskelig, i chat eller i forum. Du kan lese om temaer som ensomhet, angst, depresjon og økonomi, og få svar fra andre.",
                CostNote = "Ta kontakt med våre gratis og anonyme svartjenester: Hjelpetelefonen, Arbeidslivstelefonen, Sidetmedord.no eller Foreldresupport.",
            },
            new ResourceTranslation
            {
                Id = 88,
                ResourceId = 122,
                LanguageCode = "en",
                Description = "Mental Helse's website where you can write anonymously about what is difficult, in chat or on the forum. You can read about topics such as loneliness, anxiety, depression and money, and get replies from others.",
                CostNote = "Get in touch with our free and anonymous answer services: Hjelpetelefonen, Arbeidslivstelefonen, Sidetmedord.no or Foreldresupport.",
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
                CostNote = "Det koster ingenting å bo på eller få hjelp av krisesenteret.",
            },
            new ResourceTranslation
            {
                Id = 120,
                ResourceId = 216,
                LanguageCode = "en",
                Description = "A free 24-hour service for anyone affected by violence in a close relationship. You can call for advice and guidance, and the centre also offers a place to stay. The address is kept secret for safety reasons.",
                OpeningHours = "Open 24 hours",
                CostNote = "It costs nothing to stay at or get help from the crisis centre.",
            },
            new ResourceTranslation
            {
                Id = 121,
                ResourceId = 217,
                LanguageCode = "nb",
                Description = "Anonym chat for deg mellom 16 og 25 år som er i en usunn relasjon. Du chatter med fagpersoner som har lang erfaring med vold i nære relasjoner.",
                OpeningHours = "Chat tirsdag 12–20 og fredag 12–15",
                CostNote = "Tjenesten vår er helt gratis å bruke, og du kan ta kontakt så mange ganger du vil.",
            },
            new ResourceTranslation
            {
                Id = 122,
                ResourceId = 217,
                LanguageCode = "en",
                Description = "An anonymous chat for people aged 16 to 25 who are in an unhealthy relationship. You chat with professionals who have long experience with violence in close relationships.",
                OpeningHours = "Chat Tuesday 12–20 and Friday 12–15",
                CostNote = "Our service is completely free to use, and you can get in touch as many times as you like.",
            },
            new ResourceTranslation
            {
                Id = 123,
                ResourceId = 218,
                LanguageCode = "nb",
                Description = "Gratis døgnåpent helsetilbud for deg fra 14 år som har vært utsatt for voldtekt, voldtektsforsøk eller andre seksuelle overgrep. Du kan komme uten å ha anmeldt forholdet til politiet. Gjelder det et barn under 14 år, skal henvendelsen gå til barnemottaket.",
                OpeningHours = "Døgnåpent",
                CostNote = "Mottaket tilbyr gratis medisinsk og psykososial akuttbehandling, krisehjelp og rettsmedisinske undersøkelser.",
            },
            new ResourceTranslation
            {
                Id = 124,
                ResourceId = 218,
                LanguageCode = "en",
                Description = "A free 24-hour health service for people aged 14 and over who have experienced rape, attempted rape or other sexual assault. You can come without having reported it to the police. For a child under 14, the enquiry goes to the children's unit instead.",
                OpeningHours = "Open 24 hours",
                CostNote = "The reception offers free medical and psychosocial emergency treatment, crisis help and forensic examinations.",
            },
            new ResourceTranslation
            {
                Id = 125,
                ResourceId = 219,
                LanguageCode = "nb",
                Description = "Behandlingstilbud til deg over 18 år som bruker vold eller har problemer med sinne og aggresjon. Både kvinner og menn kan få behandling, individuelt eller i gruppe.",
                OpeningHours = "Telefontid mandag–fredag 09.00–15.00",
                CostNote = "ATV har en egenandel på kr 350,- for voksne utøverklienter i individualterapi. For gruppebehandling vil egenandelen variere uavhengig hva slags gruppe det dreier seg om. Mange av tilbudene på ATV har en egenandelsbetaling, mens enkelte kontorer og tilbud er gratis.",
            },
            new ResourceTranslation
            {
                Id = 126,
                ResourceId = 219,
                LanguageCode = "en",
                Description = "A treatment service for people over 18 who use violence or struggle with anger and aggression. Both women and men can receive treatment, individually or in a group.",
                OpeningHours = "Phone hours Monday–Friday 09.00–15.00",
                CostNote = "ATV has a co-payment of kr 350,- for adult perpetrator clients in individual therapy. For group treatment the co-payment will vary regardless of what kind of group it is. Many of ATV's services have a co-payment, while some offices and services are free.",
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
                CostNote = "Tjenesten er gratis, krever ikke henvisning og de ansatte har taushetsplikt etter helsepersonelloven.",
            },
            new ResourceTranslation
            {
                Id = 130,
                ResourceId = 221,
                LanguageCode = "en",
                Description = "The city's 24-hour service for people in an acute crisis. You can talk at the emergency clinic, by phone or by video, and the service can also come to your home. No referral is needed and it is free.",
                OpeningHours = "Open 24 hours",
                CostNote = "The service is free, requires no referral, and the staff are bound by confidentiality under the Health Personnel Act.",
            },
            new ResourceTranslation
            {
                Id = 131,
                ResourceId = 222,
                LanguageCode = "nb",
                Description = "Legevakten i Oslo er åpen hele døgnet for deg som trenger rask helsehjelp når fastlegen er stengt. Ved fare for liv og helse skal du ringe 113.",
                OpeningHours = "Åpent 00–24",
                CostNote = "Du må som hovedregel betale egenandel for behandling på legevakten. Det er ulike priser for behandling på allmennlegevakten, skadelegevakten og psykiatrisk legevakt.",
            },
            new ResourceTranslation
            {
                Id = 132,
                ResourceId = 222,
                LanguageCode = "en",
                Description = "The Oslo emergency clinic is open around the clock for anyone needing urgent medical help when their regular doctor is closed. If there is danger to life, call 113 instead.",
                OpeningHours = "Open 24 hours",
                CostNote = "As a rule you must pay a co-payment for treatment at the emergency clinic. There are different prices for treatment at the general emergency clinic, the injury emergency clinic and the psychiatric emergency clinic.",
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
                OpeningHours = "08.30–15.30. Telefontider 08.30–14.00",
            },
            new ResourceTranslation
            {
                Id = 168,
                ResourceId = 240,
                LanguageCode = "en",
                Description = "A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Bjerke, Grorud and Stovner districts.",
                OpeningHours = "08.30–15.30. Phone hours 08.30–14.00",
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
            },
            new ResourceTranslation
            {
                Id = 183,
                ResourceId = 23,
                LanguageCode = "nb",
                Description = "Ved brann, ulykker eller andre akutte situasjoner, ring nødnummer 110.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 184,
                ResourceId = 23,
                LanguageCode = "en",
                Description = "Call the emergency number 110 for a fire, an accident or another acute situation.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 185,
                ResourceId = 24,
                LanguageCode = "nb",
                Description = "Ring nødnummeret 112 når det er behov for øyeblikkelig hjelp.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 186,
                ResourceId = 24,
                LanguageCode = "en",
                Description = "Call the emergency number 112 when you need immediate help from the police.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 187,
                ResourceId = 25,
                LanguageCode = "nb",
                Description = "Ring 113 om situasjonen er kritisk, og det står om liv og helse.",
                OpeningHours = "Døgnåpent",
            },
            new ResourceTranslation
            {
                Id = 188,
                ResourceId = 25,
                LanguageCode = "en",
                Description = "Call 113 when the situation is critical and life or health is at risk.",
                OpeningHours = "Open 24 hours",
            },
            new ResourceTranslation
            {
                Id = 189,
                ResourceId = 301,
                LanguageCode = "nb",
                Description = "Brukerstyrt senter i Hamar med kafé, kreative og musikalske verksteder, friluftsliv og arbeidstrening. Alle aktiviteter er rusfrie, og du kan ta kontakt selv.",
                OpeningHours = "Mandag til fredag, 08:00–15:30 (kontor). Mandag til torsdag, 11:30–13:00 (kafé).",
            },
            new ResourceTranslation
            {
                Id = 190,
                ResourceId = 301,
                LanguageCode = "en",
                Description = "A user-run centre in Hamar with a café, creative and music workshops, outdoor activities and work training. All activities are drug-free, and you can get in touch yourself.",
                OpeningHours = "Monday to Friday, 08:00–15:30 (office). Monday to Thursday, 11:30–13:00 (café).",
            },
            new ResourceTranslation
            {
                Id = 191,
                ResourceId = 302,
                LanguageCode = "nb",
                Description = "Møteplass i Hamar sentrum som kobler folk i nærmiljøet, med grupper, kafeer og tjenester. Her holder blant annet Skeiv kafé ungdom (onsdager 18:00-21:00) til, for 13 til 19 år.",
                OpeningHours = "Man-tor kl 10.00-15.00; Fre kl 10.00-13.00",
            },
            new ResourceTranslation
            {
                Id = 192,
                ResourceId = 302,
                LanguageCode = "en",
                Description = "A meeting place in central Hamar that connects people locally, with groups, cafés and services. Skeiv kafé for young people (Wednesdays 18:00-21:00) is held here, for ages 13 to 19.",
                OpeningHours = "Monday to Thursday 10:00-15:00; Friday 10:00-13:00",
            },
            new ResourceTranslation
            {
                Id = 193,
                ResourceId = 303,
                LanguageCode = "nb",
                Description = "Ungdomshus på Torghjørnet for ungdom på ungdomsskolen og videregående. Du kan komme innom for å møte trygge voksne, delta på aktiviteter eller bare være sammen med andre, og tilbudet er rusfritt.",
                OpeningHours = "Mandag og onsdag klokka 14:30-21:30. Fredag klokka 14:30-22:00. Lørdag klokka 16:00-22:00.",
            },
            new ResourceTranslation
            {
                Id = 194,
                ResourceId = 303,
                LanguageCode = "en",
                Description = "A youth house at Torghjørnet for pupils at lower and upper secondary school. You can drop in to meet safe adults, join activities or just spend time with others, and it is drug-free.",
                OpeningHours = "Monday and Wednesday 14:30-21:30. Friday 14:30-22:00. Saturday 16:00-22:00.",
            },
            new ResourceTranslation
            {
                Id = 195,
                ResourceId = 304,
                LanguageCode = "nb",
                Description = "Tilbud i Hamar sentrum for aktive rusmiddelavhengige over 18 år fra Hamar og Stange. Du kan få mat, sprøytebytte, sårstell og prevensjon, og juridisk hjelp.",
                OpeningHours = "Tirsdag og torsdag: kl. 10-14.30. Onsdag: stengt. Mandag og fredag: kl. 9-15 (brukerutstyr).",
            },
            new ResourceTranslation
            {
                Id = 196,
                ResourceId = 304,
                LanguageCode = "en",
                Description = "A service in central Hamar for active drug users over 18 from Hamar and Stange. You can get food, syringe exchange, wound care and contraception, and legal help.",
                OpeningHours = "Tuesday and Thursday: 10:00-14:30. Wednesday: closed. Monday and Friday: 9:00-15:00 (user equipment).",
            },
            new ResourceTranslation
            {
                Id = 197,
                ResourceId = 305,
                LanguageCode = "nb",
                Description = "Kontaktsenter i Torggata for mennesker som sliter med rus. Det deles ut mat hver onsdag, det serveres middag i kontaktkafeen, og du kan få samtale med sosionom.",
                OpeningHours = "hver onsdag kl. 12:00 – 16:00",
            },
            new ResourceTranslation
            {
                Id = 198,
                ResourceId = 305,
                LanguageCode = "en",
                Description = "A contact centre in Torggata for people struggling with drug use. Food is handed out every Wednesday, dinner is served in the contact café, and you can talk to a social worker.",
                OpeningHours = "every Wednesday 12:00-16:00",
            },
            new ResourceTranslation
            {
                Id = 199,
                ResourceId = 306,
                LanguageCode = "nb",
                Description = "Møtested for familier med barn mellom 0 og 16 år og gravide, med lek, felles kjøkken, aktiviteter og samtaler. Du kan ta kontakt selv uten henvisning.",
                OpeningHours = "Mandag til fredag: 08.00 til 16.00",
                CostNote = "Gratis lavterskeltilbud",
            },
            new ResourceTranslation
            {
                Id = 200,
                ResourceId = 306,
                LanguageCode = "en",
                Description = "A meeting place for families with children aged 0 to 16 and pregnant women, with play rooms, a shared kitchen, activities and conversations. You can get in touch yourself without a referral.",
                OpeningHours = "Monday to Friday: 08:00 to 16:00",
                CostNote = "Free low-threshold service",
            },
            new ResourceTranslation
            {
                Id = 201,
                ResourceId = 307,
                LanguageCode = "nb",
                Description = "Nytt støttesenter for pårørende og etterlatte til mennesker med uhelbredelig sykdom, åpnet 28. september 2026. Det skal være en åpen møteplass i Høyensalgata 74.",
            },
            new ResourceTranslation
            {
                Id = 202,
                ResourceId = 307,
                LanguageCode = "en",
                Description = "A new support centre for relatives and bereaved of people with an incurable illness, opened on 28 September 2026. It is meant to be an open meeting place at Høyensalgata 74.",
            },
            new ResourceTranslation
            {
                Id = 203,
                ResourceId = 308,
                LanguageCode = "nb",
                Description = "Lokalforening med faste ukentlige tilbud som Onsdagsgjengen for voksne mot sosial isolasjon, leksehjelp og Barnas Røde Kors for barn i 1. til 7. trinn, og besøkstjeneste.",
            },
            new ResourceTranslation
            {
                Id = 204,
                ResourceId = 308,
                LanguageCode = "en",
                Description = "A local association with weekly offers such as Onsdagsgjengen for adults against social isolation, homework help and Barnas Røde Kors for children in grades 1 to 7, and a visiting service.",
            },
            new ResourceTranslation
            {
                Id = 205,
                ResourceId = 309,
                LanguageCode = "nb",
                Description = "Gratis utlån av sports- og friluftsutstyr for sommer og vinter, åpent for alle. Utlånet er på Torghjørnet ved Stortorget.",
                OpeningHours = "Man., tors. og fred.: kl. 13.00-18.00.",
                CostNote = "helt gratis",
            },
            new ResourceTranslation
            {
                Id = 206,
                ResourceId = 309,
                LanguageCode = "en",
                Description = "Free lending of sports and outdoor equipment for summer and winter, open to everyone. The lending point is at Torghjørnet by Stortorget.",
                OpeningHours = "Monday, Thursday and Friday: 13:00-18:00.",
                CostNote = "completely free",
            },
            new ResourceTranslation
            {
                Id = 207,
                ResourceId = 310,
                LanguageCode = "nb",
                Description = "Åpen barnehage for barn under skolealder sammen med en voksen, med fast sangstund og frilek i Frivilligsentralens lokaler. Ta med mat og drikke selv.",
                OpeningHours = "Onsdager og torsdager kl. 10:00-14:00",
                CostNote = "Pris kr 10 pr barn pr dag, ha med mat og drikke selv, kaffe / te kan kjøpes.",
            },
            new ResourceTranslation
            {
                Id = 208,
                ResourceId = 310,
                LanguageCode = "en",
                Description = "An open kindergarten for children under school age together with an adult, with a set song time and free play at the volunteer centre's premises. Bring your own food and drink.",
                OpeningHours = "Wednesdays and Thursdays 10:00-14:00",
                CostNote = "Price kr 10 per child per day, bring your own food and drink, coffee / tea can be bought.",
            },
            new ResourceTranslation
            {
                Id = 209,
                ResourceId = 311,
                LanguageCode = "nb",
                Description = "Ungdomsklubb for 13 til 18 år på iskroa i CC amfi/hockeyhallen, med biljard, bordtennis, airhockey, matlaging, gaming og diskotek.",
                OpeningHours = "Mandag og onsdag klokka 17.30-21.00, fredag klokka 18.00-23.00.",
            },
            new ResourceTranslation
            {
                Id = 210,
                ResourceId = 311,
                LanguageCode = "en",
                Description = "A youth club for ages 13 to 18 at iskroa in CC amfi/the hockey hall, with pool, table tennis, air hockey, cooking, gaming and discos.",
                OpeningHours = "Monday and Wednesday 17:30-21:00, Friday 18:00-23:00.",
            },
            new ResourceTranslation
            {
                Id = 211,
                ResourceId = 312,
                LanguageCode = "nb",
                Description = "Ungdomsklubb for 13 til 18 år i Øvre Vang samfunnshus, med biljard, bordtennis, kortspill, dansematte, TV-spill og diskotek.",
                OpeningHours = "Åpen mandag, tirsdag og torsdag klokka 18.00 - 22.00.",
                CostNote = "Medlemskap kr 120,- pr skoleår.",
            },
            new ResourceTranslation
            {
                Id = 212,
                ResourceId = 312,
                LanguageCode = "en",
                Description = "A youth club for ages 13 to 18 at Øvre Vang samfunnshus, with pool, table tennis, card games, a dance mat, video games and discos.",
                OpeningHours = "Open Monday, Tuesday and Thursday 18:00 - 22:00.",
                CostNote = "Membership kr 120,- per school year.",
            },
            new ResourceTranslation
            {
                Id = 213,
                ResourceId = 313,
                LanguageCode = "nb",
                Description = "Spillforening i Hamar for brettspill, rollespill, kortspill og miniatyrspill. Hver onsdag er det sosial brettspilling i Foajeen på Hamar Kulturhus, og alle er velkomne, også nybegynnere.",
                OpeningHours = "hver onsdag kl 16:00",
                CostNote = "Spillkveldene våre på onsdager er helt gratis å delta på.",
            },
            new ResourceTranslation
            {
                Id = 214,
                ResourceId = 313,
                LanguageCode = "en",
                Description = "A gaming club in Hamar for board games, role-playing, card games and miniature games. Every Wednesday there is social board gaming in the foyer at Hamar Kulturhus, and everyone is welcome, beginners too.",
                OpeningHours = "every Wednesday at 16:00",
                CostNote = "Our game nights on Wednesdays are completely free to join.",
            },
            new ResourceTranslation
            {
                Id = 215,
                ResourceId = 314,
                LanguageCode = "nb",
                Description = "Gratis ukentlig gå-, jogge- eller løpetilbud i Ankerskogen. Barn under 11 år kan løpe sammen med en voksen.",
                OpeningHours = "Hver lørdag kl 09.30",
                CostNote = "Gratis tilbud.",
            },
            new ResourceTranslation
            {
                Id = 216,
                ResourceId = 314,
                LanguageCode = "en",
                Description = "A free weekly walk, jog or run in Ankerskogen. Children under 11 can run together with an adult.",
                OpeningHours = "Every Saturday at 09:30",
                CostNote = "Free of charge.",
            },
            new ResourceTranslation
            {
                Id = 217,
                ResourceId = 315,
                LanguageCode = "nb",
                Description = "Kommunalt møtested i Storgata 9B for deg over 18 år som har erfaring med psykiske helseutfordringer og vil være med i et fellesskap med aktivitet og struktur. Du kan komme som du er, uten påmelding.",
                OpeningHours = "Mandag og fredag: klokken 09.30 til 15.00; Onsdager: klokken 09:30 - 15:00 denne dagen er det tur fra 11.30 - 15.00",
                CostNote = "Tilbudet er gratis, og du trenger ikke melde deg på.",
            },
            new ResourceTranslation
            {
                Id = 218,
                ResourceId = 315,
                LanguageCode = "en",
                Description = "A municipal meeting place at Storgata 9B for people over 18 who have experience with mental health challenges and want to take part in a community with activity and structure. You can come as you are, without signing up.",
                OpeningHours = "Monday and Friday: 09:30 to 15:00; Wednesday: 09:30 - 15:00, on this day there is a trip from 11:30 - 15:00",
                CostNote = "The service is free, and you do not need to sign up.",
            },
            new ResourceTranslation
            {
                Id = 219,
                ResourceId = 316,
                LanguageCode = "nb",
                Description = "Drop-in-tilbud i Gamlevegen 101 for deg som har rusutfordringer eller er pårørende. Du kan komme innom for lunsj og en prat, få veiledning og hjelp med praktiske ting, og hente brukerutstyr. Det kreves ikke rusfrihet.",
                OpeningHours = "Mandager og torsdager fra 11.00 til 13.00 hele året",
                CostNote = "Tilbudet er gratis",
            },
            new ResourceTranslation
            {
                Id = 220,
                ResourceId = 316,
                LanguageCode = "en",
                Description = "A drop-in service at Gamlevegen 101 for people with substance use challenges and their relatives. You can come by for lunch and a chat, get guidance and help with practical things, and collect user equipment. You do not need to be drug-free.",
                OpeningHours = "Mondays and Thursdays from 11:00 to 13:00 all year",
                CostNote = "The service is free",
            },
            new ResourceTranslation
            {
                Id = 221,
                ResourceId = 317,
                LanguageCode = "nb",
                Description = "Møteplass i Lillehammer sentrum der du kan komme innom for kaffe og prat, kortspill, håndarbeid, språkkafé og andre fellesskap. Frivillige kan også hjelpe med besøksvenn, følge til lege, data og mobil, og skjemaer og brev fra det offentlige.",
                OpeningHours = "Vår kjernetid er fra mandag til torsdag 10.00 til 14.00. Fredag fra 10.00 til 13.00.",
                CostNote = "Alle våre aktiviteter er gratis og krever ingen påmelding. Vi tar 5 kroner for A4, 10 kr for A3, laminering/fotopapir 15 kroner.",
            },
            new ResourceTranslation
            {
                Id = 222,
                ResourceId = 317,
                LanguageCode = "en",
                Description = "A meeting place in central Lillehammer where you can drop in for coffee and a chat, card games, handicrafts, a language café and other social groups. Volunteers can also help with a visiting friend, accompaniment to the doctor, computers and phones, and forms and letters from public bodies.",
                OpeningHours = "Our core hours are Monday to Thursday 10:00 to 14:00. Friday from 10:00 to 13:00.",
                CostNote = "All our activities are free and need no sign-up. We charge 5 kroner for A4, 10 kr for A3, 15 kroner for laminating/photo paper.",
            },
            new ResourceTranslation
            {
                Id = 223,
                ResourceId = 318,
                LanguageCode = "nb",
                Description = "Lokalforeningen har faste møteplasser: Onsdagstreffen for seniorer med trim, kaffe og vafler, Barnas Røde Kors for barn i 1. til 7. klasse, og Norsktrening for deg som vil øve norsk. Besøksvenn-tilbudet er for deg som kjenner deg ensom.",
                OpeningHours = "Onsdagstreffen: Onsdager (kl.10:30 for trim) kl.11:00-13:00; Barnas Røde Kors: Onsdager 18:00-19:30; Norsktrening: Tirsdager 17:00-19:00",
            },
            new ResourceTranslation
            {
                Id = 224,
                ResourceId = 318,
                LanguageCode = "en",
                Description = "The local branch runs regular meeting places: Onsdagstreffen for seniors with light exercise, coffee and waffles, Barnas Røde Kors for children in grades 1 to 7, and Norsktrening for people who want to practise Norwegian. The Besøksvenn visiting service is for people who feel lonely.",
                OpeningHours = "Onsdagstreffen: Wednesdays (10:30 for exercise) 11:00-13:00; Barnas Røde Kors: Wednesdays 18:00-19:30; Norsktrening: Tuesdays 17:00-19:00",
            },
            new ResourceTranslation
            {
                Id = 225,
                ResourceId = 320,
                LanguageCode = "nb",
                Description = "Kafé og møtested i Gjøvik sentrum for rusavhengige og bostedsløse, med frokost, middag, kaffe og gratis aktiviteter som brettspill, quiz og kino. Du kan også snakke med en sosionom om livssituasjonen din.",
                OpeningHours = "Mandag til fredag 12.00 – 15.00",
            },
            new ResourceTranslation
            {
                Id = 226,
                ResourceId = 320,
                LanguageCode = "en",
                Description = "A café and meeting place in central Gjøvik for people with substance dependence and people without housing, with breakfast, dinner, coffee and free activities such as board games, quiz and cinema. You can also talk to a social worker about your situation.",
                OpeningHours = "Monday to Friday 12.00 – 15.00",
            },
            new ResourceTranslation
            {
                Id = 227,
                ResourceId = 321,
                LanguageCode = "nb",
                Description = "Arbeidsfellesskap for deg som er 16 år eller eldre og har eller har hatt en psykisk helseutfordring. Du blir medlem gratis, uten henvisning, og kan bruke huset til arbeid, studier og sosialt fellesskap.",
                OpeningHours = "Mandag – fredag kl 08:00-15:30",
                CostNote = "Å være medlem på Fontenehuset koster ingenting.",
            },
            new ResourceTranslation
            {
                Id = 228,
                ResourceId = 321,
                LanguageCode = "en",
                Description = "A work community for people aged 16 or older who have or have had a mental health challenge. Membership is free and needs no referral, and you can use the house for work, studies and social community.",
                OpeningHours = "Monday – Friday 08:00-15:30",
                CostNote = "Being a member of Fontenehuset costs nothing.",
            },
            new ResourceTranslation
            {
                Id = 229,
                ResourceId = 322,
                LanguageCode = "nb",
                Description = "Frivilligsentralen i Gjøvik sentrum er en møteplass som formidler kontakt mellom folk i lokalmiljøet. Faste tilbud er blant annet Globus kafé (mandag, tirsdag, onsdag og fredag kl. 11.00-15.00 og torsdager kl. 11.00-13.00), Kaffetreff på Sørbyen omsorgssenter (torsdager kl. 11.00-13.00, kaffe og vaffel 30 kr, ingen påmelding), Strikkekafé (mandager på like uker kl. 11:00-14:00, servering 20 kr), Turgruppa (tirsdager fra kl. 11.00), Kom og spis (onsdager, 120 kr, krever påmelding) og gratis advokathjelp annenhver onsdag kl. 18.00-20.00.",
            },
            new ResourceTranslation
            {
                Id = 230,
                ResourceId = 322,
                LanguageCode = "en",
                Description = "The volunteer centre in central Gjøvik is a meeting place that connects people in the local community. Regular offers include Globus café (Monday, Tuesday, Wednesday and Friday 11.00-15.00 and Thursdays 11.00-13.00), a coffee meeting at Sørbyen care centre (Thursdays 11.00-13.00, coffee and waffle 30 kr, no sign-up), a knitting café (Mondays in even weeks 11:00-14:00, refreshments 20 kr), a walking group (Tuesdays from 11.00), Kom og spis (Wednesdays, 120 kr, sign-up required) and free legal advice every other Wednesday 18.00-20.00.",
            },
            new ResourceTranslation
            {
                Id = 231,
                ResourceId = 323,
                LanguageCode = "nb",
                Description = "Avdeling Øverby av frivilligsentralen driver Øverbykafeen og Torsdagstreff i Øverbyvegen 95, drevet av frivillige. Du kan komme innom i åpningstiden.",
                OpeningHours = "Mandager: 11.00-13.30 Torsdager: 10.00-13.00 Søndager: 11.00-14.00",
            },
            new ResourceTranslation
            {
                Id = 232,
                ResourceId = 323,
                LanguageCode = "en",
                Description = "The Øverby branch of the volunteer centre runs the Øverby café and a Thursday meeting at Øverbyvegen 95, run by volunteers. You can drop in during opening hours.",
                OpeningHours = "Mondays: 11.00-13.30 Thursdays: 10.00-13.00 Sundays: 11.00-14.00",
            },
            new ResourceTranslation
            {
                Id = 233,
                ResourceId = 324,
                LanguageCode = "nb",
                Description = "Værested og kafé for alle, særlig for deg som er ensom, innvandrer eller har en åndelig lengsel. Det er blant annet kreativ kafé og baby- og småbarnskafé på torsdager, kulturkafé annenhver torsdag og FredagsPULS annenhver fredag. På samme adresse holder Frelsesarmeen også Åpent Hus Velferd annenhver mandag kl. 10-12, et treffpunkt uten krav og forventninger for folk bosatt i Gjøvik, Vestre Toten og Østre Toten. Der kan du bli med på dagsturer, sang og musikk og kurs i selvhjelp, få hjelp med jobbsøknader og bruke PC, og det finnes en gratis samtale- og veiledningstjeneste.",
                OpeningHours = "Onsdag og fredag kl. 11.00-15.00. Torsdag kl. 11.00-18.00 de torsdagene det er Kulturkafé. Ellers til kl. 15.00.",
            },
            new ResourceTranslation
            {
                Id = 234,
                ResourceId = 324,
                LanguageCode = "en",
                Description = "A drop-in place and café open to everyone, especially people who are lonely, immigrants or have a spiritual longing. It has a creative café and a baby and toddler café on Thursdays, a culture café every other Thursday and FredagsPULS every other Friday. At the same address Frelsesarmeen also runs Åpent Hus Velferd every other Monday 10-12, a meeting point without demands or expectations for people living in Gjøvik, Vestre Toten and Østre Toten. You can join day trips, singing and music and self-help courses, get help with job applications and use a PC, and there is a free conversation and guidance service.",
                OpeningHours = "Wednesday and Friday 11.00-15.00. Thursday 11.00-18.00 on the Thursdays with a culture café, otherwise until 15.00.",
            },
            new ResourceTranslation
            {
                Id = 235,
                ResourceId = 326,
                LanguageCode = "nb",
                Description = "Ungdommens hus er et samlingspunkt for ungdom i Gjøvik med møteplasser, aktiviteter, turer og arrangementer, alltid med en trygg voksen til stede. Huset er åpent for deg som går på ungdomsskolen eller videregående.",
                OpeningHours = "Mandag Stengt, Tirsdag 14:00-18:00, Onsdag 14:00-18:00, Torsdag 14:00-21:00, Fredag Stengt, Lørdag-søndag Stengt",
            },
            new ResourceTranslation
            {
                Id = 236,
                ResourceId = 326,
                LanguageCode = "en",
                Description = "The youth house is a gathering place for young people in Gjøvik with meeting places, activities, trips and events, always with a trusted adult present. It is open to pupils at lower and upper secondary school.",
                OpeningHours = "Monday closed, Tuesday 14:00-18:00, Wednesday 14:00-18:00, Thursday 14:00-21:00, Friday closed, Saturday-Sunday closed",
            },
            new ResourceTranslation
            {
                Id = 237,
                ResourceId = 327,
                LanguageCode = "nb",
                Description = "Kafé, catering og utleie i Sørbyen, drevet av frivillige og folk på arbeidstrening. Hver onsdag er det langåpent med familievennlig middag og kulturelle opplevelser på kvelden.",
                OpeningHours = "Onsdag: 11:00 - 18:00 Kjøkkenet stenger kl. 17:30 Torsdag: 11:00 - 16:00 Kjøkkenet stenger kl. 15:30 Fredag: 11:00 - 16:00 Kjøkkenet stenger kl. 15:30",
            },
            new ResourceTranslation
            {
                Id = 238,
                ResourceId = 327,
                LanguageCode = "en",
                Description = "A café, catering and venue hire in Sørbyen, run by volunteers and people in work training. Every Wednesday it stays open late with a family-friendly dinner and cultural events in the evening.",
                OpeningHours = "Wednesday: 11:00 - 18:00 the kitchen closes at 17:30 Thursday: 11:00 - 16:00 the kitchen closes at 15:30 Friday: 11:00 - 16:00 the kitchen closes at 15:30",
            },
            new ResourceTranslation
            {
                Id = 239,
                ResourceId = 328,
                LanguageCode = "nb",
                Description = "Ukentlig møte der du kan øve på norsk i trygge og uformelle rammer sammen med frivillige fra lokalmiljøet, som et tillegg til norskundervisningen. Du trenger ikke melde deg på, det er bare å møte opp.",
                OpeningHours = "hver tirsdag etter skoletid mellom 14.30 og 16.30",
            },
            new ResourceTranslation
            {
                Id = 240,
                ResourceId = 328,
                LanguageCode = "en",
                Description = "A weekly meeting where you can practise Norwegian in safe, informal settings with volunteers from the local community, as a supplement to formal Norwegian classes. You do not need to sign up, you just turn up.",
                OpeningHours = "every Tuesday after school between 14.30 and 16.30",
            },
            new ResourceTranslation
            {
                Id = 241,
                ResourceId = 329,
                LanguageCode = "nb",
                Description = "Aktivitetshus i Brumunddal for deg over 18 år som har utfordringer med psykisk helse og/eller rus og vil ha et sted å møte andre. Du velger selv hvilke aktiviteter du vil delta på, blant annet friluftsgruppe, trening og fredagsgruppe for unge voksne. Mandag og onsdag er åpent for alle, og torsdag er for deg med rusutfordringer. Én tirsdagskveld i måneden er det kveldsåpent for deg med rusutfordringer.",
                OpeningHours = "Tidspunkt: 10:00-14:00 (unntatt tirsdag 17:00-19:00)",
                CostNote = "Solsia aktivitetshus er gratis tilbud for deg over 18 år",
            },
            new ResourceTranslation
            {
                Id = 242,
                ResourceId = 329,
                LanguageCode = "en",
                Description = "An activity house in Brumunddal for people over 18 who face mental health and/or substance use challenges and want a place to meet others. You choose which activities to join, including an outdoor group, exercise and a Friday group for young adults. Monday and Wednesday are open to everyone, and Thursday is for people with substance use challenges. One Tuesday evening a month is open to people with substance use challenges.",
                OpeningHours = "Time: 10:00-14:00 (except Tuesday 17:00-19:00)",
                CostNote = "Solsia activity house is a free offer for you over 18 years old",
            },
            new ResourceTranslation
            {
                Id = 243,
                ResourceId = 330,
                LanguageCode = "nb",
                Description = "Den lokale foreningen Mental Helse har en fast, åpen møteplass i lokalene til Brumunddal frivilligsentral hver tirsdag. Du kan komme for å treffe andre, spise lunsj og ta en kaffe.",
                OpeningHours = "Tirsdag kl. 10.00 – 14.00",
            },
            new ResourceTranslation
            {
                Id = 244,
                ResourceId = 330,
                LanguageCode = "en",
                Description = "The local Mental Helse association runs a regular open meeting place every Tuesday in the premises of Brumunddal volunteer centre. You can come to meet others, have lunch and a coffee.",
                OpeningHours = "Tuesday 10.00 – 14.00",
            },
            new ResourceTranslation
            {
                Id = 245,
                ResourceId = 331,
                LanguageCode = "nb",
                Description = "Frivilligsentral i Brumunddal som skal være en møteplass på tvers av generasjoner. Gruppene er åpne for alle, blant annet en turgruppe på onsdager og strikkekafé annenhver torsdag.",
                CostNote = "Alle gruppearrangement er åpne for alle og gratis å delta på.",
            },
            new ResourceTranslation
            {
                Id = 246,
                ResourceId = 331,
                LanguageCode = "en",
                Description = "A volunteer centre in Brumunddal meant to be a meeting place across generations. The groups are open to everyone, including a walking group on Wednesdays and a knitting café every other Thursday.",
                CostNote = "All group events are open to everyone and free to take part in.",
            },
            new ResourceTranslation
            {
                Id = 247,
                ResourceId = 332,
                LanguageCode = "nb",
                Description = "Frivilligsentral i Moelv med faste møter som Tirsdagskafé hver tirsdag kl. 11.00 – 13.00 og Strikkekafé og Hobbytreff hver torsdag kl. 11.00 - 13.00. Alle er velkommen, og kaffe, vafler og rundstykker selges i kafeen.",
                OpeningHours = "Mandag til fredag er vår kjernetiden kl. 10.00 - 14.00.",
            },
            new ResourceTranslation
            {
                Id = 248,
                ResourceId = 332,
                LanguageCode = "en",
                Description = "A volunteer centre in Moelv with regular meetings such as the Tuesday café every Tuesday 11.00 – 13.00 and a knitting café and hobby meeting every Thursday 11.00 - 13.00. Everyone is welcome, and coffee, waffles and rolls are sold at the café.",
                OpeningHours = "Monday to Friday is our core time, 10.00 - 14.00.",
            },
            new ResourceTranslation
            {
                Id = 249,
                ResourceId = 333,
                LanguageCode = "nb",
                Description = "Åpen møteplass i Moelv der du kan øve muntlig norsk og bli kjent med andre, uansett hvor mye norsk du kan fra før. Du trenger ikke melde deg på, du møter bare opp på Kilde Skole.",
                OpeningHours = "Tirsdager fra kl. 18:00 – 20:00",
            },
            new ResourceTranslation
            {
                Id = 250,
                ResourceId = 333,
                LanguageCode = "en",
                Description = "An open meeting place in Moelv where you can practise spoken Norwegian and get to know others, whatever your level of Norwegian. You do not need to sign up, you just turn up at Kilde Skole.",
                OpeningHours = "Tuesdays from 18:00 – 20:00",
            },
            new ResourceTranslation
            {
                Id = 251,
                ResourceId = 334,
                LanguageCode = "nb",
                Description = "Ukentlig treningstime på Buttekvern Aktivitetssenter i Brumunddal som skal få opp pulsen og få kroppen i bevegelse. Trimmen er gratis og åpen for alle.",
                OpeningHours = "Ukentlig kl. 11.00–13.00",
                CostNote = "Trimmen er gratis og åpen for alle.",
            },
            new ResourceTranslation
            {
                Id = 252,
                ResourceId = 334,
                LanguageCode = "en",
                Description = "A weekly exercise hour at Buttekvern activity centre in Brumunddal to raise your pulse and get your body moving. The session is free and open to everyone.",
                OpeningHours = "Weekly 11.00–13.00",
                CostNote = "The exercise session is free and open to everyone.",
            },
            new ResourceTranslation
            {
                Id = 253,
                ResourceId = 335,
                LanguageCode = "nb",
                Description = "Aktivitetshuset i Stange er et sted for mennesker med ulike livsutfordringer, med sosialt samvær, lunsj, kreative aktiviteter, kurs, hyggekvelder, sykkelverksted og bruktbutikken Loppa. Du kan ta direkte kontakt selv, og det finnes gratis transport for deg som trenger det.",
                OpeningHours = "Allaktivitetshuset: mandag-fredag 09.00-15.00, Kjernetid (10.00-14.00). Loppa: mandag, onsdag, fredag 10.00-14.00. Sykkelverkstedet: mandag, onsdag, torsdag 10.00-14.00",
            },
            new ResourceTranslation
            {
                Id = 254,
                ResourceId = 335,
                LanguageCode = "en",
                Description = "The activity house in Stange is a place for people with different life challenges, with social time, lunch, creative activities, courses, evening get-togethers, a bike workshop and the second-hand shop Loppa. You can contact them yourself, and free transport is available if you need it.",
                OpeningHours = "Activity house: Monday to Friday 09.00-15.00, core hours 10.00-14.00. The second-hand shop Loppa: Monday, Wednesday, Friday 10.00-14.00. The bike workshop: Monday, Wednesday, Thursday 10.00-14.00",
            },
            new ResourceTranslation
            {
                Id = 255,
                ResourceId = 336,
                LanguageCode = "nb",
                Description = "Frivilligsentralen i Ottestad er en åpen møteplass i Fløibygningen på Kjonerudtunet, drevet av kommunen. Den arrangerer aktiviteter og sammenkomster gjennom året, noen for bestemte grupper og andre for alle, og tar imot dem som vil bidra som frivillige.",
                OpeningHours = "Mandag - torsdag kl. 10:00-14:00",
            },
            new ResourceTranslation
            {
                Id = 256,
                ResourceId = 336,
                LanguageCode = "en",
                Description = "The volunteer centre in Ottestad is an open meeting place in the Fløi building at Kjonerudtunet, run by the kommune. It holds activities and gatherings through the year, some for set groups and others for everyone, and welcomes people who want to volunteer.",
                OpeningHours = "Monday to Thursday 10:00-14:00",
            },
            new ResourceTranslation
            {
                Id = 257,
                ResourceId = 337,
                LanguageCode = "nb",
                Description = "Ungdomshuset i Ottestad er et kommunalt tilbud om aktivitet og sosialt samvær for ungdom mellom 13 og 18 år. Der finnes biljard, bordtennis og et musikkverksted, og ungdommene kan være med på å påvirke aktivitetene.",
                OpeningHours = "Mandag 15.00-21.00, Torsdag 15.00-21.00",
            },
            new ResourceTranslation
            {
                Id = 258,
                ResourceId = 337,
                LanguageCode = "en",
                Description = "The youth house in Ottestad is a municipal offer of activities and social time for young people aged 13 to 18. It has a pool table, table tennis and a music workshop, and the young people can help shape the activities.",
                OpeningHours = "Monday 15.00-21.00, Thursday 15.00-21.00",
            },
            new ResourceTranslation
            {
                Id = 259,
                ResourceId = 338,
                LanguageCode = "nb",
                Description = "Musikkverkstedet i Stange er et tilbud for unge som holder på med musikk, med fullt utstyrt øvingslokale, studio for innspilling og veiledning. Det vil også være en møteplass for unge musikere.",
                OpeningHours = "Mandag 14.00-21.00, Tirsdag 14.00-21.00, Onsdag 17.00-20.00",
            },
            new ResourceTranslation
            {
                Id = 260,
                ResourceId = 338,
                LanguageCode = "en",
                Description = "The music workshop in Stange is an offer for young people who play music, with a fully equipped rehearsal room, a recording studio and guidance. It also aims to be a meeting place for young musicians.",
                OpeningHours = "Monday 14.00-21.00, Tuesday 14.00-21.00, Wednesday 17.00-20.00",
            },
            new ResourceTranslation
            {
                Id = 261,
                ResourceId = 339,
                LanguageCode = "nb",
                Description = "Frivilligsentralen er en sosial møteplass i Løten med faste tilbud som allværskafé på mandager, gågruppe på tirsdager, eldretreff på onsdager og nett-treff på fredager. Du kan også få en frivillig som følger deg til timer, eller selv melde deg som frivillig.",
                OpeningHours = "mandag til fredag kl.10.00 – kl.14.00",
            },
            new ResourceTranslation
            {
                Id = 262,
                ResourceId = 339,
                LanguageCode = "en",
                Description = "The volunteer centre is a social meeting place in Løten with regular offers such as a café on Mondays, a walking group on Tuesdays, a meeting for older people on Wednesdays and a mobile and computer help hour on Fridays. You can also get a volunteer to accompany you to appointments, or sign up as a volunteer yourself.",
                OpeningHours = "Monday to Friday 10.00 – 14.00",
            },
            new ResourceTranslation
            {
                Id = 263,
                ResourceId = 340,
                LanguageCode = "nb",
                Description = "Ungdomsklubb i Løten for barn og unge fra 5. klasse til 18 år, delt i juniorklubb og ungdomsklubb. Der kan du spille bordtennis, biljard og spill, høre på musikk og være ute ved bålpanner og diskgolfmål, med voksne til stede.",
                OpeningHours = "Det er åpent mandag, tirsdag og torsdag.",
            },
            new ResourceTranslation
            {
                Id = 264,
                ResourceId = 340,
                LanguageCode = "en",
                Description = "A youth club in Løten for children and young people from 5th grade up to age 18, split into a junior club and a youth club. You can play table tennis, billiards and games, listen to music and be outdoors at the fire pits and disc golf target, with adults present.",
                OpeningHours = "Open Monday, Tuesday and Thursday.",
            },
            new ResourceTranslation
            {
                Id = 265,
                ResourceId = 341,
                LanguageCode = "nb",
                Description = "Fysisk aktivitet i Løtenhallen med lekbetonte aktiviteter som lagleker, stafetter og lett styrketrening, drevet av psykisk helse- og rustjenesten. Aktivitetene tilpasses slik at alle kan delta.",
                OpeningHours = "Hver onsdag er det tilbud om fysisk aktivitet i Løtenhallen fra kl. 14.00-15.00.",
            },
            new ResourceTranslation
            {
                Id = 266,
                ResourceId = 341,
                LanguageCode = "en",
                Description = "Physical activity in Løtenhallen with playful activities such as team games, relay races and light strength training, run by the mental health and substance use service. The activities are adapted so that everyone can take part.",
                OpeningHours = "Every Wednesday there is physical activity in Løtenhallen from 14.00-15.00.",
            },
            new ResourceTranslation
            {
                Id = 267,
                ResourceId = 342,
                LanguageCode = "nb",
                Description = "Utlån av sports- og friluftsutstyr i Løten, som sykler, kajakker og telt om våren og sommeren og ski, skøyter og alpinutstyr om høsten og vinteren. Du må registrere en profil først.",
                CostNote = "helt gratis!",
            },
            new ResourceTranslation
            {
                Id = 268,
                ResourceId = 342,
                LanguageCode = "en",
                Description = "Lending of sports and outdoor equipment in Løten, such as bikes, kayaks and tents in spring and summer and skis, skates and alpine gear in autumn and winter. You have to register a profile first.",
                CostNote = "completely free!",
            },
            new ResourceTranslation
            {
                Id = 269,
                ResourceId = 343,
                LanguageCode = "nb",
                Description = "Frivilligsentral med åpen frivilligkafé alle hverdager og grupper som hobbyklubb, trimgruppe og språkkafé. Du kan komme innom for en kaffe, en prat eller for å delta i aktivitetene.",
                OpeningHours = "Frivilligkaféen: Åpningstiden er mellom kl 10:00 og 14:00",
            },
            new ResourceTranslation
            {
                Id = 270,
                ResourceId = 343,
                LanguageCode = "en",
                Description = "A volunteer centre with an open café every weekday and groups such as the hobby club, exercise group and language café. You can drop in for a coffee, a chat or to join the activities.",
                OpeningHours = "The volunteer café: opening hours are between 10:00 and 14:00",
            },
            new ResourceTranslation
            {
                Id = 271,
                ResourceId = 344,
                LanguageCode = "nb",
                Description = "Åpent møtested for småbarn, seniorer og alle som er midt imellom, med kafé på hverdager, hobbygrupper, boccia, sangkafé, kurs og turer. Stedet drives av en frivillig organisasjon og holder til i kommunehuset Folkvang.",
                OpeningHours = "Mandag-fredag 09:00-15:00. Kafé: mandag - fredag 09:00-15:00, torsdag til 15:30.",
            },
            new ResourceTranslation
            {
                Id = 272,
                ResourceId = 344,
                LanguageCode = "en",
                Description = "An open meeting place for toddlers, seniors and everyone in between, with a café on weekdays, hobby groups, boccia, a singing café, courses and outings. It is run by a voluntary organisation and is based in the Folkvang municipal building.",
                OpeningHours = "Monday to Friday 09:00-15:00. Café: Monday to Friday 09:00-15:00, Thursday until 15:30.",
            },
            new ResourceTranslation
            {
                Id = 273,
                ResourceId = 345,
                LanguageCode = "nb",
                Description = "Dagtilbud for deg som har eller har hatt psykiske utfordringer og trenger hjelp til å komme i aktivitet og gjenoppta et sosialt liv. Det er et sosialt fellesskap, ikke behandling, og det anbefales å ringe først.",
                OpeningHours = "Mandag, onsdag, torsdag og fredag kl. 10:00 - 14:00",
            },
            new ResourceTranslation
            {
                Id = 274,
                ResourceId = 345,
                LanguageCode = "en",
                Description = "A day offer for people who have or have had psychological challenges and need help to get into activity and take up a social life again. It is a social community, not treatment, and the page recommends calling first.",
                OpeningHours = "Monday, Wednesday, Thursday and Friday 10:00 - 14:00",
            },
            new ResourceTranslation
            {
                Id = 275,
                ResourceId = 346,
                LanguageCode = "nb",
                Description = "Gratis ungdomsklubb i sentrum for ungdom mellom 10 og 18 år, med blant annet spill, brettspill, musikk, dans, leksehjelp og skating. Tirsdag er det juniorklubb for 5. til 7. trinn.",
                OpeningHours = "Mandag kl. 14.00 - 20.45; Tirsdag kl. 14.00 - 20.00 (Juniorklubben 5. - 7. trinn); Onsdag kl. 14.00 - 20.45; Torsdag kl. 14.00 - 20.45; Fredag kl. 14.00 - 20.45",
                CostNote = "Her kan du være med på en hel haug med aktiviteter, og det er gratis.",
            },
            new ResourceTranslation
            {
                Id = 276,
                ResourceId = 346,
                LanguageCode = "en",
                Description = "A free youth club in the town centre for young people aged 10 to 18, with gaming, board games, music, dance, homework help and skating. On Tuesdays there is a junior club for grades 5 to 7.",
                OpeningHours = "Monday 14.00 - 20.45; Tuesday 14.00 - 20.00 (junior club for grades 5 - 7); Wednesday 14.00 - 20.45; Thursday 14.00 - 20.45; Friday 14.00 - 20.45",
                CostNote = "You can join a whole bunch of activities here, and it is free.",
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
            new ResourceCategory { ResourceId = 23, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 24, CategoryId = Categories.Nodtjenester },
            new ResourceCategory { ResourceId = 25, CategoryId = Categories.Nodtjenester },
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
            new ResourceCategory { ResourceId = 247, CategoryId = Categories.Rus },
            // Category 10 members from docs/seed-data-lavterskel-retag.md's "Category 10" section.
            new ResourceCategory { ResourceId = 115, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 227, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 228, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 247, CategoryId = Categories.Lavterskeltilbud },
            // Rows 301 and up: categories from docs/seed-data-lavterskel-innlandet.md.
            new ResourceCategory { ResourceId = 301, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 301, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 302, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 303, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 304, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 304, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 305, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 305, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 306, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 306, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 307, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 308, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 309, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 310, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 310, CategoryId = Categories.FamilieOgBarn },
            new ResourceCategory { ResourceId = 311, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 312, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 313, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 314, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 315, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 315, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 316, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 316, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 317, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 318, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 320, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 320, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 321, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 321, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 322, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 323, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 324, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 326, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 327, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 328, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 329, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 329, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 329, CategoryId = Categories.Rus },
            new ResourceCategory { ResourceId = 330, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 330, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 331, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 332, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 333, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 334, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 335, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 336, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 337, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 338, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 339, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 340, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 341, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 341, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 342, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 343, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 344, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 345, CategoryId = Categories.Lavterskeltilbud },
            new ResourceCategory { ResourceId = 345, CategoryId = Categories.PsykiskHelse },
            new ResourceCategory { ResourceId = 346, CategoryId = Categories.Lavterskeltilbud });

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
            new ResourceMunicipality { ResourceId = 118, MunicipalityId = Loten },
            // Row 304, CRUX Arbeideren: its Serves cell in docs/seed-data-lavterskel-innlandet.md.
            new ResourceMunicipality { ResourceId = 304, MunicipalityId = Stange },
            // Row 321, Fontenehuset Gjøvik: its Serves cell in docs/seed-data-lavterskel-innlandet.md.
            new ResourceMunicipality { ResourceId = 321, MunicipalityId = Hamar },
            new ResourceMunicipality { ResourceId = 321, MunicipalityId = Lillehammer },
            new ResourceMunicipality { ResourceId = 321, MunicipalityId = Ringsaker },
            new ResourceMunicipality { ResourceId = 321, MunicipalityId = Stange },
            new ResourceMunicipality { ResourceId = 321, MunicipalityId = Loten },
            new ResourceMunicipality { ResourceId = 321, MunicipalityId = Elverum });
    }
}

using Varde.Core.Models;

namespace Varde.Data.Seed;

/// <summary>
/// The nine phase-1 categories. Slugs are stable — they appear in shareable URLs, so renaming
/// one breaks every link a caseworker has already sent.
///
/// Nodtjenester was added 2026-08-17, on top of the plan's original eight, and is deliberately
/// strict: only services for an ongoing emergency (legevakt, krisesentre, barnevernvakter,
/// Alarmtelefonen, VO-linjen, overgrepsmottak, psykososial akuttjeneste). Døgnåpne support lines
/// like Hjelpetelefonen and Kirkens SOS stay under psykisk-helse — support, not emergency
/// response. See docs/seed-data.md's "## Categories" section.
/// </summary>
public static class Categories
{
    public const int Okonomi = 1;
    public const int Bolig = 2;
    public const int PsykiskHelse = 3;
    public const int Rus = 4;
    public const int VoldOgOvergrep = 5;
    public const int FamilieOgBarn = 6;
    public const int Arbeid = 7;
    public const int JuridiskHjelp = 8;
    public const int Nodtjenester = 9;

    public static readonly Category[] All =
    [
        new() { Id = Okonomi, Slug = "okonomi" },
        new() { Id = Bolig, Slug = "bolig" },
        new() { Id = PsykiskHelse, Slug = "psykisk-helse" },
        new() { Id = Rus, Slug = "rus" },
        new() { Id = VoldOgOvergrep, Slug = "vold-og-overgrep" },
        new() { Id = FamilieOgBarn, Slug = "familie-og-barn" },
        new() { Id = Arbeid, Slug = "arbeid" },
        new() { Id = JuridiskHjelp, Slug = "juridisk-hjelp" },
        new() { Id = Nodtjenester, Slug = "nodtjenester" },
    ];

    public static readonly CategoryTranslation[] Translations =
    [
        new() { Id = 1, CategoryId = Okonomi, LanguageCode = "nb", Name = "Økonomi og gjeld" },
        new() { Id = 2, CategoryId = Okonomi, LanguageCode = "en", Name = "Money and debt" },
        new() { Id = 3, CategoryId = Bolig, LanguageCode = "nb", Name = "Bolig" },
        new() { Id = 4, CategoryId = Bolig, LanguageCode = "en", Name = "Housing" },
        new() { Id = 5, CategoryId = PsykiskHelse, LanguageCode = "nb", Name = "Psykisk helse" },
        new() { Id = 6, CategoryId = PsykiskHelse, LanguageCode = "en", Name = "Mental health" },
        new() { Id = 7, CategoryId = Rus, LanguageCode = "nb", Name = "Rus og avhengighet" },
        new() { Id = 8, CategoryId = Rus, LanguageCode = "en", Name = "Substance use and addiction" },
        new() { Id = 9, CategoryId = VoldOgOvergrep, LanguageCode = "nb", Name = "Vold og overgrep" },
        new() { Id = 10, CategoryId = VoldOgOvergrep, LanguageCode = "en", Name = "Violence and abuse" },
        new() { Id = 11, CategoryId = FamilieOgBarn, LanguageCode = "nb", Name = "Familie og barn" },
        new() { Id = 12, CategoryId = FamilieOgBarn, LanguageCode = "en", Name = "Family and children" },
        new() { Id = 13, CategoryId = Arbeid, LanguageCode = "nb", Name = "Arbeid" },
        new() { Id = 14, CategoryId = Arbeid, LanguageCode = "en", Name = "Work" },
        new() { Id = 15, CategoryId = JuridiskHjelp, LanguageCode = "nb", Name = "Juridisk hjelp" },
        new() { Id = 16, CategoryId = JuridiskHjelp, LanguageCode = "en", Name = "Legal help" },
        new() { Id = 17, CategoryId = Nodtjenester, LanguageCode = "nb", Name = "Nødtjenester" },
        new() { Id = 18, CategoryId = Nodtjenester, LanguageCode = "en", Name = "Emergency services" },
    ];
}

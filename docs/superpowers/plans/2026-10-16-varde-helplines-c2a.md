# Varde helplines on the landing page and contact tiles (C2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the four most-used helplines on the landing page in two age groups with a phone and a chat button on every row, and replace the detail page's single call button with contact tiles for every way to reach a service, including its sub-services.

**Architecture:** One PR on `feat/helplines-c2a`, in the spec's order. The API gains `Resource.ParentId` (self-referencing, restrict on delete, one level) and `Resource.PhoneMenuOption` (1 to 9) in one migration that also moves row 9's "tast 3" out of its descriptions. The web mirrors both fields, finds a service's parent and children in the already-loaded index (`services/family.ts`), and bakes them into prerendered detail pages. The landing reads `HELPLINE_GROUPS` and lays both help sections out on shared grid rows and shared button columns with CSS subgrid. The detail page builds its tiles from a pure function (`services/contactTiles.ts`).

**Tech Stack:** ASP.NET Core 10 + EF Core 10 (Npgsql, `HasData` seed migrations, `dotnet-ef` 10.0.13 as a local tool), xUnit; React 19, TypeScript, Vite, Tailwind 4 (component classes in `main.css`, container queries with `@[..]`), Vitest + Testing Library + jest-dom, `@playwright/test` 1.64 (Chromium only), Biome 2.

**Spec:** `docs/superpowers/specs/2026-10-16-varde-helplines-c2a-design.md` (approved by me 2026-10-16, on branch `docs/helplines-c2a-spec`, amended the same day with the three decisions under "Decided" below). Read it in full before Task 1.

## Global Constraints

Every task's requirements include these. Values are copied from the spec.

- **Never invent a value.** Phone numbers, chat URLs, names and age ranges are copied from a file or a cited page, never written from memory. In code, every seed value is copied from its seed doc.
- **Service names are never translated.** The landing's short names ("Mental Helse", "Kirkens SOS", "Alarmtelefonen for barn og unge", "Kors på halsen") are labels, not data, and each must appear inside its row's data name.
- **`ParentId`:** `int?`, foreign key to `Resource`, navigations `Parent` and `Children`, on delete **restrict**, check constraint refuses `ParentId = Id`, one level only (enforced by the seed test, not the database). Rows 9 and 122 get `ParentId = 1`.
- **`PhoneMenuOption`:** `int?`, check constraint exactly `"PhoneMenuOption" IS NULL OR ("PhoneMenuOption" BETWEEN 1 AND 9 AND "Phone" IS NOT NULL)`. Row 9 gets 3, no other row gets a value. "Velg tast 3 i menyen." and "Choose option 3 in the menu." leave row 9's descriptions.
- **One migration, `HelplineParentAndMenuOption`,** generated with `dotnet ef`, never hand-written, read before commit. It lands before any Lavterskel C1 migration.
- **Copy (exact):** `landing.helplineGroup.adults` "For voksne og generelle livskriser" / "For adults and general life crises"; `landing.helplineGroup.young` "For barn og unge" / "For children and young people"; `detail.contactHeading` "Kontakt" / "Contact"; `detail.tile.alwaysOpen` "døgnåpen" / "open 24/7"; `detail.tile.openChat` "Åpne chatten" / "Open the chat"; `detail.tile.menuOption` "tast {n}" / "press {n}"; `detail.partOf` "Del av {name}" / "Part of {name}". Tiles reuse `card.call` ("Ring" / "Call") and `detail.chat` ("Chat"). `landing.helplineNote.9` is removed from both files.
- **"Døgnåpen" only on phone tiles** whose row has `isAlwaysOpen`, never on a chat tile.
- **Links open in the same tab.** No `target="_blank"` anywhere in this change (backlog item 19 does that for all links at once).
- **Icons:** `PhoneIcon` and `ChatIcon` drawn for Varde on the 24-unit stroke grid in `icons.tsx`, `aria-hidden`. No path copied from Lucide.
- **Fit:** the 1920 x 950 one-screen check in `landing.spec.ts` keeps passing in both languages and both themes. If it fails, stop and ask me what gives. Never shrink spacing quietly to make it pass.
- **Controls on one row share one height (44 px) and one bottom edge.** Labels stand apart from values by size, weight or colour.
- **CSS is mobile-first:** baseline is the smallest screen, `min-width` queries only (Tailwind's `md:`, `lg:` and `@[..]:` are all min-width).
- **Text I ship:** first person in comments and docs, no em dashes anywhere (rewrite the sentence; no en dash or spaced hyphen as a stand-in). Every new UI string has an nb and an en entry.
- **Commits:** conventional prefix (`feat:`, `fix:`, `test:`, `docs:`, `style:`), author `malinfossum.dev@proton.me`, no `Co-Authored-By`, no AI attribution.
- **Dates:** before writing any date into a file, run `date +"%Y-%m-%d %A"` in the same tool batch.
- **Commands.** API from `api/`: start PostgreSQL first (PowerShell: `Start-Service postgresql-x64-17`), then `dotnet test Varde.slnx`. Web from `web/`: `npx biome check --write .` then `npx biome ci .`, `npm run typecheck`, `npm test`, and for Playwright `mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test`.

## Review Focus

Inputs the spec implies but no spec test names, most likely first. Each has a test in the task that owns the code.

1. **Data cached from before the deploy.** A browser holding `resources.nb.json` from before this change hands the UI rows with no `parentId` and no `phoneMenuOption` (undefined, not null). Nothing may crash or print "tast undefined": Mental Helse's landing row shows without a chat button, the tile shows the bare number, and no "Del av" line appears. Tests in Task 5 and Task 7.
2. **A larger text size on a desktop window** (200 % text at 1280 px). The three-column helpline rows would squeeze the names into a sliver. The rows fall back to the phone layout (name above buttons), no text leaves its button, and the page does not scroll sideways. Test in Task 6.
3. **A chat URL that is not https**, on the service itself or on a child. It never becomes a link; the next safe child chat is used instead, or none. Tests in Task 5 and Task 7.
4. **Reaching Mental Helse's page by client-side navigation**, where nothing is baked into the page. The tiles come from the index and show the same three tiles in the same order. Test in Task 7.
5. **A child page in English.** The "Part of" line links to `/en/resources/1`, not the Norwegian page. Test in Task 7.

## Decided (2026-10-16, writing this plan)

- **Phone buttons on the landing show the icon and the number only** (my call). "Ring" / "Call" is hidden text in front of the number, so the name reads "Ring 116 123, Mental Helse". The spec's 136 px and 167 px sizes were measured on mockups without the word, and "Ring 22 40 00 40" does not fit 136 px. Spec amended.
- **Child tiles: chats first, then phones, each in id order** (my call). Mental Helse shows its phone, Sidetmedord's chat, then Arbeidslivstelefonen, as the spec's example and Mental Helse's own site do. Spec amended.
- **Desktop helpline columns are in rem** (`minmax(0,1fr) 8.5rem 5.75rem`, which is 136 px and 92 px at the default text size), and the three-column form only applies in a column at least 26 rem wide. With a larger text size the rows use the phone layout instead. Spec amended.
- **The prerender bakes `family: { parent, children }`** next to `resource`, computed by `familyOf`, injected into `prerenderSite` the same way `pickHelplines` is, so the prerender and the browser share one function.
- **`pickHelplines` also throws on a stale label.** A renamed row whose data name no longer contains its landing label fails the build, and `seedDrift.test.ts` checks the four labels against `SeedData.cs`.
- **A chat must be https to count.** A service's own unsafe chat is skipped and the first child with a safe chat is used.
- **The two age groups are plain `section`s without a label**, so they do not add two region landmarks. Each group's `ul` is labelled by its `h3` instead ("list, For voksne og generelle livskriser, 2 items").
- **Chat tiles keep `rel="noopener noreferrer"`,** like the chat link they replace in the `dl`.
- **The export script needs no change.** It writes the API's rows through untouched; Task 3 adds a test that guards that.
- **Parents and the menu option are recorded in a new table in `docs/seed-data.md`,** not as new columns in three seed docs.
- **The `.helpline-row` rule in `main.css` goes.** The `grid` utility already overrides it. The class stays as a hook for tests.

## Open items (owner: Malin)

- **Age gate (Task 1).** If either service's own site states a range other than under 18, I choose the new group label before Task 5.
- **Preview test before merge (Task 8):** 375, 1024 and 1920 px, both languages, both themes.
- **Merging is my call.** Agents push the branch and open the PR; they never merge.
- **Mega-menu:** whoever builds `docs/superpowers/plans/2026-10-15-varde-mega-menu.md` rebases it on this PR first. Its "Noen å snakke med" group shows the four `HELPLINE_GROUPS` rows, and its `HELPLINE_NAMES` reads from `HELPLINE_GROUPS`.

---

## Setup (before Task 1)

- [ ] **Step 1: Branch from main and bring the spec and plan along as local files**

The spec and this plan live on `docs/helplines-c2a-spec`. On the feature branch they are git-excluded local copies (same pattern as the UI polish work).

```bash
git fetch origin
git switch -c feat/helplines-c2a origin/main
mkdir -p docs/superpowers/specs docs/superpowers/plans
git show origin/docs/helplines-c2a-spec:docs/superpowers/specs/2026-10-16-varde-helplines-c2a-design.md > docs/superpowers/specs/2026-10-16-varde-helplines-c2a-design.md
git show origin/docs/helplines-c2a-spec:docs/superpowers/plans/2026-10-16-varde-helplines-c2a.md > docs/superpowers/plans/2026-10-16-varde-helplines-c2a.md
printf '%s\n' docs/superpowers/specs/2026-10-16-varde-helplines-c2a-design.md docs/superpowers/plans/2026-10-16-varde-helplines-c2a.md >> .git/info/exclude
git status --short
```

Expected: `git status --short` prints nothing. If a `git show` fails with "does not exist", the plan or the amended spec was never pushed to `docs/helplines-c2a-spec`: stop and tell me, do not work from an older copy.

- [ ] **Step 2: Confirm a green start**

PowerShell: `Start-Service postgresql-x64-17`. Then from `api/`: `dotnet tool restore && dotnet test Varde.slnx`. From `web/`: `npm ci && npm run typecheck && npm test`.
Expected: all PASS. If anything is red on a clean `main`, stop and report it before Task 1.

---

### Task 1: Seed docs: age ranges, parents and the menu option

**Files:**
- Modify: `docs/seed-data.md` (row 4 Notes, row 9 description under `### 9.`, new section at the end)
- Modify: `docs/seed-data-innlandet-ring.md` (row 121 Notes)

**Interfaces:**
- Consumes: nothing.
- Produces: the source of truth Task 2 copies from: rows 9 and 122 have `ParentId` 1, row 9 has `PhoneMenuOption` 3, row 9's descriptions without the menu sentence; and the verified age range behind the "young" group label Task 5 ships.

- [ ] **Step 1: Read each youth service's age range at its own source**

Open row 4's source `https://www.116111.no/omalarmtelefonen` and row 121's `https://www.korspahalsen.no` in the built-in browser (`get_page_text`). If the age is not on that page, follow the service's own "om oss" or "om tjenesten" link on the same site. Copy the sentence that states who the service is for, verbatim, with its URL. Do not use any other site.

- [ ] **Step 2: Gate**

If both sentences say the service is for children and young people under 18 (for example "under 18 år" or "opp til 18 år"), continue. If either states another range, or neither page states one, **stop and report both quotes and URLs to me.** I choose the group label; Task 5 then uses my wording in both languages.

- [ ] **Step 3: Record the ages**

Run `date +"%Y-%m-%d %A"` first. Append to the end of row 4's Notes cell in `docs/seed-data.md` (the row starting `| 4 | Alarmtelefonen for barn og unge |`), inside the cell, before the closing `|`:

```
 Age range (C2a, <date>): "<the copied sentence>" (<url>).
```

Do the same at the end of row 121's Notes cell in `docs/seed-data-innlandet-ring.md` (the row starting `| 121 | Kors på halsen (Røde Kors) |`).

- [ ] **Step 4: Take the menu sentence out of row 9's descriptions**

In `docs/seed-data.md` under `### 9. Arbeidslivstelefonen (Mental Helse)`, the two lines become:

```markdown
- **nb:** Rådgivning om vanskelige forhold på jobben, som konflikt, mobbing, sykefravær eller oppsigelse. Åpen for arbeidstakere, ledere, tillitsvalgte og arbeidssøkere.
- **en:** Advice about difficult situations at work, such as conflict, bullying, sick leave or dismissal. Open to employees, managers, union representatives and jobseekers.
```

- [ ] **Step 5: Add the parents and menu option table at the end of `docs/seed-data.md`**

```markdown
## Parents and phone menu options (C2a, 2026-10-16)

Some services belong to another, and some numbers need a key press after the call connects. Both
facts live here and in their own fields, never in description text. One level only: a row with a
parent never has children of its own.

| # | Name | ParentId | PhoneMenuOption | Source |
|---|---|---|---|---|
| 9 | Arbeidslivstelefonen (Mental Helse) | 1 | 3 | Row 9's own descriptions until 2026-10-16 ("Velg tast 3 i menyen"), from its source page in the table above. |
| 122 | Sidetmedord (Mental Helse) | 1 |  | Mental Helse's own "få hjelp" page lists it as their chat and forum service (docs/seed-data-innlandet-ring.md row 122). |
```

- [ ] **Step 6: Commit**

```bash
git add docs/seed-data.md docs/seed-data-innlandet-ring.md
git commit -m "docs: record helpline parents, menu option and age ranges"
```

---

### Task 2: API: ParentId and PhoneMenuOption

**Files:**
- Modify: `api/Varde.Core/Models/Resource.cs`
- Modify: `api/Varde.Data/VardeDbContext.cs`
- Modify: `api/Varde.Data/Seed/SeedData.cs` (header comment, rows 9 and 122, translations 17 and 18)
- Modify: `api/Varde.Core/Dtos/ResourceDtos.cs`
- Modify: `api/Varde.Core/Services/ResourceService.cs:65-82`
- Create (generated): `api/Varde.Data/Migrations/<timestamp>_HelplineParentAndMenuOption.cs`, its `.Designer.cs`, and the updated `VardeDbContextModelSnapshot.cs`
- Test: `api/Varde.Tests/Integration/SchemaTests.cs`, `SeedDataTests.cs`, `ResourcesApiTests.cs`

**Interfaces:**
- Consumes: Task 1's table and row 9 descriptions.
- Produces: `Resource.ParentId` (`int?`), `Resource.Parent`, `Resource.Children`, `Resource.PhoneMenuOption` (`int?`); `ResourceDto` gains two trailing positional parameters `int? ParentId, int? PhoneMenuOption`, serialised as `"parentId"` and `"phoneMenuOption"` (null written, not omitted). Constraint names: `CK_Resources_ParentId`, `CK_Resources_PhoneMenuOption`, foreign key `FK_Resources_Resources_ParentId`.

- [ ] **Step 1: Write the failing schema tests**

Add `using Npgsql;` to the top of `SchemaTests.cs`, then add inside the class:

```csharp
    private static Resource Service(string name, string? phone = "116 123") => new()
    {
        Name = name,
        IsNational = true,
        Phone = phone,
        LastVerified = new DateOnly(2026, 10, 16),
    };

    [DbFact]
    public async Task A_resource_with_children_cannot_be_deleted()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Resources.Add(Service("Hjelpetelefonen (Mental Helse)")));
        factory.Seed(db =>
        {
            var child = Service("Arbeidslivstelefonen (Mental Helse)");
            child.ParentId = 1;
            db.Resources.Add(child);
        });

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        db.Resources.Remove(await db.Resources.SingleAsync(r => r.Id == 1));

        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal(
            "FK_Resources_Resources_ParentId",
            Assert.IsType<PostgresException>(error.InnerException).ConstraintName);
    }

    [DbFact]
    public async Task A_resource_cannot_be_its_own_parent()
    {
        using var factory = new VardeApiFactory();
        factory.Seed(db => db.Resources.Add(Service("Hjelpetelefonen (Mental Helse)")));

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        // ExecuteUpdate skips change tracking, so the database alone has to refuse it. Depending
        // on the EF version the PostgresException arrives bare or wrapped; accept either.
        var error = await Record.ExceptionAsync(() =>
            db.Resources.ExecuteUpdateAsync(s => s.SetProperty(r => r.ParentId, r => r.Id)));
        var refused = error as PostgresException ?? error?.InnerException as PostgresException;
        Assert.Equal("CK_Resources_ParentId", refused?.ConstraintName);
    }

    [DbTheory]
    [InlineData(0)]
    [InlineData(10)]
    public async Task A_phone_menu_option_outside_1_to_9_is_refused(int option)
    {
        using var factory = new VardeApiFactory();
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        var resource = Service("Arbeidslivstelefonen (Mental Helse)");
        resource.PhoneMenuOption = option;
        db.Resources.Add(resource);

        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal(
            "CK_Resources_PhoneMenuOption",
            Assert.IsType<PostgresException>(error.InnerException).ConstraintName);
    }

    [DbFact]
    public async Task A_phone_menu_option_on_a_row_without_a_phone_is_refused()
    {
        using var factory = new VardeApiFactory();
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();
        var resource = Service("Sidetmedord (Mental Helse)", phone: null);
        resource.Website = "https://sidetmedord.mentalhelse.no/";
        resource.PhoneMenuOption = 3;
        db.Resources.Add(resource);

        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal(
            "CK_Resources_PhoneMenuOption",
            Assert.IsType<PostgresException>(error.InnerException).ConstraintName);
    }
```

The constraint-name assertions matter: without them, any other database error (a missing column, a different constraint) would pass these tests.

- [ ] **Step 2: Write the failing seed tests**

Append inside `SeedDataTests` (it already has the needed usings):

```csharp
    [DbFact]
    public async Task Mental_Helse_sub_services_hang_off_row_1_one_level_deep()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var children = await db.Resources
            .Where(r => r.ParentId != null)
            .OrderBy(r => r.Id)
            .Select(r => new { r.Id, r.ParentId })
            .ToListAsync();

        Assert.Equal([9, 122], children.Select(c => c.Id));
        Assert.All(children, c => Assert.Equal(1, c.ParentId));

        // One level only: a resource with a parent never has children of its own. The database
        // cannot say this without a trigger, and the seed is the only writer, so this test does.
        Assert.Empty(await db.Resources
            .Where(r => r.ParentId != null && r.Children.Any())
            .Select(r => r.Id)
            .ToListAsync());
    }

    [DbFact]
    public async Task Row_9_carries_its_menu_option_as_data_not_prose()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        var row9 = await db.Resources.Include(r => r.Translations).SingleAsync(r => r.Id == 9);

        Assert.Equal(3, row9.PhoneMenuOption);
        Assert.Equal(2, row9.Translations.Count);
        Assert.All(row9.Translations, t =>
        {
            Assert.DoesNotContain("tast 3", t.Description, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("option 3", t.Description, StringComparison.OrdinalIgnoreCase);
        });
    }

    [DbFact]
    public async Task Every_phone_menu_option_is_1_to_9_on_a_row_with_a_phone()
    {
        using var factory = new VardeApiFactory { KeepSeedData = true };
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<VardeDbContext>();

        Assert.Empty(await db.Resources
            .Where(r => r.PhoneMenuOption != null
                && (r.PhoneMenuOption < 1 || r.PhoneMenuOption > 9 || r.Phone == null))
            .Select(r => r.Id)
            .ToListAsync());
        Assert.Equal(
            [9],
            await db.Resources.Where(r => r.PhoneMenuOption != null).Select(r => r.Id).ToListAsync());
    }
```

- [ ] **Step 3: Write the failing API test**

Append inside `ResourcesApiTests`:

```csharp
    [DbFact]
    public async Task Get_exposes_parent_id_and_phone_menu_option_null_where_unset()
    {
        using var factory = new VardeApiFactory();
        SeedDirectory(factory);
        factory.Seed(db => db.Resources.Add(new Resource
        {
            Name = "Arbeidslivstelefonen (Mental Helse)",
            IsNational = true,
            ParentId = 2,
            Phone = "116 123",
            PhoneMenuOption = 3,
            LastVerified = Verified,
            Translations =
            {
                new ResourceTranslation { LanguageCode = "nb", Description = "Rådgivning om jobben." },
            },
        }));

        var client = factory.CreateClient();
        var child = await client.GetFromJsonAsync<ResourceDto>("/api/resources/3");
        var parent = await client.GetFromJsonAsync<ResourceDto>("/api/resources/2");
        var parentJson = await client.GetStringAsync("/api/resources/2");

        Assert.Equal(2, child!.ParentId);
        Assert.Equal(3, child.PhoneMenuOption);
        Assert.Null(parent!.ParentId);
        Assert.Null(parent.PhoneMenuOption);
        // The web reads these by name and treats a missing key as stale data, so null must be
        // written out, not omitted.
        Assert.Contains("\"parentId\":null", parentJson);
        Assert.Contains("\"phoneMenuOption\":null", parentJson);
    }
```

`SeedDirectory` adds NAV Hamar (id 1) and Mental Helse (id 2), so the new row is id 3.

- [ ] **Step 4: Run the tests to see them fail**

Run from `api/`: `dotnet test Varde.slnx`
Expected: FAIL at compile time with `CS0117` / `CS1061` ("'Resource' does not contain a definition for 'ParentId'" and "'ResourceDto' does not contain a definition for 'ParentId'").

- [ ] **Step 5: Add the model properties**

In `Resource.cs`, after the `ChatUrl` property:

```csharp
    /// <summary>
    /// A service that belongs to another (Arbeidslivstelefonen under Mental Helse). Its phone and
    /// chat show as tiles on the parent's page. One level only: a resource with a parent never has
    /// children. SeedDataTests enforces that, because the seed is the only writer.
    /// </summary>
    public int? ParentId { get; set; }
    public Resource? Parent { get; set; }
    public List<Resource> Children { get; set; } = [];

    /// <summary>
    /// The key to press in the phone menu after the call connects, 1 to 9. It belongs to the
    /// service, and a service has one phone number. A check constraint refuses it without a phone.
    /// </summary>
    public int? PhoneMenuOption { get; set; }
```

- [ ] **Step 6: Configure the relationship and the check constraints**

In `VardeDbContext.cs`, inside `modelBuilder.Entity<Resource>(resource => { ... })`, after the `Municipality` relationship:

```csharp
            // Restrict: a parent with children cannot be deleted by accident.
            resource.HasOne(r => r.Parent)
                .WithMany(r => r.Children)
                .HasForeignKey(r => r.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            resource.ToTable(table =>
            {
                // A row can never be its own parent. NULL passes, as every check does.
                table.HasCheckConstraint("CK_Resources_ParentId", "\"ParentId\" <> \"Id\"");
                table.HasCheckConstraint(
                    "CK_Resources_PhoneMenuOption",
                    "\"PhoneMenuOption\" IS NULL OR (\"PhoneMenuOption\" BETWEEN 1 AND 9 AND \"Phone\" IS NOT NULL)");
            });
```

- [ ] **Step 7: Update the seed, copying from Task 1's doc**

In `SeedData.cs`:

Row 9 (`Id = 9,`), add after `Phone = "116 123",`:

```csharp
                ParentId = 1,
                PhoneMenuOption = 3,
```

Row 122 (`Id = 122,`), add after `MunicipalityId = null,`:

```csharp
                ParentId = 1,
```

Translation `Id = 17` (row 9, nb) `Description` becomes:

```csharp
                Description = "Rådgivning om vanskelige forhold på jobben, som konflikt, mobbing, sykefravær eller oppsigelse. Åpen for arbeidstakere, ledere, tillitsvalgte og arbeidssøkere.",
```

Translation `Id = 18` (row 9, en) `Description` becomes:

```csharp
                Description = "Advice about difficult situations at work, such as conflict, bullying, sick leave or dismissal. Open to employees, managers, union representatives and jobseekers.",
```

Add one paragraph to the class's `<summary>`, right before the `IsAlwaysOpen (added plan 2)` paragraph:

```csharp
/// C2a (2026-10-16) adds ParentId and PhoneMenuOption from docs/seed-data.md's "Parents and phone
/// menu options" table: rows 9 and 122 hang off row 1, and row 9's "tast 3" moved out of its
/// descriptions into PhoneMenuOption.
///
```

- [ ] **Step 8: Extend the DTO and its mapping**

In `ResourceDtos.cs`, add two `<param>` lines after the `ServedMunicipalityIds` one:

```csharp
/// <param name="ParentId">The service this one belongs to, or null. One level only.</param>
/// <param name="PhoneMenuOption">The key to press after the call connects (1 to 9), or null.</param>
```

and two trailing parameters after `IReadOnlyList<int> ServedMunicipalityIds`:

```csharp
    IReadOnlyList<int> ServedMunicipalityIds,
    int? ParentId,
    int? PhoneMenuOption);
```

In `ResourceService.cs`, the `new ResourceDto(...)` call ends:

```csharp
            categories,
            served,
            resource.ParentId,
            resource.PhoneMenuOption);
```

- [ ] **Step 9: Generate the migration**

Run from `api/`:

```bash
dotnet ef migrations add HelplineParentAndMenuOption --project Varde.Data --startup-project Varde.Api
```

Expected: `Done.` and three changed files under `Varde.Data/Migrations/`.

- [ ] **Step 10: Read the migration before trusting it**

Open the new `<timestamp>_HelplineParentAndMenuOption.cs`. `Up` holds exactly:
- `AddColumn<int>` `ParentId` and `PhoneMenuOption` on `Resources`, both `nullable: true`;
- `UpdateData` on `Resources` for key 9 (`ParentId` 1, `PhoneMenuOption` 3) and key 122 (`ParentId` 1);
- `UpdateData` on `ResourceTranslations` for keys 17 and 18 (`Description`);
- `CreateIndex` `IX_Resources_ParentId`;
- `AddCheckConstraint` `CK_Resources_ParentId` and `CK_Resources_PhoneMenuOption` with the SQL from Step 6;
- `AddForeignKey` `FK_Resources_Resources_ParentId` with `onDelete: ReferentialAction.Restrict`.

`Down` reverses each. Anything else (an `AlterColumn`, a `DropColumn`, an `UpdateData` on another row): stop and find the cause before going on.

- [ ] **Step 11: Run the API suite**

Run from `api/`: `dotnet test Varde.slnx`
Expected: PASS, including the eight new tests (two `DbTheory` cases). The existing counts are unchanged: 94 resources, 13 always open.

- [ ] **Step 12: Commit**

```bash
git add api docs
git commit -m "feat(api): add ParentId and PhoneMenuOption to resources"
```

---

### Task 3: Web types, the export guard and the e2e snapshot

**Files:**
- Modify: `web/src/types/api.ts`
- Modify (typed fixtures): `web/tests/axe.test.tsx`, `web/tests/detail.test.tsx`, `web/tests/list.test.tsx`, `web/tests/query.test.ts`, `web/tests/race.test.tsx`, `web/tests/stubData.ts`
- Test: `web/tests/exportData.test.ts`
- Regenerate: `web/e2e/fixtures/data/*.json`

**Interfaces:**
- Consumes: Task 2's DTO fields `parentId`, `phoneMenuOption`.
- Produces: `ResourceDto.parentId: number | null` and `ResourceDto.phoneMenuOption: number | null` in `web/src/types/api.ts`; an e2e snapshot where rows 9 and 122 have `parentId` 1, row 9 has `phoneMenuOption` 3, and row 122's `chatUrl` is `https://mentalhelse.no/hjelpechat/`.

- [ ] **Step 1: Write the export guard test**

In `web/tests/exportData.test.ts`, give `fakeApi` a second parameter that adds fields to every row:

```ts
function fakeApi(total: number, extra: (id: number) => object = () => ({})) {
	const rows = Array.from({ length: total }, (_, i) => ({
		id: i + 1,
		name: `R${i + 1}`,
		municipalityId: (i % 3) + 1,
		servedMunicipalityIds: [],
		...extra(i + 1),
	}))
```

(the rest of `fakeApi` is unchanged). Then add:

```ts
test("parent links and menu options reach both languages' files untouched", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	const api = fakeApi(MIN_RESOURCES, (id) => ({
		parentId: id === 9 ? 1 : null,
		phoneMenuOption: id === 9 ? 3 : null,
	}))
	await exportData({
		baseUrl: "http://api",
		outDir,
		fetchImpl: api as unknown as typeof fetch,
		log: () => {},
	})
	for (const lang of ["nb", "en"]) {
		const rows = JSON.parse(readFileSync(join(outDir, `resources.${lang}.json`), "utf8")) as {
			id: number
		}[]
		expect(rows.find((r) => r.id === 9)).toMatchObject({ parentId: 1, phoneMenuOption: 3 })
		expect(rows.find((r) => r.id === 1)).toMatchObject({ parentId: null, phoneMenuOption: null })
	}
})
```

- [ ] **Step 2: Run it, then show it red once**

Run from `web/`: `npx vitest run tests/exportData.test.ts`
Expected: PASS at once. The export passes rows through, and this test guards against a later field whitelist. Show it red: in `scripts/export-data.mjs` change `rows.push(...result.items)` to `rows.push(...result.items.map(({ parentId, ...rest }) => rest))`, run again, see the new test FAIL on `parentId`, then restore the line. Note the break for the PR body.

- [ ] **Step 3: Mirror the two fields**

In `web/src/types/api.ts`, after `servedMunicipalityIds: number[]`:

```ts
	// The service this one belongs to (Arbeidslivstelefonen under Mental Helse), or null.
	parentId: number | null
	// The key to press after the call connects (1 to 9), or null.
	phoneMenuOption: number | null
```

- [ ] **Step 4: Run the type check to find every typed fixture**

Run from `web/`: `npm run typecheck`
Expected: FAIL with "Property 'parentId' is missing" in `tests/axe.test.tsx`, `tests/detail.test.tsx`, `tests/list.test.tsx`, `tests/query.test.ts`, `tests/race.test.tsx` and `tests/stubData.ts`.

- [ ] **Step 5: Add the fields to each typed fixture**

In each of those six files, directly after the line `servedMunicipalityIds: [],` inside the `ResourceDto` literal, add:

```ts
	parentId: null,
	phoneMenuOption: null,
```

(match the indentation of the surrounding lines; in `race.test.tsx` and `query.test.ts` the literal sits one level deeper).

- [ ] **Step 6: Run the web suite**

Run from `web/`: `npx biome check --write . && npx biome ci . && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 7: Regenerate the e2e data snapshot**

PostgreSQL running and `api/Varde.Api/appsettings.Development.json` in place (it holds the dev connection string, because the embedded terminal scrubs APPDATA and user-secrets do not load). Start the API in the background from the repo root; it migrates the dev database on startup:

```bash
dotnet run --project api/Varde.Api --launch-profile http
```

Wait until `curl -sf http://localhost:5005/api/municipalities` answers, then from `web/`:

```bash
npm run data
cp public/data/*.json e2e/fixtures/data/
```

Stop the API. Check the snapshot:

```bash
node -e "for (const l of ['nb','en']) { const r = require('./e2e/fixtures/data/resources.' + l + '.json'); console.log(l, r.length, r.filter((x) => x.parentId === 1).map((x) => x.id).sort((a, b) => a - b).join(','), r.find((x) => x.id === 9).phoneMenuOption, r.find((x) => x.id === 122).chatUrl) }"
```

Expected:

```
nb 94 9,122 3 https://mentalhelse.no/hjelpechat/
en 94 9,122 3 https://mentalhelse.no/hjelpechat/
```

Then `git diff --stat e2e/fixtures/data`. Only the two `resources.*.json` files may change, and within them only rows 9 and 122 (`git diff e2e/fixtures/data/resources.nb.json` shows the two new keys on every row, plus row 9's description, `parentId` and `phoneMenuOption`, and row 122's `parentId`). If a categories, municipalities or kommuner file changes, or any other row's values change, **stop and report it.** The dev database is shared with other branches, and a migration or seed applied from another branch (for example Lavterskel's category 10) would leak into this snapshot. Do not commit a contaminated snapshot.

- [ ] **Step 8: Commit**

```bash
git add web/src/types/api.ts web/tests web/e2e/fixtures/data web/scripts
git commit -m "feat(web): mirror parentId and phoneMenuOption, refresh the e2e snapshot"
```

(`web/scripts` only if Step 2's restore left a whitespace change; `git diff web/scripts` must be empty otherwise.)

---

### Task 4: Parent and children lookup, baked into detail pages

**Files:**
- Create: `web/src/services/family.ts`
- Create: `web/tests/family.test.ts`
- Modify: `web/tests/stubData.ts` (add `makeResource`)
- Modify: `web/src/pageData.ts`
- Modify: `web/src/entry-server.tsx`
- Modify: `web/scripts/prerender.mjs`, `web/scripts/prerender.d.mts`
- Test: `web/tests/prerender.test.ts`

**Interfaces:**
- Consumes: `ResourceDto.parentId` from Task 3.
- Produces:
  - `type Family = { parent: { id: number; name: string } | null; children: ResourceDto[] }`
  - `const NO_FAMILY: Family`
  - `childrenOf(id: number, resources: readonly ResourceDto[]): ResourceDto[]` (id order)
  - `familyOf(resource: ResourceDto, resources: readonly ResourceDto[]): Family`
  - `PageData.family?: Family` (belongs to `PageData.resource`)
  - `prerenderSite({ ..., family })` where `family(resource, resources)` returns a `Family`; `entry-server` re-exports `familyOf`.
  - Test helper `makeResource(over: Partial<ResourceDto> & Pick<ResourceDto, "id" | "name">): ResourceDto` in `tests/stubData.ts`.

- [ ] **Step 1: Add the test helper**

In `web/tests/stubData.ts`, after `stubDataFiles`:

```ts
// One national row with every optional field empty; a test overrides only what it is about.
export function makeResource(
	over: Partial<ResourceDto> & Pick<ResourceDto, "id" | "name">
): ResourceDto {
	return {
		description: "",
		isFallbackTranslation: false,
		openingHours: null,
		isNational: true,
		isAlwaysOpen: false,
		municipalityId: null,
		municipalityName: null,
		address: null,
		phone: null,
		email: null,
		website: null,
		chatUrl: null,
		lastVerified: "2026-08-13",
		categories: [],
		servedMunicipalityIds: [],
		parentId: null,
		phoneMenuOption: null,
		...over,
	}
}
```

- [ ] **Step 2: Write the failing unit tests**

Create `web/tests/family.test.ts`:

```ts
import { expect, test } from "vitest"
import { childrenOf, familyOf, NO_FAMILY } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { makeResource } from "./stubData.ts"

const parent = makeResource({ id: 1, name: "Hjelpetelefonen (Mental Helse)" })
const chat = makeResource({ id: 122, name: "Sidetmedord (Mental Helse)", parentId: 1 })
const work = makeResource({ id: 9, name: "Arbeidslivstelefonen (Mental Helse)", parentId: 1 })
const other = makeResource({ id: 2, name: "Kirkens SOS" })
const rows = [chat, other, parent, work]

test("children come back in id order, whatever the data order, and only the direct ones", () => {
	expect(childrenOf(1, rows).map((r) => r.id)).toEqual([9, 122])
	expect(childrenOf(2, rows)).toEqual([])
})

test("a child knows its parent by id and data name", () => {
	expect(familyOf(work, rows)).toEqual({
		parent: { id: 1, name: "Hjelpetelefonen (Mental Helse)" },
		children: [],
	})
	expect(familyOf(parent, rows).parent).toBeNull()
	expect(familyOf(parent, rows).children.map((r) => r.id)).toEqual([9, 122])
})

test("a parent missing from the data gives no parent, never a link to a 404", () => {
	expect(familyOf(work, [work, chat]).parent).toBeNull()
})

test("rows cached before parentId existed have no family at all", () => {
	const stale = rows.map(({ parentId: _parentId, ...rest }) => rest) as unknown as ResourceDto[]
	expect(familyOf(stale[2] as ResourceDto, stale)).toEqual(NO_FAMILY)
	expect(familyOf(stale[3] as ResourceDto, stale)).toEqual(NO_FAMILY)
})
```

- [ ] **Step 3: Run them to see them fail**

Run from `web/`: `npx vitest run tests/family.test.ts`
Expected: FAIL with "Failed to resolve import ../src/services/family.ts".

- [ ] **Step 4: Write `family.ts`**

Create `web/src/services/family.ts`:

```ts
import type { ResourceDto } from "../types/api.ts"

// Mental Helse's sub-services hang off it through parentId, one level deep. Children are never
// exported as a list: every page already holds the whole index, so they are found here by id.
export type Family = { parent: { id: number; name: string } | null; children: ResourceDto[] }

export const NO_FAMILY: Family = { parent: null, children: [] }

export function childrenOf(id: number, resources: readonly ResourceDto[]): ResourceDto[] {
	return resources.filter((r) => r.parentId === id).sort((a, b) => a.id - b.id)
}

// Data cached from before parentId existed has no such key at all, so `?? null` reads a missing
// key as "no parent". A parent missing from the data also gives null, so the page never links
// to a 404.
export function familyOf(resource: ResourceDto, resources: readonly ResourceDto[]): Family {
	const parentId = resource.parentId ?? null
	const parent = parentId === null ? undefined : resources.find((r) => r.id === parentId)
	return {
		parent: parent ? { id: parent.id, name: parent.name } : null,
		children: childrenOf(resource.id, resources),
	}
}
```

- [ ] **Step 5: Run the unit tests**

Run from `web/`: `npx vitest run tests/family.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Write the failing prerender test**

In `web/tests/prerender.test.ts`, add imports:

```ts
import type { PageData } from "../src/pageData.ts"
import { familyOf } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
```

Add after `stubSplit`:

```ts
// prerenderSite takes the server bundle's familyOf the same way; pages in these older tests
// have no parents or children.
const noFamily = () => ({ parent: null, children: [] })
const realFamily = (resource: object, resources: object[]) =>
	familyOf(resource as ResourceDto, resources as ResourceDto[])
```

Add `family: noFamily,` directly after the `pickHelplines:` line in every existing `prerenderSite({` call in the file (`grep -n "prerenderSite({" tests/prerender.test.ts` lists them; there are ten today). Then add:

```ts
test("a detail page bakes its parent and children from its own language's export", async () => {
	const parent = { ...row, id: 1, name: "Hjelpetelefonen (Mental Helse)", parentId: null }
	const work = { ...row, id: 9, name: "Arbeidslivstelefonen (Mental Helse)", parentId: 1 }
	const chat = { ...row, id: 122, name: "Sidetmedord (Mental Helse)", parentId: 1 }
	const { dataDir, distDir } = setup([chat, parent, work], [hamar])
	const render = vi.fn(async (_url: string, _data: Record<string, unknown>) => ({
		html: "<main>x</main>",
		head: null,
	}))
	await prerenderSite({
		dataDir,
		distDir,
		render,
		split: stubSplit,
		pickHelplines: () => [],
		family: realFamily,
		siteOrigin: "https://varde.pages.dev",
		log: () => {},
	})
	const dataFor = (url: string) =>
		render.mock.calls.find(([called]) => called === url)?.[1] as PageData | undefined
	for (const prefix of ["", "/en"]) {
		expect(dataFor(`${prefix}/resources/1`)?.family?.children.map((c) => c.id)).toEqual([9, 122])
		expect(dataFor(`${prefix}/resources/9`)?.family?.parent).toEqual({
			id: 1,
			name: "Hjelpetelefonen (Mental Helse)",
		})
	}
	expect(dataFor("/")?.family).toBeUndefined()
})
```

- [ ] **Step 7: Run it to see it fail**

Run from `web/`: `npx vitest run tests/prerender.test.ts`
Expected: the new test FAILS (`family` is `undefined` on `/resources/1`); the others pass. `npm run typecheck` FAILS on `family` not existing in `PrerenderOptions` and `PageData`.

- [ ] **Step 8: Bake the family in the prerender**

In `web/src/pageData.ts`, import the type and add the field:

```ts
import type { Family } from "./services/family.ts"
```

```ts
export type PageData = {
	resource?: ResourceDto
	// Belongs to `resource`: its parent and its children, found in the same language's export.
	family?: Family
```

In `web/src/entry-server.tsx`, after the `pickHelplines` re-export:

```ts
// The prerender finds a detail page's parent and children with the same function the browser uses.
export { familyOf } from "./services/family.ts"
```

In `web/scripts/prerender.d.mts`, add after `PickHelplinesFn`:

```ts
export type FamilyFn = (resource: object, resources: object[]) => unknown
```

and `family: FamilyFn` after `pickHelplines: PickHelplinesFn` in `PrerenderOptions`.

In `web/scripts/prerender.mjs`, add `family,` after `pickHelplines,` in `prerenderSite`'s destructured options, and change the `data` expression to:

```js
		const data = page.kommune
			? { kommune: split(page.kommune, resourcesByLang[page.lang]) }
			: page.landing
				? { helplines: { lang: page.lang, entries: pickHelplines(resourcesByLang[page.lang]) } }
				: page.data.resource
					? { ...page.data, family: family(page.data.resource, resourcesByLang[page.lang]) }
					: page.data
```

and in the `if (process.argv[1] ...)` block, after `pickHelplines: server.pickHelplines,`:

```js
		family: server.familyOf,
```

- [ ] **Step 9: Run the web suite**

Run from `web/`: `npx biome check --write . && npx biome ci . && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add web/src web/scripts web/tests
git commit -m "feat(web): find a service's parent and children, and bake them into detail pages"
```

---

### Task 5: Landing helplines: two groups, phone and chat buttons

**Files:**
- Modify: `web/src/services/helplines.ts` (replace `HELPLINE_IDS`, `HELPLINE_NOTES`, `Helpline`, `pickHelplines`; keep `safeChatUrl`)
- Modify: `web/src/components/Helplines.tsx`
- Modify: `web/src/components/icons.tsx` (add `PhoneIcon`, `ChatIcon`)
- Modify: `web/src/pageData.ts` (`helplines.entries` type)
- Modify: `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Modify: `web/src/styles/main.css` (`.helpline-row` rule removed, `.helpline-name` changed, `.helpline-group` added)
- Modify: `web/tests/stubData.ts` (`helplineRows`, remove `helpline()`)
- Test: `web/tests/helplines.test.ts`, `web/tests/helplinesSection.test.tsx`, `web/tests/seedDrift.test.ts`

**Interfaces:**
- Consumes: `childrenOf` and `makeResource` from Task 4; `safeChatUrl` (existing).
- Produces:
  - `HELPLINE_GROUPS` (the spec's constant, `as const`), `type HelplineGroupKey = "adults" | "young"`
  - `type Helpline = { id: number; name: string; phone: string | null; chatUrl: string | null }` where `name` is the short label and `chatUrl` is already https-only
  - `type HelplineGroup = { key: HelplineGroupKey; rows: Helpline[] }`
  - `pickHelplines(resources): HelplineGroup[]` (throws on a missing id or a stale label)
  - `chatFor(row: ResourceDto, resources: readonly ResourceDto[]): string | null`
  - DOM hooks Task 6 measures: `.helpline-groups` (the grid of both groups), `.helpline-row` (each `li`), `.helpline-name` (the name link), `.helpline-actions` (the button wrapper); phone buttons are `a[href^="tel:"]`, chat buttons `a[href^="https:"]`.
  - `PageData.helplines.entries: HelplineGroup[]`

- [ ] **Step 1: Point the fixture at the real helpline rows**

In `web/tests/stubData.ts`, delete the `helpline()` function and replace `helplineRows` with (values copied from `api/Varde.Data/Seed/SeedData.cs` rows 1, 2, 4, 9, 121 and 122 after Task 2):

```ts
// The four landing rows and Mental Helse's two children (9 and 122), not in landing order (the
// tests reverse them anyway). Copied from SeedData.cs: Mental Helse has no chat of its own, so its
// chat comes from Sidetmedord.
export const helplineRows: ResourceDto[] = [
	makeResource({
		id: 1,
		name: "Hjelpetelefonen (Mental Helse)",
		phone: "116 123",
		isAlwaysOpen: true,
	}),
	makeResource({
		id: 2,
		name: "Kirkens SOS",
		phone: "22 40 00 40",
		chatUrl: "https://www.soschat.no",
		isAlwaysOpen: true,
	}),
	makeResource({
		id: 4,
		name: "Alarmtelefonen for barn og unge",
		phone: "116 111",
		chatUrl: "https://www.116111.no",
		isAlwaysOpen: true,
	}),
	makeResource({
		id: 9,
		name: "Arbeidslivstelefonen (Mental Helse)",
		phone: "116 123",
		parentId: 1,
		phoneMenuOption: 3,
	}),
	makeResource({
		id: 121,
		name: "Kors på halsen (Røde Kors)",
		phone: "800 33 321",
		chatUrl: "https://www.korspahalsen.no",
	}),
	makeResource({
		id: 122,
		name: "Sidetmedord (Mental Helse)",
		chatUrl: "https://mentalhelse.no/hjelpechat/",
		parentId: 1,
	}),
]
```

`bakedHelplines` stays as it is.

- [ ] **Step 2: Write the failing service tests**

Replace `web/tests/helplines.test.ts` with:

```ts
import { expect, test } from "vitest"
import { chatFor, pickHelplines, safeChatUrl } from "../src/services/helplines.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { helplineRows, makeResource } from "./stubData.ts"

test("two groups of two, in the curated order, whatever the data order", () => {
	const groups = pickHelplines([...helplineRows].reverse())
	expect(groups.map((g) => g.key)).toEqual(["adults", "young"])
	expect(groups.map((g) => g.rows.map((r) => r.id))).toEqual([
		[1, 2],
		[4, 121],
	])
	expect(groups[1]?.rows[1]).toEqual({
		id: 121,
		name: "Kors på halsen",
		phone: "800 33 321",
		chatUrl: "https://www.korspahalsen.no",
	})
})

test("Mental Helse's chat comes from Sidetmedord, its child (row 122)", () => {
	expect(pickHelplines(helplineRows)[0]?.rows[0]).toEqual({
		id: 1,
		name: "Mental Helse",
		phone: "116 123",
		chatUrl: "https://mentalhelse.no/hjelpechat/",
	})
})

test("a service's own safe chat wins over its children's", () => {
	const own = makeResource({ id: 1, name: "P", chatUrl: "https://own.test/" })
	const rows = [own, makeResource({ id: 5, name: "C", parentId: 1, chatUrl: "https://child.test/" })]
	expect(chatFor(own, rows)).toBe("https://own.test/")
})

test("an unsafe chat is skipped, on the service and on a child, for the next safe one", () => {
	const own = makeResource({ id: 1, name: "P", chatUrl: "javascript:alert(1)" })
	const rows = [
		own,
		makeResource({ id: 9, name: "C9", parentId: 1, chatUrl: "https://safe.test/" }),
		makeResource({ id: 7, name: "C7", parentId: 1, chatUrl: "http://plain.test/" }),
	]
	expect(chatFor(own, rows)).toBe("https://safe.test/")
	expect(chatFor(own, [own])).toBeNull()
})

test("data cached before parentId existed gives Mental Helse no chat, and no crash", () => {
	const stale = helplineRows.map(
		({ parentId: _parentId, phoneMenuOption: _menu, ...rest }) => rest
	) as unknown as ResourceDto[]
	expect(pickHelplines(stale)[0]?.rows[0]?.chatUrl).toBeNull()
})

test("a helpline id missing from the data throws, so the build fails", () => {
	const without121 = helplineRows.filter((r) => r.id !== 121)
	expect(() => pickHelplines(without121)).toThrow("helpline id 121 is missing from the data")
})

test("a renamed row that no longer contains its landing label throws, so the build fails", () => {
	const renamed = helplineRows.map((r) => (r.id === 2 ? { ...r, name: "SOS-linjen" } : r))
	expect(() => pickHelplines(renamed)).toThrow(
		'helpline label "Kirkens SOS" is not part of "SOS-linjen" (id 2)'
	)
})

test("only an https:// chat URL survives", () => {
	expect(safeChatUrl("https://sidetmedord.mentalhelse.no/")).toBe(
		"https://sidetmedord.mentalhelse.no/"
	)
	expect(safeChatUrl("http://example.test")).toBeNull()
	expect(safeChatUrl("javascript:alert(1)")).toBeNull()
	expect(safeChatUrl(" https://example.test")).toBeNull()
	expect(safeChatUrl("")).toBeNull()
	expect(safeChatUrl(null)).toBeNull()
})
```

- [ ] **Step 3: Write the failing seed check**

In `web/tests/seedDrift.test.ts`, add the import `import { HELPLINE_GROUPS } from "../src/services/helplines.ts"` and the test:

```ts
test("every landing helpline label is part of its seed row's name", () => {
	for (const group of HELPLINE_GROUPS) {
		for (const row of group.rows) {
			expect(seededResource(row.id).name, `helpline ${row.id}`).toContain(row.name)
		}
	}
})
```

- [ ] **Step 4: Write the failing section tests**

Replace `web/tests/helplinesSection.test.tsx` with:

```tsx
import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { type PageData, PageDataContext } from "../src/pageData.ts"
import { clearIndexCache, loadIndex } from "../src/services/data.ts"
import { pickHelplines } from "../src/services/helplines.ts"
import { bakedHelplines, helplineRows, stubDataFiles } from "./stubData.ts"

afterEach(() => {
	vi.restoreAllMocks()
	clearIndexCache()
	window.history.replaceState(null, "", "/")
})

function renderLanding(data: PageData = bakedHelplines("nb")) {
	return render(
		<PageDataContext.Provider value={data}>
			<App />
		</PageDataContext.Provider>
	)
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// What a sighted user sees on a button: its text without the visually hidden parts.
function visibleText(element: HTMLElement): string {
	const copy = element.cloneNode(true) as HTMLElement
	for (const hidden of copy.querySelectorAll(".visually-hidden")) hidden.remove()
	return copy.textContent?.trim() ?? ""
}

test("two labelled groups hold the four rows in order, each name linking to its page, without a request", () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch")
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getByText("Du kan være anonym.")).toBeInTheDocument()
	expect(
		within(section)
			.getAllByRole("heading", { level: 3 })
			.map((h) => h.textContent)
	).toEqual(["For voksne og generelle livskriser", "For barn og unge"])
	const names = (label: string) =>
		within(within(section).getByRole("list", { name: label }))
			.getAllByRole("listitem")
			.map((li) => within(li).getAllByRole("link")[0]?.textContent)
	expect(names("For voksne og generelle livskriser")).toEqual(["Mental Helse", "Kirkens SOS"])
	expect(names("For barn og unge")).toEqual([
		"Alarmtelefonen for barn og unge",
		"Kors på halsen",
	])
	expect(within(section).getByRole("link", { name: "Kirkens SOS" })).toHaveAttribute(
		"href",
		"/resources/2"
	)
	expect(within(section).queryByText(/tast 3|Arbeidslivstelefonen|Sidetmedord/)).toBeNull()
	expect(fetchSpy).not.toHaveBeenCalled()
})

test("the phone button shows the number and the chat button says Chat, each naming the service", () => {
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	const call = within(section).getByRole("link", { name: "Ring 116 123, Mental Helse" })
	expect(call).toHaveAttribute("href", "tel:116123")
	expect(visibleText(call)).toBe("116 123")
	const chat = within(section).getByRole("link", { name: "Chat, Mental Helse" })
	expect(chat).toHaveAttribute("href", "https://mentalhelse.no/hjelpechat/")
	expect(visibleText(chat)).toBe("Chat")
})

test("every button's name contains its visible label and ends with its service (WCAG 2.5.3)", () => {
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	const rows = within(section).getAllByRole("listitem")
	expect(rows).toHaveLength(4)
	for (const li of rows) {
		const [name, ...buttons] = within(li).getAllByRole("link")
		const service = name?.textContent ?? ""
		expect(buttons).toHaveLength(2)
		for (const button of buttons) {
			expect(button).toHaveAccessibleName(
				new RegExp(`${escape(visibleText(button))}.*, ${escape(service)}$`)
			)
		}
	}
})

test("the English landing labels the groups in English and keeps the service names", async () => {
	stubDataFiles({ resources: helplineRows })
	window.history.replaceState(null, "", "/en/")
	renderLanding(bakedHelplines("en"))
	const section = await screen.findByRole("region", { name: "Someone to talk to" })
	expect(
		within(section)
			.getAllByRole("heading", { level: 3 })
			.map((h) => h.textContent)
	).toEqual(["For adults and general life crises", "For children and young people"])
	expect(within(section).getByRole("link", { name: "Call 116 123, Mental Helse" })).toBeInTheDocument()
})

test("a row whose only chat is not https shows its phone button and no chat link", () => {
	const groups = pickHelplines(
		helplineRows.map((r) => (r.id === 122 ? { ...r, chatUrl: "javascript:alert(1)" } : r))
	)
	renderLanding({ helplines: { lang: "nb", entries: groups } })
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	const mentalHelse = within(section).getAllByRole("listitem")[0] as HTMLElement
	expect(within(mentalHelse).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
		"/resources/1",
		"tel:116123",
	])
})

test("coming back to the landing page without baked data loads the helplines", async () => {
	stubDataFiles({ resources: helplineRows })
	render(<App />)
	const section = await screen.findByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(4)
})

test("with the index already loaded, the section shows on the first render", async () => {
	stubDataFiles({ resources: helplineRows })
	await loadIndex("nb")
	render(<App />)
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(4)
})

test("baked Norwegian helplines are not reused on the English landing page", async () => {
	stubDataFiles({ resources: helplineRows })
	window.history.replaceState(null, "", "/en/")
	renderLanding()
	const section = await screen.findByRole("region", { name: "Someone to talk to" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(4)
	const requested = vi.mocked(fetch).mock.calls.map(([input]) => String(input))
	expect(requested.some((url) => url.includes("resources.en.json"))).toBe(true)
})

test("a landing page whose export holds no helplines still renders, without the section", async () => {
	stubDataFiles({ resources: [] })
	await loadIndex("nb")
	render(<App />)
	expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
	expect(screen.queryByRole("region", { name: "Noen å snakke med" })).toBeNull()
})
```

If Task 1's gate changed the "young" label, use my wording in these tests and in Step 8.

- [ ] **Step 5: Run them to see them fail**

Run from `web/`: `npx vitest run tests/helplines.test.ts tests/helplinesSection.test.tsx tests/seedDrift.test.ts`
Expected: FAIL. `chatFor` and `HELPLINE_GROUPS` are not exported, and the section still renders five rows.

- [ ] **Step 6: Rewrite the service**

Replace everything in `web/src/services/helplines.ts` above the `// A chat link renders only for an https:// URL` comment with:

```ts
import type { ResourceDto } from "../types/api.ts"
import { childrenOf } from "./family.ts"

// "Noen å snakke med" on the landing page (spec C2a): two age groups of two, in this order. The
// names are short landing labels, never translated, and each must be part of its row's data name,
// so a renamed row cannot keep a stale label. The prerender picks the rows from the exported data,
// so a missing id or a stale label fails the build instead of shipping a wrong list.
export const HELPLINE_GROUPS = [
	{ key: "adults", rows: [{ id: 1, name: "Mental Helse" }, { id: 2, name: "Kirkens SOS" }] },
	{
		key: "young",
		rows: [
			{ id: 4, name: "Alarmtelefonen for barn og unge" },
			{ id: 121, name: "Kors på halsen" },
		],
	},
] as const

export type HelplineGroupKey = (typeof HELPLINE_GROUPS)[number]["key"]
// `name` is the short landing label. `chatUrl` has already been through safeChatUrl.
export type Helpline = { id: number; name: string; phone: string | null; chatUrl: string | null }
export type HelplineGroup = { key: HelplineGroupKey; rows: Helpline[] }

export function pickHelplines(resources: readonly ResourceDto[]): HelplineGroup[] {
	return HELPLINE_GROUPS.map((group) => ({
		key: group.key,
		rows: group.rows.map(({ id, name }) => {
			const row = resources.find((r) => r.id === id)
			if (!row) throw new Error(`helpline id ${id} is missing from the data`)
			if (!row.name.includes(name))
				throw new Error(`helpline label "${name}" is not part of "${row.name}" (id ${id})`)
			return { id, name, phone: row.phone, chatUrl: chatFor(row, resources) }
		}),
	}))
}

// A service's chat is its own, or else the first child's (in id order) that is safe. Mental
// Helse's chat lives on Sidetmedord (row 122) only, so the URL has one source.
export function chatFor(row: ResourceDto, resources: readonly ResourceDto[]): string | null {
	const own = safeChatUrl(row.chatUrl)
	if (own) return own
	for (const child of childrenOf(row.id, resources)) {
		const chat = safeChatUrl(child.chatUrl)
		if (chat) return chat
	}
	return null
}
```

Keep the `HTTPS` constant and `safeChatUrl` below it unchanged.

- [ ] **Step 7: Draw the two icons**

Append to `web/src/components/icons.tsx` (drawn for Varde, not copied from Lucide):

```tsx
export function PhoneIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
		</Svg>
	)
}

export function ChatIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.3A8.5 8.5 0 1 1 21 11.5z" />
		</Svg>
	)
}
```

- [ ] **Step 8: Copy**

In `web/src/i18n/nb.json`, replace the line `"landing.helplineNote.9": "Velg tast 3",` with:

```json
	"landing.helplineGroup.adults": "For voksne og generelle livskriser",
	"landing.helplineGroup.young": "For barn og unge",
```

In `web/src/i18n/en.json`, replace `"landing.helplineNote.9": "Choose option 3",` with:

```json
	"landing.helplineGroup.adults": "For adults and general life crises",
	"landing.helplineGroup.young": "For children and young people",
```

- [ ] **Step 9: Page data type**

In `web/src/pageData.ts`, import `HelplineGroup` instead of `Helpline` and change the field to:

```ts
	helplines?: { lang: Lang; entries: HelplineGroup[] }
```

- [ ] **Step 10: Rewrite the section**

In `web/src/components/Helplines.tsx`: change the helplines import to `import { type HelplineGroup, pickHelplines } from "../services/helplines.ts"`, add `import { ChatIcon, PhoneIcon } from "./icons.tsx"`, change `Helpline[]` to `HelplineGroup[]` in `knownHelplines` and in the `fetched` state type, rename the local `entries` (after the effect) to `groups`, and replace the returned JSX with:

```tsx
	const groups = known ?? (fetched?.lang === lang ? fetched.entries : null)
	if (!groups) return null
	return (
		<section aria-labelledby="helplines" className={`@container ${className ?? ""}`}>
			<h2 id="helplines" className="text-2xl lg:text-xl">
				{t("landing.helplinesHeading")}
			</h2>
			<p className="mt-2 text-muted lg:mt-1 lg:text-sm">{t("landing.helplinesSubtitle")}</p>
			{/* From 1024 px, in a column at least 26 rem wide, both groups share one grid: names,
			    then every phone button in one column, then every chat button in one, so their edges
			    line up across the groups (8.5 and 5.75 rem are 136 and 92 px at the default text
			    size). In a narrower column, or with a larger text size, each name sits on its own
			    line with its buttons below. */}
			<div className="helpline-groups mt-3 grid gap-y-5 lg:mt-2 lg:self-start lg:@[26rem]:grid-cols-[minmax(0,1fr)_8.5rem_5.75rem] lg:@[26rem]:gap-x-2 lg:@[26rem]:gap-y-3">
				{groups.map((group) => (
					<section
						key={group.key}
						className="grid gap-y-2 lg:@[26rem]:col-span-3 lg:@[26rem]:grid-cols-subgrid"
					>
						<h3 id={`helplines-${group.key}`} className="helpline-group lg:@[26rem]:col-span-3">
							{t(`landing.helplineGroup.${group.key}`)}
						</h3>
						<ul
							aria-labelledby={`helplines-${group.key}`}
							className="grid gap-y-4 lg:@[26rem]:col-span-3 lg:@[26rem]:grid-cols-subgrid lg:@[26rem]:gap-y-2"
						>
							{group.rows.map((row) => (
								<li
									key={row.id}
									className="helpline-row grid gap-1 lg:@[26rem]:col-span-3 lg:@[26rem]:grid-cols-subgrid lg:@[26rem]:items-center"
								>
									<Link to={`/resources/${row.id}`} className="helpline-name lg:text-sm">
										{row.name}
									</Link>
									{/* Two buttons side by side, or stacked in a column under 20 rem (320 px, or a
									    larger text size). A row without a chat gives its phone the full width. From
									    1024 px the wrapper steps aside (display: contents) so the buttons sit in the
									    shared columns. The hidden words make the names "Ring 116 123, Mental Helse"
									    and "Chat, Mental Helse": the visible label is always part of the name. */}
									<div
										className={`helpline-actions grid gap-2 lg:@[26rem]:contents ${row.chatUrl ? "@[20rem]:grid-cols-2" : ""}`}
									>
										{row.phone && (
											<a href={telHref(row.phone)} className="btn-primary px-3 lg:text-sm">
												<PhoneIcon className="size-5 shrink-0 lg:size-4" />
												<span className="visually-hidden">{t("card.call")} </span>
												{row.phone}
												<span className="visually-hidden">, {row.name}</span>
											</a>
										)}
										{row.chatUrl && (
											<a
												href={row.chatUrl}
												className="btn-secondary px-3 lg:text-sm lg:@[26rem]:col-start-3"
											>
												<ChatIcon className="size-5 shrink-0 lg:size-4" />
												{t("detail.chat")}
												<span className="visually-hidden">, {row.name}</span>
											</a>
										)}
									</div>
								</li>
							))}
						</ul>
					</section>
				))}
			</div>
		</section>
	)
```

Remove the old comment above `<ul>` and every `HELPLINE_NOTES` / `safeChatUrl` use from this file (the URL is already safe).

- [ ] **Step 11: Styles**

In `web/src/styles/main.css`, delete the whole `.helpline-row { ... }` rule. Replace the `.helpline-name` rule with:

```css
	/* Bold names alone in their rows, beside buttons: no underline at rest. They get one on hover
	   and on focus, so they still show they are links when it matters (spec C2a). */
	.helpline-name {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--text);
		font-weight: 600;
		text-decoration: none;
	}
	.helpline-name:hover,
	.helpline-name:focus-visible {
		text-decoration: underline;
	}
	/* The age-group labels: small, uppercase and muted, so they read as labels beside the bold
	   names, by size, weight and colour. */
	.helpline-group {
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
```

- [ ] **Step 12: Run the web suite, then show the label check red once**

Run from `web/`: `npx biome check --write . && npx biome ci . && npm run typecheck && npm test`
Expected: PASS. Then change `"Kirkens SOS"` in `HELPLINE_GROUPS` to `"Kirkens SOS-telefon"`, run `npx vitest run tests/seedDrift.test.ts tests/helplinesSection.test.tsx`, see both FAIL (the seed check names `helpline 2`; the section test throws the stale-label error), restore. Note it for the PR body.

- [ ] **Step 13: Commit**

```bash
git add web/src web/tests
git commit -m "feat(web): show the landing helplines in two age groups with phone and chat"
```

---

### Task 6: Landing layout: shared rows, shared columns, the phone layout

**Files:**
- Modify: `web/src/components/LandingPage.tsx` (the help block)
- Modify: `web/src/styles/main.css` (`.btn-primary` gets a transparent border)
- Test: `web/e2e/landing.spec.ts`, `web/e2e/reflow.spec.ts`

**Interfaces:**
- Consumes: Task 5's DOM hooks (`.helpline-groups`, `.helpline-row`, `.helpline-name`, `a[href^="tel:"]`, `a[href^="https:"]`) and section ids `emergency` and `helplines`.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Share the three rows across the help block**

In `LandingPage.tsx`, change the help block's inner grid and its two sections. The outer `div` loses `lg:items-start` and gains three rows; each section spans them as a subgrid; the emergency list stays at its own height:

```tsx
				{/* Both help sections share three rows (heading, intro line, content) through subgrid, so
				    the headings, the intro lines and the tops of both lists line up across the divider
				    (spec C2a). Each content block keeps its own height (self-start): the emergency list's
				    equal rows must never stretch to the helplines' height. */}
				<div className="grid lg:mx-auto lg:max-w-3xl lg:grid-cols-[2fr_3fr] lg:grid-rows-[auto_auto_auto]">
					<section
						aria-labelledby="emergency"
						className="lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:pr-8"
					>
```

On the emergency `ul`, add `lg:self-start` to its className. Change the `Helplines` call to:

```tsx
					<Helplines className="mt-8 border-t border-border pt-8 lg:row-span-3 lg:mt-0 lg:grid lg:grid-rows-subgrid lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8" />
```

- [ ] **Step 1b: Give `btn-primary` an edge in forced-colors mode**

`btn-primary` has no border, so in Windows high contrast its filled background disappears and the phone button reads as loose text beside a bordered chat button. In `web/src/styles/main.css`, add to the `.btn-primary` rule, after `border-radius: 0.75rem;`:

```css
		/* Invisible normally; forced-colors mode paints it, so the button keeps its edge. */
		border: 1px solid transparent;
```

`min-height` and the grid widths include the border (border-box), so no size changes; the text area is 2 px narrower, which the "text stays inside" checks cover. This also gives the emergency buttons their edge back in high contrast.

- [ ] **Step 2: Replace the old helpline layout test and fix the window-fill measurement**

In `web/e2e/landing.spec.ts`, delete the test `every helpline row lays out the same way at ${width} px (${path})` (it counts five rows and reads `:scope > a`). In the test `the landing page fills a 1638 x 1286 window`, change

```ts
				helpToFooter: Math.round(box("footer").top - box(".helpline-row:last-child").bottom),
```

to

```ts
				helpToFooter: Math.round(box("footer").top - box(".helpline-groups").bottom),
```

(`.helpline-row:last-child` now matches Kirkens SOS, the last row of the first group.)

- [ ] **Step 3: Add the desktop tests**

Append to `web/e2e/landing.spec.ts`:

```ts
// Spec C2a: the help sections share their rows, and both helpline groups share their button
// columns, so edges line up across the divider and across the groups.
for (const width of [1024, 1280, 1920]) {
	test(`the help sections share their rows at ${width} px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 950 })
		await page.goto("/")
		await settle(page)
		await page.locator(".helpline-row").first().waitFor()
		const m = await page.evaluate(() => {
			const top = (s: string) => (document.querySelector(s) as Element).getBoundingClientRect().top
			return [
				[top("#emergency"), top("#helplines")],
				[
					top("section[aria-labelledby=emergency] > p"),
					top("section[aria-labelledby=helplines] > p"),
				],
				[top("section[aria-labelledby=emergency] > ul"), top(".helpline-groups")],
			]
		})
		for (const [left, right] of m) expect(Math.abs(left - right)).toBeLessThanOrEqual(1)
	})

	test(`the helpline buttons share their columns across both groups at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 950 })
		await page.goto("/")
		await settle(page)
		await page.locator(".helpline-row").first().waitFor()
		const rows = await page.locator(".helpline-row").evaluateAll((els) =>
			els.map((li) => {
				const box = (s: string) => (li.querySelector(s) as Element).getBoundingClientRect()
				const name = box(".helpline-name")
				const phone = box('a[href^="tel:"]')
				const chat = box('a[href^="https:"]')
				const mids = [name, phone, chat].map((r) => r.top + r.height / 2)
				return {
					phoneLeft: Math.round(phone.left),
					phoneWidth: Math.round(phone.width),
					chatLeft: Math.round(chat.left),
					chatWidth: Math.round(chat.width),
					spread: Math.max(...mids) - Math.min(...mids),
				}
			})
		)
		expect(rows).toHaveLength(4)
		for (const key of ["phoneLeft", "phoneWidth", "chatLeft", "chatWidth"] as const) {
			expect(new Set(rows.map((r) => r[key])).size, key).toBe(1)
		}
		expect(rows[0]?.phoneWidth).toBe(136)
		expect(rows[0]?.chatWidth).toBe(92)
		for (const r of rows) expect(r.spread, "name and buttons share a centre line").toBeLessThanOrEqual(1)
	})
}
```

- [ ] **Step 4: Add the phone test**

Append:

```ts
for (const path of ["/", "/en/"]) {
	test(`at 375 px each helpline row has its name above two equal 44 px buttons on one bottom edge (${path})`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 900 })
		await page.goto(path)
		await settle(page)
		const rows = await page.locator(".helpline-row").evaluateAll((els) =>
			els.map((li) => {
				const box = (s: string) => (li.querySelector(s) as Element).getBoundingClientRect()
				const name = box(".helpline-name")
				const phone = box('a[href^="tel:"]')
				const chat = box('a[href^="https:"]')
				return {
					below: phone.top >= name.bottom - 1,
					widths: [Math.round(phone.width), Math.round(chat.width)],
					heights: [Math.round(phone.height), Math.round(chat.height)],
					bottoms: [Math.round(phone.bottom), Math.round(chat.bottom)],
				}
			})
		)
		expect(rows).toHaveLength(4)
		for (const r of rows) {
			expect(r.below).toBe(true)
			expect(r.widths[0]).toBe(r.widths[1])
			expect(r.heights).toEqual([44, 44])
			expect(r.bottoms[0]).toBe(r.bottoms[1])
		}
	})
}
```

- [ ] **Step 4b: Add the forced-colors test for the landing buttons**

Append to `web/e2e/landing.spec.ts`:

```ts
test("every helpline and emergency button keeps a visible edge in forced-colors mode", async ({
	page,
}) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto("/")
	await page.locator(".helpline-row").first().waitFor()
	const borders = await page
		.locator(".helpline-row a[href^='tel:'], .helpline-row a[href^='https:'], section[aria-labelledby=emergency] a")
		.evaluateAll((els) => els.map((el) => getComputedStyle(el).borderTopStyle))
	expect(borders).toHaveLength(12)
	for (const style of borders) expect(style).toBe("solid")
})
```

- [ ] **Step 5: Add the reflow tests**

Append to `web/e2e/reflow.spec.ts`:

```ts
// Spec C2a: in a narrow column the helpline buttons stack at full width; with a larger text size
// on a desktop window the rows use the phone layout instead of squeezing the names. Either way no
// label leaves its button and the page never scrolls sideways.
for (const [label, width, fontSize, stacked] of [
	["320 px", 320, "100%", true],
	["200 % text at 375 px", 375, "200%", true],
	["200 % text at 1280 px", 1280, "200%", false],
] as const) {
	test(`helpline rows reflow at ${label}`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/")
		await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
		await page.evaluate(() => document.fonts.ready)
		await page.locator(".helpline-row").first().waitFor()
		const rows = await page.locator(".helpline-row").evaluateAll((els) =>
			els.map((li) => {
				const name = (li.querySelector(".helpline-name") as Element).getBoundingClientRect()
				const buttons = [...li.querySelectorAll("a[href^='tel:'], a[href^='https:']")]
				const boxes = buttons.map((b) => b.getBoundingClientRect())
				// Only the visible text nodes; the visually hidden spans are positioned on their own.
				const inside = buttons.every((b) => {
					const box = b.getBoundingClientRect()
					return [...b.childNodes]
						.filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
						.every((n) => {
							const range = document.createRange()
							range.selectNodeContents(n)
							const r = range.getBoundingClientRect()
							return r.left >= box.left - 0.5 && r.right <= box.right + 0.5
						})
				})
				return {
					nameAbove: (boxes[0]?.top ?? 0) >= name.bottom - 1,
					stacked: (boxes[1]?.top ?? 0) >= (boxes[0]?.bottom ?? 0) - 1,
					inside,
				}
			})
		)
		expect(rows).toHaveLength(4)
		for (const r of rows) {
			expect(r.nameAbove).toBe(true)
			expect(r.inside).toBe(true)
			if (stacked) expect(r.stacked).toBe(true)
		}
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}
```

- [ ] **Step 6: Run the browser suite**

Run from `web/`: `mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test`
Expected: PASS, including all four `the landing page fits one 1920 x 950 screen` tests. **If a fit test fails, stop and ask me what gives. Do not tighten any spacing to make it pass.** If the 136 or 92 px expectation fails by a pixel or two, check the button's own padding before changing anything, and report the measured value.

- [ ] **Step 7: Show the shared-rows test red once**

Remove `lg:grid-rows-subgrid` from the `Helplines` className, rebuild (`npm run build:site`), run `npx playwright test e2e/landing.spec.ts -g "share their rows"`, see it FAIL, restore and rebuild. Then remove Step 1b's `border` line, rebuild, run `-g "forced-colors"`, see it FAIL on the phone and emergency buttons, restore and rebuild. Note both for the PR body.

- [ ] **Step 8: Commit**

```bash
git add web/src web/e2e
git commit -m "feat(web): line up the help sections and the helpline buttons across the landing"
```

(`web/src` includes Step 1b's `main.css` change.)

---

### Task 7: Detail page contact tiles

**Files:**
- Create: `web/src/services/contactTiles.ts`
- Create: `web/src/components/ContactTiles.tsx`
- Create: `web/tests/contactTiles.test.ts`
- Create: `web/e2e/detail.spec.ts`
- Modify: `web/src/components/ResourceDetail.tsx`
- Modify: `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Modify: `web/src/styles/main.css` (`.contact-tile`, `.contact-tile-icon`)
- Test: `web/tests/detail.test.tsx`

**Interfaces:**
- Consumes: `Family`, `NO_FAMILY`, `familyOf`, `childrenOf` (Task 4); `safeChatUrl` (Task 5's file); `telHref` (existing, `services/emergency.ts`); `PhoneIcon`, `ChatIcon` (Task 5); `helplineRows`, `makeResource` (Tasks 4 and 5).
- Produces:
  - `type ContactTile = { kind: "phone"; key: string; name: string | null; phone: string; menuOption: number | null; alwaysOpen: boolean; href: string } | { kind: "chat"; key: string; name: string | null; href: string }` (`name` null means the service itself)
  - `contactTiles(resource: ResourceDto, children: readonly ResourceDto[]): ContactTile[]`
  - DOM hooks: `.contact-tile` (each tile link), `.contact-tile-label`, `.contact-tile-value`.

- [ ] **Step 1: Write the failing unit tests**

Create `web/tests/contactTiles.test.ts`:

```ts
import { expect, test } from "vitest"
import { contactTiles } from "../src/services/contactTiles.ts"
import { childrenOf } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { helplineRows, makeResource } from "./stubData.ts"

const row = (id: number) => helplineRows.find((r) => r.id === id) as ResourceDto

test("Mental Helse: its own phone, then the child chat, then the child phone", () => {
	expect(contactTiles(row(1), childrenOf(1, helplineRows))).toEqual([
		{
			kind: "phone",
			key: "phone-1",
			name: null,
			phone: "116 123",
			menuOption: null,
			alwaysOpen: true,
			href: "tel:116123",
		},
		{
			kind: "chat",
			key: "chat-122",
			name: "Sidetmedord (Mental Helse)",
			href: "https://mentalhelse.no/hjelpechat/",
		},
		{
			kind: "phone",
			key: "phone-9",
			name: "Arbeidslivstelefonen (Mental Helse)",
			phone: "116 123",
			menuOption: 3,
			alwaysOpen: false,
			href: "tel:116123",
		},
	])
})

test("Kirkens SOS: phone then its own chat", () => {
	expect(contactTiles(row(2), []).map((t) => [t.kind, t.name, t.href])).toEqual([
		["phone", null, "tel:22400040"],
		["chat", null, "https://www.soschat.no"],
	])
})

test("a child with neither phone nor safe chat gets no tile, and an unsafe chat never becomes one", () => {
	const parent = makeResource({ id: 1, name: "P", chatUrl: "javascript:alert(1)" })
	const children = [
		makeResource({ id: 5, name: "Nothing", parentId: 1, website: "https://x.test/" }),
		makeResource({ id: 6, name: "Plain", parentId: 1, chatUrl: "http://plain.test/" }),
	]
	expect(contactTiles(parent, children)).toEqual([])
})

test("rows cached before the new fields existed give a plain number, never 'undefined'", () => {
	const { phoneMenuOption: _menu, parentId: _parent, ...stale } = row(9)
	expect(contactTiles(stale as unknown as ResourceDto, [])).toEqual([
		{
			kind: "phone",
			key: "phone-9",
			name: null,
			phone: "116 123",
			menuOption: null,
			alwaysOpen: false,
			href: "tel:116123",
		},
	])
})
```

- [ ] **Step 2: Run them to see them fail**

Run from `web/`: `npx vitest run tests/contactTiles.test.ts`
Expected: FAIL with "Failed to resolve import ../src/services/contactTiles.ts".

- [ ] **Step 3: Write `contactTiles.ts`**

Create `web/src/services/contactTiles.ts`:

```ts
import type { ResourceDto } from "../types/api.ts"
import { telHref } from "./emergency.ts"
import { safeChatUrl } from "./helplines.ts"

// One tile per way to reach a service (spec C2a). `name` is null for the service itself (the
// tile says "Ring" or "Chat") and a child's data name for a sub-service.
export type ContactTile =
	| {
			kind: "phone"
			key: string
			name: string | null
			phone: string
			menuOption: number | null
			alwaysOpen: boolean
			href: string
	  }
	| { kind: "chat"; key: string; name: string | null; href: string }

// Order: the service's own phone, its own chat, then children that are chats, then children
// that are phones, each in id order, so a chat sits second the way it does on Mental Helse's own
// site. A child with a phone is a phone tile; otherwise a safe chat makes it a chat tile; a child
// with neither gets none. An unsafe chat URL never becomes a link.
export function contactTiles(
	resource: ResourceDto,
	children: readonly ResourceDto[]
): ContactTile[] {
	const own: ContactTile[] = []
	if (resource.phone) own.push(phoneTile(resource, resource.phone, null))
	const chat = safeChatUrl(resource.chatUrl)
	if (chat) own.push({ kind: "chat", key: `chat-${resource.id}`, name: null, href: chat })
	const childTiles = [...children]
		.sort((a, b) => a.id - b.id)
		.flatMap((child): ContactTile[] => {
			if (child.phone) return [phoneTile(child, child.phone, child.name)]
			const childChat = safeChatUrl(child.chatUrl)
			return childChat
				? [{ kind: "chat", key: `chat-${child.id}`, name: child.name, href: childChat }]
				: []
		})
	return [
		...own,
		...childTiles.filter((t) => t.kind === "chat"),
		...childTiles.filter((t) => t.kind === "phone"),
	]
}

// `?? null`: data cached from before phoneMenuOption existed has no such key.
function phoneTile(row: ResourceDto, phone: string, name: string | null): ContactTile {
	return {
		kind: "phone",
		key: `phone-${row.id}`,
		name,
		phone,
		menuOption: row.phoneMenuOption ?? null,
		alwaysOpen: row.isAlwaysOpen,
		href: telHref(phone),
	}
}
```

- [ ] **Step 4: Run the unit tests**

Run from `web/`: `npx vitest run tests/contactTiles.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing page tests**

In `web/tests/detail.test.tsx`, add imports:

```ts
import { within } from "@testing-library/react"
import { PageDataContext } from "../src/pageData.ts"
import { familyOf } from "../src/services/family.ts"
import { helplineRows } from "./stubData.ts"
```

(merge `within` into the existing `@testing-library/react` import and `helplineRows` into the existing `./stubData.ts` import). Replace the test `the call button is the hero and the back link is a plain link without history state` with:

```tsx
test("the phone tile calls the service and the back link is a plain link without history state", async () => {
	stubDataFiles({ resources: [detail] })
	window.history.replaceState(null, "", "/resources/12")
	render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={12} arrival={0} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	const call = await screen.findByRole("link", { name: "Ring, døgnåpen, 62 00 00 00" })
	expect(call).toHaveAttribute("href", "tel:62000000")
	// Assert role + accessible name, not the class that styles the tile, so a redesign does not
	// have to touch this test.
	expect(screen.getByRole("link", { name: "Tilbake til resultater" })).toHaveAttribute(
		"href",
		"/sok"
	)
	await waitFor(() => expect(document.title).toBe("Krisesenteret i Hamar – Varde"))
})
```

Then append:

```tsx
function renderHelpline(id: number, lang: "nb" | "en" = "nb") {
	stubDataFiles({ resources: helplineRows })
	render(
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>
				<ResourceDetail id={id} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
}

// What a sighted user sees: the text without the visually hidden commas.
function visibleText(element: HTMLElement): string {
	const copy = element.cloneNode(true) as HTMLElement
	for (const hidden of copy.querySelectorAll(".visually-hidden")) hidden.remove()
	return copy.textContent ?? ""
}

test("Mental Helse's contact block: its phone, Sidetmedord's chat, then Arbeidslivstelefonen", async () => {
	renderHelpline(1)
	const block = await screen.findByRole("region", { name: "Kontakt" })
	expect(within(block).getByRole("heading", { level: 2, name: "Kontakt" })).toBeInTheDocument()
	const tiles = within(block).getAllByRole("link")
	expect(tiles.map((a) => a.getAttribute("href"))).toEqual([
		"tel:116123",
		"https://mentalhelse.no/hjelpechat/",
		"tel:116123",
	])
	expect(tiles[0]).toHaveAccessibleName("Ring, døgnåpen, 116 123")
	expect(tiles[0]).not.toHaveAccessibleName(/·/)
	expect(visibleText(tiles[0] as HTMLElement)).toContain("Ring · døgnåpen")
	expect(tiles[1]).toHaveAccessibleName("Sidetmedord (Mental Helse), Åpne chatten")
	expect(tiles[2]).toHaveAccessibleName("Arbeidslivstelefonen (Mental Helse), 116 123, tast 3")
})

test("døgnåpen sits on Kirkens SOS's phone tile and never on its chat tile", async () => {
	renderHelpline(2)
	const block = await screen.findByRole("region", { name: "Kontakt" })
	const [phone, chat] = within(block).getAllByRole("link")
	expect(phone).toHaveAccessibleName("Ring, døgnåpen, 22 40 00 40")
	expect(chat).toHaveAccessibleName("Chat, Åpne chatten")
	expect(chat).toHaveAttribute("href", "https://www.soschat.no")
})

test("in English the tiles say Call, open 24/7, Open the chat and press 3", async () => {
	renderHelpline(1, "en")
	const block = await screen.findByRole("region", { name: "Contact" })
	expect(within(block).getAllByRole("link")).toHaveLength(3)
	const [phone, chat, work] = within(block).getAllByRole("link")
	expect(phone).toHaveAccessibleName("Call, open 24/7, 116 123")
	expect(chat).toHaveAccessibleName("Sidetmedord (Mental Helse), Open the chat")
	expect(work).toHaveAccessibleName("Arbeidslivstelefonen (Mental Helse), 116 123, press 3")
})

test("a child page says which service it belongs to, linking there", async () => {
	renderHelpline(9)
	await screen.findByRole("heading", { level: 1, name: "Arbeidslivstelefonen (Mental Helse)" })
	const parent = screen.getByRole("link", { name: "Hjelpetelefonen (Mental Helse)" })
	expect(parent).toHaveAttribute("href", "/resources/1")
	expect(parent.parentElement).toHaveTextContent("Del av Hjelpetelefonen (Mental Helse)")
})

test("in English the parent link keeps the English prefix", async () => {
	renderHelpline(9, "en")
	const parent = await screen.findByRole("link", { name: "Hjelpetelefonen (Mental Helse)" })
	expect(parent).toHaveAttribute("href", "/en/resources/1")
	expect(parent.parentElement).toHaveTextContent("Part of Hjelpetelefonen (Mental Helse)")
})

test("a child whose parent is missing from the data shows no Del av line", async () => {
	stubDataFiles({ resources: helplineRows.filter((r) => r.id !== 1) })
	render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={9} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await screen.findByRole("heading", { level: 1, name: "Arbeidslivstelefonen (Mental Helse)" })
	expect(screen.queryByText(/Del av/)).toBeNull()
})

test("a prerendered Mental Helse page shows its child tiles without a request", () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch")
	const resource = helplineRows.find((r) => r.id === 1) as ResourceDto
	render(
		<PageDataContext.Provider value={{ resource, family: familyOf(resource, helplineRows) }}>
			<LanguageProvider lang="nb">
				<AnnouncerProvider>
					<ResourceDetail id={1} />
				</AnnouncerProvider>
			</LanguageProvider>
		</PageDataContext.Provider>
	)
	const block = screen.getByRole("region", { name: "Kontakt" })
	expect(within(block).getAllByRole("link")).toHaveLength(3)
	expect(fetchSpy).not.toHaveBeenCalled()
	fetchSpy.mockRestore()
})

test("a service with no phone, no chat and no children has no contact block", async () => {
	await renderDetail({ ...detail, phone: null, chatUrl: null })
	expect(screen.queryByRole("region", { name: "Kontakt" })).toBeNull()
})

test("the chat is a tile now, not a raw address in the facts list", async () => {
	await renderDetail({ ...detail, chatUrl: "https://chat.example.test/" })
	expect(screen.queryByText("https://chat.example.test/")).toBeNull()
	expect([...document.querySelectorAll("dt")].map((dt) => dt.textContent)).not.toContain("Chat")
	expect(screen.getByRole("link", { name: "Chat, Åpne chatten" })).toHaveAttribute(
		"href",
		"https://chat.example.test/"
	)
})

test("a chat address that is not https never becomes a tile", async () => {
	await renderDetail({ ...detail, chatUrl: "javascript:alert(1)" })
	expect(screen.queryByRole("link", { name: /Åpne chatten/ })).toBeNull()
})
```

`renderDetail` is defined further down the file; move these tests below it, or move `renderDetail` and `installNavigator` up, so the helpers exist before use (function declarations hoist, `let restoreNavigator` does not, so keep that `let` above any test that uses it).

- [ ] **Step 6: Run them to see them fail**

Run from `web/`: `npx vitest run tests/detail.test.tsx`
Expected: FAIL. There is no "Kontakt" region yet, and the call link is still named "Ring 62 00 00 00".

- [ ] **Step 7: Copy**

In `web/src/i18n/nb.json`, after `"detail.copyFailed": "Kunne ikke kopiere",`:

```json
	"detail.contactHeading": "Kontakt",
	"detail.tile.alwaysOpen": "døgnåpen",
	"detail.tile.openChat": "Åpne chatten",
	"detail.tile.menuOption": "tast {n}",
	"detail.partOf": "Del av {name}",
```

In `web/src/i18n/en.json`, after the `"detail.copyFailed"` line:

```json
	"detail.contactHeading": "Contact",
	"detail.tile.alwaysOpen": "open 24/7",
	"detail.tile.openChat": "Open the chat",
	"detail.tile.menuOption": "press {n}",
	"detail.partOf": "Part of {name}",
```

- [ ] **Step 8: Write the tile component**

Create `web/src/components/ContactTiles.tsx`:

```tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { ContactTile } from "../services/contactTiles.ts"
import { ChatIcon, PhoneIcon } from "./icons.tsx"

// The detail page's contact block (spec C2a). The whole tile is one link, and its name is the
// visible text in reading order, so voice control works with what is on screen. The " · " is
// hidden from screen readers and a hidden comma stands in, so NVDA reads "Ring, døgnåpen, 116 123"
// and not "Ring dot døgnåpen". The hidden h2 puts the block in the heading list.
export function ContactTiles({ tiles }: { tiles: ContactTile[] }) {
	const t = useTranslation()
	if (tiles.length === 0) return null
	return (
		<section aria-labelledby="contact">
			<h2 id="contact" className="visually-hidden">
				{t("detail.contactHeading")}
			</h2>
			<ul className="grid auto-rows-fr gap-3 md:grid-cols-2">
				{tiles.map((tile) => (
					<li key={tile.key}>
						<a
							href={tile.href}
							className="contact-tile"
							rel={tile.kind === "chat" ? "noopener noreferrer" : undefined}
						>
							<span className="contact-tile-icon">
								{tile.kind === "phone" ? <PhoneIcon /> : <ChatIcon />}
							</span>
							<span className="grid min-w-0">
								<span className="contact-tile-label block text-sm text-muted">
									{tile.name ?? t(tile.kind === "phone" ? "card.call" : "detail.chat")}
									{tile.kind === "phone" && tile.alwaysOpen && (
										<>
											<span aria-hidden="true"> · </span>
											<span className="visually-hidden">, </span>
											{t("detail.tile.alwaysOpen")}
										</>
									)}
									<span className="visually-hidden">, </span>
								</span>
								<span className="contact-tile-value block font-semibold">
									{tile.kind === "chat"
										? t("detail.tile.openChat")
										: tile.menuOption === null
											? tile.phone
											: `${tile.phone}, ${t("detail.tile.menuOption").replace("{n}", String(tile.menuOption))}`}
								</span>
							</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	)
}
```

- [ ] **Step 9: Tile styles**

In `web/src/styles/main.css`, inside `@layer components`, after the `.helpline-group` rule:

```css
	/* A contact tile on the detail page (spec C2a): the whole tile is one link. The 1 px border
	   keeps its edge in forced-colors mode, where the accent-soft fill disappears. 69 px is the
	   minimum: a long child name wraps inside the tile and makes it taller, never clipped. */
	.contact-tile {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		height: 100%;
		min-height: 69px;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--surface);
		color: var(--text);
		text-decoration: none;
	}
	.contact-tile-icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 0.5rem;
		background: var(--accent-soft);
		color: var(--accent);
	}
```

- [ ] **Step 10: Wire the page**

In `web/src/components/ResourceDetail.tsx`:

Imports: remove `import { telHref } from "../services/emergency.ts"`; add

```ts
import { contactTiles } from "../services/contactTiles.ts"
import { type Family, familyOf, NO_FAMILY } from "../services/family.ts"
import { ContactTiles } from "./ContactTiles.tsx"
```

The ready state carries the family:

```ts
	| { kind: "ready"; resource: ResourceDto; family: Family }
```

The initial state:

```ts
	const [state, setState] = useState<DetailState>(() =>
		pageData.resource?.id === id
			? { kind: "ready", resource: pageData.resource, family: pageData.family ?? NO_FAMILY }
			: { kind: "loading" }
	)
```

The index lookup in the fetch effect:

```ts
				const found = index.resources.find((r) => r.id === id)
				setState(
					found
						? { kind: "ready", resource: found, family: familyOf(found, index.resources) }
						: { kind: "missing" }
				)
```

After `if (state.kind === "missing") ...`, replace `const { resource } = state` with:

```ts
	const { resource, family } = state
	const tiles = contactTiles(resource, family.children)
	const [partOfBefore = "", partOfAfter = ""] = t("detail.partOf").split("{name}")
```

In the header, directly after the municipality `<p>`:

```tsx
				{family.parent && (
					<p className="text-sm text-muted">
						{partOfBefore}
						<Link to={`/resources/${family.parent.id}`} className="text-accent underline">
							{family.parent.name}
						</Link>
						{partOfAfter}
					</p>
				)}
```

Replace the whole hero block (the comment starting `Call is the hero action` and the `{(resource.phone || capability !== "none") && (...)}` block) with:

```tsx
				{/* Every way to reach the service is a tile (spec C2a). Copy-number and share stay
				    below as buttons: a chat- or web-only service still shares. */}
				<ContactTiles tiles={tiles} />
				{((resource.phone && canCopy) || capability !== "none") && (
					<div className="flex flex-wrap items-center gap-2">
						{resource.phone && canCopy && (
							<button
								type="button"
								className="btn-secondary"
								onClick={() => resource.phone && onCopyPhone(resource.phone)}
							>
								{t("detail.copyPhone")}
							</button>
						)}
						{capability !== "none" && (
							<button type="button" className="btn-secondary" onClick={onShare}>
								{t(capability === "share" ? "detail.share" : "detail.copyLink")}
							</button>
						)}
					</div>
				)}
```

Change the comment above the `<dl>` to `{/* Hours and the other facts. Phone and chat are tiles above. */}` and delete the `{resource.chatUrl && (...)}` block inside the `<dl>`.

- [ ] **Step 11: Run the web suite**

Run from `web/`: `npx biome check --write . && npx biome ci . && npm run typecheck && npm test`
Expected: PASS, including `axe.test.tsx` on the detail page.

- [ ] **Step 12: Write the browser tests**

Create `web/e2e/detail.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import { noHorizontalScroll, settle } from "./helpers.ts"

type Tile = {
	label: string
	top: number
	left: number
	height: number
	bottom: number
	inside: boolean
}

// Each tile's box, and whether its two text lines stay inside it (no overflow, no clipping).
async function measureTiles(page: import("@playwright/test").Page): Promise<Tile[]> {
	return page.locator(".contact-tile").evaluateAll((els) =>
		els.map((el) => {
			const box = el.getBoundingClientRect()
			const lines = [".contact-tile-label", ".contact-tile-value"].map(
				(s) => el.querySelector(s) as HTMLElement
			)
			return {
				label: el.textContent ?? "",
				top: Math.round(box.top),
				left: Math.round(box.left),
				height: Math.round(box.height),
				bottom: Math.round(box.bottom),
				inside: lines.every((line) => {
					const r = line.getBoundingClientRect()
					return (
						line.scrollWidth <= line.clientWidth &&
						r.right <= box.right + 0.5 &&
						r.bottom <= box.bottom + 0.5
					)
				}),
			}
		})
	)
}

// Spec C2a: Mental Helse's page has three tiles, including the longest child name, in both
// languages. Tiles in a row share one height and both edges; one column below 768 px, two from it.
for (const width of [375, 1024]) {
	for (const path of ["/resources/1", "/en/resources/1"]) {
		test(`contact tiles line up and keep their text inside at ${width} px (${path})`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			const tiles = await measureTiles(page)
			expect(tiles).toHaveLength(3)
			expect(new Set(tiles.map((t) => t.left)).size).toBe(width >= 768 ? 2 : 1)
			for (const top of new Set(tiles.map((t) => t.top))) {
				const row = tiles.filter((t) => t.top === top)
				expect(new Set(row.map((t) => t.height)).size).toBe(1)
				expect(new Set(row.map((t) => t.bottom)).size).toBe(1)
			}
			for (const t of tiles) {
				expect(t.height, t.label).toBeGreaterThanOrEqual(69)
				expect(t.inside, t.label).toBe(true)
			}
		})
	}
}

for (const [label, width, fontSize] of [
	["320 px", 320, "100%"],
	["200 % text at 375 px", 375, "200%"],
] as const) {
	test(`the tile grid reflows at ${label}`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/resources/1")
		await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
		await page.evaluate(() => document.fonts.ready)
		const tiles = await measureTiles(page)
		expect(tiles).toHaveLength(3)
		for (const t of tiles) expect(t.inside, t.label).toBe(true)
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}

test("each contact tile keeps a visible border in forced-colors mode", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.goto("/resources/1")
	const borders = await page
		.locator(".contact-tile")
		.evaluateAll((els) =>
			els.map((el) => `${getComputedStyle(el).borderTopStyle} ${getComputedStyle(el).borderTopWidth}`)
		)
	expect(borders).toHaveLength(3)
	for (const b of borders) expect(b).toBe("solid 1px")
})
```

- [ ] **Step 13: Run the browser suite, then show the forced-colors test red once**

Run from `web/`: `mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test`
Expected: PASS. Then change `border: 1px solid var(--border);` in `.contact-tile` to `border: none;`, rebuild, run `npx playwright test e2e/detail.spec.ts -g "forced-colors"`, see it FAIL, restore and rebuild. Note it for the PR body.

- [ ] **Step 14: Commit**

```bash
git add web/src web/tests web/e2e
git commit -m "feat(web): show every way to reach a service as contact tiles"
```

---

### Task 8: Final checks, preview for me, PR

**Files:**
- No source changes unless a check fails.

**Interfaces:**
- Consumes: everything above.
- Produces: the pushed branch, an open PR, and a preview I test.

- [ ] **Step 1: Run every suite from clean**

From `api/`: `dotnet test Varde.slnx`. From `web/`: `npx biome ci . && npm run typecheck && npm test && mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test`.
Expected: all PASS. Read the counts off the output; they go in the PR body.

- [ ] **Step 2: Check the spec against the build**

Dispatch a fresh reviewer (no context from the build) with the spec and `git diff origin/main...HEAD`. It checks every spec section (Data, Landing, Detail page, Copy, Testing) and the three amendments, and lists anything missing or different. Fix real gaps in the task that owns the code, rerun Step 1.

- [ ] **Step 3: Serve a preview and measure it**

Start the `web-preview` configuration (`preview_start`) on the built `dist/`. Take screenshots of `/` and `/resources/1` at 375, 1024 and 1920 px, in nb and en, in light and dark, in one batch. Measure, do not eyeball: on the landing, read the boxes of both headings, both intro lines, every helpline button and every name (the Task 6 checks give the numbers); on `/resources/1`, read every tile's box and the copy and share buttons' heights and bottom edges. Also check by hand that the group labels read as labels (muted, small, uppercase) beside the bold names, and that a name shows an underline on hover and on keyboard focus.

Keyboard-only walk, at 375 and 1280 px: Tab from the search through the landing's help block. The order is the four emergency buttons, then per helpline row name, phone, chat. On `/resources/1`, Tab reaches each tile once (one stop per tile, not per line of text), then copy and share. Every focus ring is fully visible: not clipped by the tile grid, not hidden under the sticky header.

- [ ] **Step 4: Show me before the PR**

Put the screenshots and the measured numbers in front of me, with the preview URL. If anything looks off after one fix round, show me what is left instead of polishing further.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin feat/helplines-c2a
```

Open the PR against `main` with `gh pr create`. Title: `feat: helplines in age groups on the landing, contact tiles on detail pages (C2a)`. Body, in first person, no em dashes:
- **What** (three bullets: data, landing, detail page);
- **Decided while planning** (the three spec amendments, one line each);
- **Checks** (the counts from Step 1, read off the output);
- **Red proofs** (each deliberate break from Tasks 3, 5, 6 and 7 and the failure it produced);
- **Test before merge** (375, 1024 and 1920 px, both languages, both themes; NVDA on `/resources/1`: the tile names read as "Ring, døgnåpen, 116 123");
- **Follow-ups** (C2b: "Se mer informasjon", Hjelpetelefoner page, the 11 unseeded services; the mega-menu plan rebases on this).

Then bind the PR with the ccd_pr tools and stop. Merging is my call.

---

## Considered and rejected (stress test, 2026-10-16)

- **An old prerendered page served from a cache, with new JavaScript.** A detail page saved before this deploy carries no `family`, so Mental Helse shows only its own tiles until the next load. It heals itself on reload and nothing breaks, so no version check.
- **A red proof for the 26 rem fallback.** The 200 % test at 1280 px asserts the name sits above the buttons, which the three-column layout can never satisfy, so the check cannot pass with the guard gone. A deliberate break would mean editing a dozen class names for no new information.
- **A test for text spacing (WCAG 1.4.12).** Buttons and tiles use `min-height`, never a fixed height, and the text checks already cover overflow at 200 % text.
- **`rel="noopener noreferrer"` on the landing chat buttons too.** `index.html` already sends `no-referrer` for every link, and the links open in the same tab, so it would change nothing.

> Stress-tested 2026-10-16 (skill 1b85fca): 4 applied, 0 adapted, 0 decided by me.

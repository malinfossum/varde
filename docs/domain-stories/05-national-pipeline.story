title: Varde 5: the national pipeline refreshes a kommune
scope: medium-grained, to-be, digitalized
info: The design in docs/superpowers/specs/2026-10-28-varde-national-data-design.md. Built so far: sentences 1-3 (discover and fetch, PR 2), the gates behind 6 and the score in 8 (PR 1). Extract, verify and review come in PR 3, automation in PR 5. Where the site reads the result is spec B, not decided here.
actors: Pipeline=System, Registers=System, KommuneSites=Group, Model=System, Malin=Person, GitHub=System
objects: Unit records=Document, Sitemaps=Document, Unit pages=Folder, Page text=Document, Values with quotes=Info, Five gates=Info, Lock file=Document, Recall score=Info, Review item=Info, Curated file=Document, Refresh PR=Document, Weekly review PR=Document
1. Pipeline | reads | Unit records | from Registers
2. Pipeline | reads | Sitemaps | from KommuneSites
3. Pipeline | fetches | Unit pages | from KommuneSites
4. Pipeline | sends | Page text | to Model
5. Model | returns | Values with quotes | to Pipeline
6. Pipeline | runs | Five gates
7. Pipeline | writes | Lock file
8. Pipeline | scores | Recall score
9. Pipeline | asks | Review item | of Malin
10. Malin | records | Curated file
11. Pipeline | opens | Refresh PR | on GitHub
12. GitHub | auto-merges | Refresh PR
13. Pipeline | opens | Weekly review PR | for Malin

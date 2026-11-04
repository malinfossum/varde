title: Varde 6: the pipeline extracts, checks and publishes a kommune
scope: medium-grained, to-be, digitalized
info: The design in docs/superpowers/specs/2026-10-28-varde-national-data-design.md. The five gates and both file schemas exist (PR 1); the extract, verify and review stages come in PR 3, the scheduled runs and auto-merge in PR 5. Where the site reads the result is spec B.
actors: Pipeline=System, Model=System, Malin=Person, GitHub=System
objects: Page text=Document, Values with quotes=Info, Five gates=Info, Lock file=Document, Review item=Info, Decision=Info, Curated file=Document, Refresh PR=Document, Weekly review PR=Document
1. Pipeline | sends | Page text | to Model
2. Model | returns | Values with quotes | to Pipeline
3. Pipeline | runs | Five gates
4. Pipeline | writes | Lock file
5. Pipeline | shows | Review item | to Malin
6. Malin | gives | Decision | to Pipeline
7. Pipeline | writes | Curated file
8. Pipeline | opens | Refresh PR | on GitHub
9. GitHub | auto-merges | Refresh PR
10. Pipeline | opens | Weekly review PR | for Malin

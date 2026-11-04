title: Varde 0: the whole project at a glance
scope: coarse-grained, as-is with the planned pipeline steps marked, digitalized
info: Every part of Varde on one board, one sentence each. Sentences 1-18 run today; 19-22 are the planned pipeline steps (national data plan, PR 3 and 5). Stories 1-6 zoom in on each part.
actors: Researchers=System, Sources=Group, Malin=Person, Dependabot=System, GitHub=System, Checks=System, GHCR=System, DeployWeb=System, Neon=System, Pages=System, Visitor=Person, Pipeline=System, Registers=System, Model=System
objects: Service facts=Document, Check reports=Document, Seed row=Document, Version bump=Document, Pull request=Document, Check results=Info, API image=Folder, Deploy run=Info, Seed rows=Document, JSON data=Folder, Prerendered site=Folder, Prerendered page=Document, JSON index=Document, Error report=Email, Run command=Info, Units and sitemaps=Document, Unit pages=Folder, Page text=Document, Five gates=Info, Review items=Info, Data PR=Document
1. Researchers | quote | Service facts | from Sources
2. Researchers | hand | Check reports | to Malin
3. Malin | commits | Seed row | to GitHub
4. Dependabot | opens | Version bump | on GitHub
5. GitHub | sends | Pull request | to Checks
6. Checks | report | Check results | to GitHub
7. Checks | push | API image | to GHCR
8. GitHub | starts | Deploy run | in DeployWeb
9. DeployWeb | migrates | Seed rows | into Neon
10. DeployWeb | exports | JSON data | from Neon
11. DeployWeb | uploads | Prerendered site | to Pages
12. Visitor | opens | Prerendered page | from Pages
13. Visitor | searches | JSON index | on Pages
14. Visitor | reports | Error report | to Malin
15. Malin | runs | Run command | in Pipeline
16. Pipeline | reads | Units and sitemaps | from Registers
17. Pipeline | fetches | Unit pages | from Sources
18. Pipeline | scores | Unit pages
19. Pipeline | sends (planned) | Page text | to Model
20. Pipeline | runs (planned) | Five gates
21. Pipeline | asks (planned) | Review items | of Malin
22. Pipeline | opens (planned) | Data PR | on GitHub

title: Varde 4: the site is rebuilt and deployed
scope: medium-grained, as-is, digitalized
info: Runs on every push to main, daily at 04:00 UTC and on demand. The API only lives inside this job: it starts against Neon, hands its data over as JSON and stops. Nothing user-facing talks to it. Story 1 picks up where Pages serves the site.
actors: GitHub=System, DeployWeb=System, API=System, Neon=System, Pages=System
objects: Deploy run=Info, Web tests=Info, Connection secret=Info, Migrations and seed=Document, Service rows=Document, JSON data=Folder, Static site=Folder
1. GitHub | starts | Deploy run | in DeployWeb
2. DeployWeb | runs | Web tests
3. DeployWeb | passes | Connection secret | to API
4. API | applies | Migrations and seed | to Neon
5. API | reads | Service rows | from Neon
6. DeployWeb | exports | JSON data | from API
7. DeployWeb | prerenders | Static site
8. DeployWeb | uploads | Static site | to Pages

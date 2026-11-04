title: Varde 3: a change passes the gates
scope: medium-grained, as-is, digitalized
info: Every change reaches main through a pull request; the ruleset blocks direct pushes. Three workflows check it, Ward auto-merges safe Dependabot bumps, and a push to main also builds the API image.
actors: Malin=Person, Dependabot=System, GitHub=System, CI=System, Ward=System, BuildTest=System, GHCR=System
objects: Feature branch=Folder, Version bump=Document, Pull request=Document, Check results=Info, Safe bump=Document, API image=Folder
1. Malin | pushes | Feature branch | to GitHub
2. Dependabot | opens | Version bump | on GitHub
3. GitHub | sends | Pull request | to CI
4. GitHub | sends | Pull request | to Ward
5. GitHub | sends | Pull request | to BuildTest
6. CI | reports | Check results | to GitHub
7. Ward | reports | Check results | to GitHub
8. Ward | auto-merges | Safe bump | on GitHub
9. Malin | merges | Pull request | on GitHub
10. BuildTest | pushes | API image | to GHCR

title: Varde 5: the pipeline discovers and fetches a kommune's pages
scope: medium-grained, as-is, digitalized
info: Built in PR 1 and PR 2, run by hand from pipeline/. Only src/net/ touches the network: HTTPS, allow-listed hosts, robots.txt and at least 5 seconds between two requests to one host. Raw pages stay in the gitignored cache and are never printed.
actors: Malin=Person, Pipeline=System, KLASS=System, Brreg=System, KommuneSites=Group, Catalogues=Group, Nav=System
objects: Discover command=Info, Kommune list=Document, Unit records=Document, Robots and sitemaps=Document, Catalogue entries=Document, Office sitemap=Document, Unit list=Folder, Fetch command=Info, Unit pages=Folder, Page manifest=Document, Recall command=Info, Recall report=Document
1. Malin | runs | Discover command | in Pipeline
2. Pipeline | reads | Kommune list | from KLASS
3. Pipeline | reads | Unit records | from Brreg
4. Pipeline | reads | Robots and sitemaps | from KommuneSites
5. Pipeline | reads | Catalogue entries | from Catalogues
6. Pipeline | reads | Office sitemap | from Nav
7. Pipeline | writes | Unit list
8. Malin | runs | Fetch command | in Pipeline
9. Pipeline | fetches | Unit pages | from KommuneSites
10. Pipeline | writes | Page manifest
11. Malin | runs | Recall command | in Pipeline
12. Pipeline | hands | Recall report | to Malin

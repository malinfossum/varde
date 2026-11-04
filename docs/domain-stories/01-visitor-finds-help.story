title: Varde 1: a visitor finds help
scope: coarse-grained, as-is, digitalized
info: Someone needs a social service in their kommune. Every page is prerendered, so the only data the browser fetches is the JSON index, and only once the visitor searches.
actors: Visitor=Person, Browser=System, Pages=System, Service=Group, Malin=Person
objects: Prerendered page=Document, Emergency numbers=Info, Search query=Info, JSON index=Document, Results=Info, Resource page=Document, Phone call=Call, Error report=Email, Quick exit=Info
1. Visitor | asks for | Prerendered page | from Pages
2. Pages | serves | Prerendered page | to Browser
3. Browser | shows | Emergency numbers | to Visitor
4. Visitor | types | Search query | into Browser
5. Browser | loads | JSON index | from Pages
6. Browser | lists | Results | to Visitor
7. Visitor | opens | Resource page | in Browser
8. Visitor | makes | Phone call | to Service
9. Visitor | sends | Error report | to Malin
10. Visitor | presses | Quick exit | in Browser

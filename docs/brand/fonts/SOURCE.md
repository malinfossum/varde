# Bundled fonts

The brand build (`web/scripts/brand.mjs`) renders text with these two static TTFs and nothing
else, so every machine produces the same pixels. resvg cannot read the `.woff2` files the site
ships. Both fonts are under the SIL Open Font License 1.1 (the `*-OFL.txt` files here); the
Varde name and mark are not, see the repo `LICENSE`.

| File | Upstream | Tag (commit) | SHA-256 |
|---|---|---|---|
| `Fraunces-SemiBold.ttf` | `undercasetype/Fraunces`, `fonts/static/ttf/Fraunces9pt-SemiBold.ttf` | `1.000` (`0bf87f6ff449871aade3921b27a9b0a04b33dba4`) | `9600ba534bdf15c2c040ff079be549bb003a0e0416e43f750f5434a319b2a49e` |
| `Figtree-SemiBold.ttf` | `erikdkennedy/figtree`, `fonts/ttf/Figtree-SemiBold.ttf` | `v2.0.3` (`be6cb018f2f93a9b1195f3dfd077123f718c65f8`) | `a63306f13cbf3864b092672073864b71df0bfd0cfc2e873c9e3e3a6b075eb574` |

The Fraunces optical size was picked by measuring text width against the site's
`fraunces-latin-600-normal.woff2` in a browser (canvas `measureText`, 600 weight, 100 px, the
string "Varde Finn riktig hjelp, der du bor."): Site 1658.4, 9pt 1667.0, 72pt 1512.1, 144pt 1335.6.
The 9pt cut is the only close one (+0.52 %); the wordmark "Varde" alone differs by 0.33 %.

The family names the files declare (name ID 16): `Fraunces 9pt` and `Figtree`. resvg matches
text on these, so `FONTS` in `web/scripts/brand-geometry.mjs` uses them verbatim.

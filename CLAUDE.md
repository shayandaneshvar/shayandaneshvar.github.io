# shayandaneshvar.github.io

Personal site for Seyed Shayan (Shay) Daneshvar. This is a GitHub **user Pages** repo,
so GitHub serves the site directly from the root of the `master` branch. The custom
domain is set by the `CNAME` file (`shayandaneshvar.com`).

There are two sites living in one repo:

1. **v1 (legacy static page)** at the repo root. `index.html` is a single-file
   Bootstrap "Plain-Academic" page. This is still what loads at
   `https://shayandaneshvar.com/`. No build step, edit the HTML directly.
2. **v2 (React app)** under `/v2/`. This is the actively developed portfolio and is
   reachable at `https://shayandaneshvar.com/v2/`. Everything below is about v2.

## Layout

```
/                     v1 static site (index.html, images/, files/, favicon/, photo*.jpg)
CNAME                 custom domain (shayandaneshvar.com)
redirect.html         standalone redirect to shayandaneshvar.com
misc/                 misc static page
v2-source/            v2 React source (edit here)
v2/                   v2 BUILD OUTPUT, committed to the repo (do not hand-edit)
.github/workflows/    deploy-v2.yml (CI build for v2)
```

## v2 stack

- Vite 8, React 19, TypeScript, React Router 7, Tailwind CSS v4, Framer Motion.
- Router is `HashRouter` (see `v2-source/src/main.tsx`), and Vite `base` is `/v2/`
  (see `v2-source/vite.config.ts`). So routes are hash based, for example the blog is
  `https://shayandaneshvar.com/v2/#/blog/transformer-visualization`. Hash routing is
  deliberate: it makes deep links work on GitHub Pages with no server side 404 handling.
- Routes are declared in `v2-source/src/App.tsx`. `Nav` is shared across pages, so
  section links use router state to scroll on the home page and to navigate home first
  when on a sub page (see `Nav.tsx` `goToSection` and `HomePage.tsx`).

### Key v2 files

- `v2-source/src/pages/HomePage.tsx` composes the portfolio sections.
- `v2-source/src/pages/BlogTransformerViz.tsx` is the interactive transformer blog.
- `v2-source/src/components/` holds the sections (`Hero`, `About`, `Experience`, etc.)
  and `Nav`, `Footer`.
- `v2-source/src/components/transformer/` holds the visualization widgets.

## Local development (v2)

```bash
cd v2-source
npm install        # first time only
npm run dev        # Vite dev server with hot reload
```

Type check or full build:

```bash
cd v2-source
npx tsc --noEmit   # type check only
npm run build      # tsc -b then vite build, outputs to ../v2 (emptyOutDir wipes v2/ first)
```

The dev server is the fast way to eyeball changes. `npm run build` is only needed to
regenerate the committed `v2/` output.

## How deployment works

GitHub Pages publishes the `master` branch root. There is no separate `gh-pages`
branch. Two things can update the live `/v2/` output:

1. **CI (the normal path).** `.github/workflows/deploy-v2.yml` runs on any push to
   `master` that touches `v2-source/**`. It runs `npm ci` and `npm run build` in
   `v2-source/`, then commits the regenerated `v2/` directory back to `master` with the
   message `chore: build v2` and pushes. After that push, GitHub Pages serves the new
   build within a minute or two.
2. **Manual build.** You can also run `npm run build` locally and commit the `v2/`
   output yourself.

### Important: avoid duplicate builds

Because the CI also builds and pushes a `chore: build v2` commit, doing a **local
build + commit + push at the same time** can collide with the CI commit. The `v2/`
assets have content hashed filenames, so two independent builds produce different
filenames and you get rename/rename conflicts in `v2/assets/` on pull.

Pick one of these to stay clean:

- **Preferred:** change only `v2-source/`, commit, and push. Let CI produce the `v2/`
  build commit. Do not commit `v2/` yourself.
- If you do build and commit `v2/` locally and hit a push rejection, resolve it by
  running `npm run build` once more after pulling (so the committed output matches the
  final source), stage `v2/`, then continue. The conflicts are only in generated files.

## Notes

- v1 (`index.html`) and v2 are independent. Editing one does not affect the other.
- The resume PDF lives at `files/` and is linked from both v1 and v2.

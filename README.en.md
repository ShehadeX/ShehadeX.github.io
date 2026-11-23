# Shehade Xiao · AI Engineering Desk

[简体中文](README.md) · **English**

A bilingual portfolio with nine project pages, a research section and galleries. Use the language control in the website header to switch between Chinese and English.

**[Browse the projects](https://shehadex.github.io/#projects)**

## Local development

The site uses Vue 3, TypeScript, Vite, Tailwind CSS, Vue Router and Mermaid.

```bash
npm ci
npm run dev
npm run build
npm run preview
```

## Updating project pages

- Edit [projects.ts](src/data/projects.ts) and [projects.en.ts](src/data/projects.en.ts) for full case studies.
- Edit [projectBriefs.ts](src/data/projectBriefs.ts) for the shorter bilingual project pages.
- Add new project routes to [postbuild-pages.mjs](scripts/postbuild-pages.mjs) so shared links resolve on GitHub Pages.

## Deployment

The [GitHub Pages workflow](.github/workflows/deploy.yml) builds and deploys pushes to `main`. The build writes to `dist/` and adds static entry pages for direct route links. The [Chinese README](README.md) also documents the self-hosted deployment and image workflow.

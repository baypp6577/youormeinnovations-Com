# You Or Me Innovations

Vue 3 marketing site for **youormeinnovations.com**, based on the approved homepage mockup.

## Stack

- **Vue 3** + TypeScript + Vite
- **Tailwind CSS v4** — custom brand UI (preferred over Material for this creative/PR site)
- **D3** — hero network animation + showcase micro-visualizations
- **Vue Router** — hash/section navigation

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Vercel test site

Connect this repo in [Vercel](https://vercel.com) (Import → `youormeinnovations-Com`). Default production URL:

**https://youormeinnovations-com.vercel.app**

`vercel.json` is included for Vite static output. After the first deploy, YouOrMe clients see **Open test site** on the hometolive.net client portal (`clientId=youorme`).

Optional: set `NEXT_PUBLIC_YOUORME_PREVIEW_URL` on hometolive.net Vercel if the URL differs.

## Design notes

- Layout: header → hero → pillars → workflow → showcase → footer
- Hero CTAs: **Start your project** (contact form) + **Explore our services**
- Hybrid messaging: public brand (PR/community) + automated client journey
- Reference mockup: `7fe60d11-4313-4286-8782-c76a1634248a.jpeg`

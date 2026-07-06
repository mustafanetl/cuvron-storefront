# CUVRON Storefront (Hydrogen + Vercel)

Production storefront for CUVRON comfywear (hoodies, tees, pajamas), built with Shopify Hydrogen and deployed on Vercel.

## Stack

- Shopify Hydrogen + React Router
- Shopify Storefront API
- Vercel Node runtime wrapper (`api/index.mjs`)
- Brand visual assets in `public/brand`

## Required environment variables

Copy `.env.example` to `.env` for local development, then set:

- `SESSION_SECRET`
- `PUBLIC_STORE_DOMAIN`
- `PUBLIC_CHECKOUT_DOMAIN`
- `PUBLIC_STOREFRONT_API_TOKEN`

If storefront env vars are missing, the app falls back to `mock.shop` so the site can still render for development previews.

## Local development

```bash
npm install
npm run dev
```

## Build commands

```bash
# Standard Hydrogen build (Oxygen-style)
npm run build

# Vercel production build path
npm run build:vercel
```

## Vercel deployment

This project expects:

- `framework: "node"` in `vercel.json`
- `main: "api/index.mjs"` in `package.json`
- build command: `npm run build:vercel`

Set Vercel env vars:

```bash
vercel env add SESSION_SECRET production
vercel env add PUBLIC_STORE_DOMAIN production
vercel env add PUBLIC_CHECKOUT_DOMAIN production
vercel env add PUBLIC_STOREFRONT_API_TOKEN production
```

Deploy:

```bash
vercel --prod
```

## Shopify production wiring checklist

1. In Shopify Admin, create/retrieve a Storefront API public access token.
2. Set `PUBLIC_STORE_DOMAIN`, `PUBLIC_CHECKOUT_DOMAIN`, and `PUBLIC_STOREFRONT_API_TOKEN` in Vercel.
3. Redeploy and verify:
   - product pages load from your real catalog
   - add-to-cart works
   - checkout redirects to your Shopify checkout domain

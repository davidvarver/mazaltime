# MAZAL TIME

Next.js app for premium watch raffles, backed by Prisma and PostgreSQL.

## Production Setup

This project expects PostgreSQL in production. Do not use the old local SQLite
`prisma/dev.db` URL on Vercel.

Set these Vercel environment variables before deploying:

- `DATABASE_URL`: PostgreSQL connection string, for example Neon.
- `NEXTAUTH_SECRET`: long random secret.
- `NEXTAUTH_URL`: `https://mazaltime.vercel.app`.
- `NEXT_PUBLIC_APP_URL`: `https://mazaltime.vercel.app`.
- `STRIPE_SECRET_KEY`: optional until real payments are enabled.
- `STRIPE_WEBHOOK_SECRET`: optional until real payments are enabled.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: optional until real payments are enabled.

The build command runs:

```bash
prisma migrate deploy && prisma generate && next build
```

After the first successful deploy to a fresh database, seed the database once:

```bash
npx prisma db seed
```

The seed is idempotent for the initial active raffle, so rerunning it will not
create duplicate active raffles.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

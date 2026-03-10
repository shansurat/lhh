This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Map rendering does not require env vars, but Firebase Authentication does.

Create `.env` in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Also enable Firebase Auth providers in Firebase Console:

- Email/Password

## Roles and user management

Roles are stored in Firestore under `profiles/{uid}` with one of these values:

- `admin`
- `superadmin`

Behavior:

- On successful sign-in, a missing role doc is auto-created as `admin`.
- Only `superadmin` can access `/admin/users` and create new auth accounts.

Bootstrap first superadmin:

1. Sign in once with the account to create its `admin` role doc.
2. In Firestore console, open `profiles/{uid}` for that account.
3. Change `role` from `admin` to `superadmin`.

To enable deleting Firebase Auth users from `/admin/users`, deploy functions:

```bash
firebase deploy --only functions
```

## Firebase Hosting Deployment

This project is configured for static Firebase Hosting (`next.config.ts` uses `output: "export"`, and `firebase.json` serves `out/`).

Deploy steps:

```bash
npm install
firebase login
firebase use iskolibmap
firebase deploy --only hosting
```

Notes:

- `firebase deploy` runs `npm run build` automatically via `hosting.predeploy`.
- If deploying through GitHub Actions, add the same `NEXT_PUBLIC_FIREBASE_*` values to repository secrets and pass them into the build step.

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

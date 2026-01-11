# Clip Jolt

AI-powered video content creation platform.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.local.example` to `.env.local` and configure your environment variables:

```bash
cp .env.local.example .env.local
```

Required variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- Clerk authentication keys
- OpenAI API key

### Database

Test your database connection:
```bash
npm run db:test
```

Run migrations:
```bash
npm run db:migrate
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run db:test` - Test database connection
- `npm run db:migrate` - Run database migrations

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Clerk Authentication
- Drizzle ORM
- Neon PostgreSQL
- OpenAI

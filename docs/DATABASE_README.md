# Database Setup

Clip-Jolt uses **PostgreSQL** via [Drizzle ORM](https://orm.drizzle.team/) for data persistence.

## Quick Start

### Development (Local)

By default, the app uses **PGlite** (in-memory PostgreSQL) for local development. No setup required!

```bash
npm run dev
```

### Production (Neon)

For production deployment, we use **Neon** - a serverless PostgreSQL database optimized for Vercel.

**Setup in 3 steps:**

1. **Create Neon database** at https://neon.tech
2. **Add connection string** to `.env.local`:
   ```bash
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
   ```
3. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

**That's it!** Your app now uses persistent storage.

## Available Commands

```bash
# Test database connection
npm run db:test

# Generate new migration (after schema changes)
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

## Documentation

- **[Complete Neon Setup Guide](./NEON_SETUP.md)** - Step-by-step instructions
- **[Testing Checklist](./TESTING_CHECKLIST.md)** - Verify everything works
- **[Neon vs Supabase Analysis](../neon-vs-supabase-analysis.md)** - Why we chose Neon

## Database Schema

Current tables:

### `organization`
Stores organization/team data and Stripe subscription info.

```typescript
{
  id: string (primary key)
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripeSubscriptionStatus: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### `todo`
Example table for task management.

```typescript
{
  id: serial (primary key)
  ownerId: string (Clerk user ID)
  title: string
  message: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Schema location:** `src/models/Schema.ts`

## Making Schema Changes

1. **Edit schema** in `src/models/Schema.ts`
2. **Generate migration**:
   ```bash
   npm run db:generate
   ```
3. **Review migration** in `/migrations` folder
4. **Apply migration**:
   ```bash
   npm run db:migrate
   ```

Migrations are automatically applied on Vercel deployment.

## Health Check

Test your database connection:

**Local:**
```bash
curl http://localhost:3000/api/health/database
```

**Production:**
```bash
curl https://your-app.vercel.app/api/health/database
```

Expected response:
```json
{
  "status": "healthy",
  "database": "neon",
  "connection": {
    "database": "neondb",
    "responseTime": "45ms"
  }
}
```

## Troubleshooting

### "DATABASE_URL not found"
- Create `.env.local` and add your Neon connection string
- Copy from `.env.local.example` as a template

### "Connection timeout"
- Check your connection string is correct
- Verify `?sslmode=require` is included
- Ensure Neon project is not suspended

### "Tables don't exist"
- Run `npm run db:migrate` to create tables
- Check migration files in `/migrations`

### "Too many connections"
- Neon handles connection pooling automatically
- Check for connection leaks in your code
- Ensure you're using Drizzle ORM (not raw clients)

## Support

- **Neon Docs:** https://neon.tech/docs
- **Drizzle Docs:** https://orm.drizzle.team
- **Health Endpoint:** `/api/health/database`

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Vercel)      │
└────────┬────────┘
         │
         │ DATABASE_URL
         │
┌────────▼────────┐
│  Drizzle ORM    │
│  (Type-safe)    │
└────────┬────────┘
         │
         │
┌────────▼────────┐      ┌──────────────┐
│  Development    │      │  Production  │
│  PGlite         │      │  Neon        │
│  (In-memory)    │      │  (Cloud)     │
└─────────────────┘      └──────────────┘
```

**Key benefits:**
- ✅ Same code works for dev and production
- ✅ Type-safe queries with Drizzle
- ✅ Automatic migrations
- ✅ No vendor lock-in (standard PostgreSQL)

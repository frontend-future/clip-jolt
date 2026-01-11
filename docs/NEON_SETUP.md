# Neon Database Setup Guide

This guide walks you through setting up Neon as your production PostgreSQL database for Clip-Jolt.

## Why Neon?

- ✅ **Serverless PostgreSQL** optimized for Vercel
- ✅ **Zero code changes** - works with existing Drizzle setup
- ✅ **Generous free tier** - 512MB storage, autoscaling
- ✅ **Perfect for Clerk** - no auth conflicts
- ✅ **Auto-suspend** - saves costs during inactivity

## Quick Start (5 minutes)

### 1. Create Neon Account

1. Go to https://neon.tech
2. Sign up (GitHub signup is fastest)
3. Click **"Create a project"**

### 2. Configure Your Database

1. **Project name**: `clip-jolt-db` (or your preference)
2. **Region**: Choose closest to your Vercel deployment
   - US East (Ohio) - `us-east-2`
   - US West (Oregon) - `us-west-2`
   - Europe (Frankfurt) - `eu-central-1`
3. **PostgreSQL version**: 16 (default)
4. Click **"Create project"**

### 3. Get Connection String

After creation, you'll see your connection string:

```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Copy this entire string!**

### 4. Add to Local Development

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your connection string:

```bash
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 5. Test Connection

```bash
npm run db:test
```

You should see:
```
✅ Connected successfully!
✅ Database Info: PostgreSQL 16.x
✅ SSL is enabled
🎉 All database tests passed!
```

### 6. Run Migrations

```bash
npm run db:migrate
```

This creates your tables (`organization`, `todo`) in Neon.

### 7. Verify Schema

```bash
npm run db:test
```

Now you should see:
```
✅ Tables found:
   - organization
   - todo
✅ CRUD operations successful
```

## Vercel Deployment

### 1. Add Environment Variable

In your Vercel project:

1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Neon connection string
   - **Environments**: Production, Preview, Development (select all)
3. Click **Save**

### 2. Deploy

```bash
git push origin main
```

Vercel will automatically:
- Pick up the `DATABASE_URL`
- Run migrations on first deployment
- Connect to Neon database

### 3. Verify Deployment

Visit your deployed app:

```
https://your-app.vercel.app/api/health/database
```

You should see:
```json
{
  "status": "healthy",
  "message": "Database connection successful",
  "database": "neon",
  "connection": {
    "database": "neondb",
    "responseTime": "45ms"
  }
}
```

## Database Management

### Viewing Data

**Option 1: Neon Dashboard**
1. Go to https://console.neon.tech
2. Select your project
3. Click **"SQL Editor"**
4. Run queries to view data

**Option 2: Drizzle Studio**
```bash
npm run db:studio
```
Opens a visual database browser at http://localhost:4983

### Creating Backups

Neon automatically backs up your database. To create a manual backup:

1. In Neon dashboard, go to **"Branches"**
2. Click **"Create branch"**
3. Name it (e.g., `backup-2024-01-10`)
4. Your data is now safely branched

### Monitoring Usage

In Neon dashboard:
- **Storage**: Check how much of your 512MB you're using
- **Compute**: See active connections and queries
- **Branches**: Manage dev/staging/production branches

## Troubleshooting

### Connection Timeout

**Problem**: `connect ETIMEDOUT`

**Solution**:
1. Check your connection string is correct
2. Verify SSL mode: `?sslmode=require`
3. Check Neon project is not suspended (free tier suspends after inactivity)

### SSL Certificate Error

**Problem**: `self signed certificate`

**Solution**: Ensure your connection string includes `?sslmode=require`

### Migrations Not Running

**Problem**: Tables don't exist after deployment

**Solution**:
1. Check Vercel logs for migration errors
2. Manually run: `npm run db:migrate`
3. Verify `DATABASE_URL` is set in Vercel

### Connection Pool Exhausted

**Problem**: `too many clients`

**Solution**: Neon handles connection pooling automatically. If you see this:
1. Check for connection leaks in your code
2. Ensure you're using the Drizzle ORM (handles pooling)
3. Contact Neon support if persistent

## Cost Optimization

### Free Tier Limits
- **Storage**: 512 MB
- **Compute**: Autoscaling (free)
- **Projects**: 1
- **Branches**: Unlimited

### Staying Within Free Tier

**Your current schema:**
- `organization` table: ~1-5 KB per record
- `todo` table: ~1-5 KB per record

**Capacity estimates:**
- ~100,000 organizations
- ~100,000 todos
- **You'll likely never hit the limit!**

### Auto-Suspend

Neon automatically suspends your database after inactivity:
- **Suspend after**: 5 minutes of no connections
- **Resume time**: < 500ms on next query
- **Cost**: $0 while suspended

This is perfect for development and low-traffic periods.

## Advanced Features

### Database Branching

Create instant copies of your database:

```bash
# In Neon dashboard
1. Go to "Branches"
2. Click "Create branch"
3. Choose parent branch (main)
4. Name it (e.g., "staging")
```

Use cases:
- Test migrations before production
- Create staging environment
- Experiment with schema changes

### Point-in-Time Recovery

Restore your database to any point in the past 7 days:

1. In Neon dashboard, go to **"Restore"**
2. Select date/time
3. Click **"Restore"**

### Read Replicas (Paid Plans)

Scale read operations with replicas:
- Available on Scale plan ($69/month)
- Automatic load balancing
- Near-zero replication lag

## Migration from PGlite

Your app currently uses **PGlite** (in-memory database) for development. When you add `DATABASE_URL`:

**What happens:**
1. App detects `DATABASE_URL` is set
2. Switches from PGlite to PostgreSQL (Neon)
3. Runs migrations automatically
4. All data now persists across restarts

**What doesn't change:**
- Your Drizzle schema
- Your API code
- Your queries
- Your ORM usage

**Zero code changes needed!**

## Security Best Practices

### 1. Rotate Connection Strings

If your connection string is exposed:
1. Go to Neon dashboard
2. **Settings** → **Reset password**
3. Update `DATABASE_URL` everywhere

### 2. Use Environment Variables

**Never** commit connection strings to Git:
- ✅ Use `.env.local` (gitignored)
- ✅ Use Vercel environment variables
- ❌ Don't hardcode in source files

### 3. Least Privilege Access

For production:
1. Create a separate database user
2. Grant only necessary permissions
3. Use different credentials for dev/prod

## Support

### Neon Support
- Docs: https://neon.tech/docs
- Discord: https://discord.gg/neon
- Email: support@neon.tech

### Clip-Jolt Issues
- Check `/api/health/database` endpoint
- Review Vercel deployment logs
- Run `npm run db:test` locally

## Next Steps

Once Neon is set up:

1. ✅ **Deploy to Vercel** with `DATABASE_URL`
2. ✅ **Test health endpoint** - `/api/health/database`
3. ✅ **Create your first user** via Clerk
4. ✅ **Generate your first reel** and verify data persists
5. ✅ **Monitor usage** in Neon dashboard

**You're all set! 🚀**

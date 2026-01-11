# Neon Database Testing Checklist

Use this checklist to verify your Neon database integration is working correctly.

## Pre-Deployment Testing (Local)

### ✅ Step 1: Environment Setup
- [ ] Created Neon account at https://neon.tech
- [ ] Created new project in Neon dashboard
- [ ] Copied connection string
- [ ] Created `.env.local` file
- [ ] Added `DATABASE_URL` to `.env.local`
- [ ] Verified `.env.local` is in `.gitignore`

### ✅ Step 2: Connection Test
Run: `npm run db:test`

Expected output:
- [ ] ✅ Connected successfully
- [ ] ✅ Database Info shows PostgreSQL 16.x
- [ ] ✅ SSL is enabled
- [ ] ✅ Database name matches Neon project

### ✅ Step 3: Run Migrations
Run: `npm run db:migrate`

Expected output:
- [ ] Migrations applied successfully
- [ ] No errors in console

### ✅ Step 4: Verify Schema
Run: `npm run db:test` again

Expected output:
- [ ] ✅ Tables found: organization, todo
- [ ] ✅ CREATE: Inserted todo
- [ ] ✅ READ: Retrieved todo
- [ ] ✅ UPDATE: Updated todo
- [ ] ✅ DELETE: Removed test todo
- [ ] 🎉 All database tests passed

### ✅ Step 5: Start Dev Server
Run: `npm run dev`

Expected:
- [ ] Server starts without errors
- [ ] No database connection errors in console
- [ ] Can access http://localhost:3000

### ✅ Step 6: Test Health Endpoint
Visit: http://localhost:3000/api/health/database

Expected response:
```json
{
  "status": "healthy",
  "database": "neon",
  "connection": {
    "database": "neondb",
    "responseTime": "< 100ms"
  },
  "schema": {
    "tables": ["organization", "todo"],
    "tableCount": 2
  }
}
```

- [ ] Status is "healthy"
- [ ] Database is "neon"
- [ ] Tables array includes "organization" and "todo"
- [ ] Response time is reasonable (< 200ms)

### ✅ Step 7: Test with Clerk Auth
1. Sign up or sign in via Clerk
2. Navigate to dashboard
3. Create a todo item

Expected:
- [ ] Todo is created successfully
- [ ] Todo appears in the list
- [ ] Todo persists after page refresh

### ✅ Step 8: Verify in Neon Dashboard
1. Go to https://console.neon.tech
2. Select your project
3. Open SQL Editor
4. Run: `SELECT * FROM todo;`

Expected:
- [ ] See the todo you just created
- [ ] Data matches what's in the app
- [ ] `owner_id` matches your Clerk user ID

---

## Vercel Deployment Testing

### ✅ Step 1: Add Environment Variable
In Vercel dashboard:
- [ ] Go to Settings → Environment Variables
- [ ] Add `DATABASE_URL` with Neon connection string
- [ ] Select all environments (Production, Preview, Development)
- [ ] Click Save

### ✅ Step 2: Deploy
Run: `git push origin main`

- [ ] Vercel deployment starts
- [ ] Build completes successfully
- [ ] No database errors in build logs

### ✅ Step 3: Check Deployment Logs
In Vercel dashboard:
- [ ] Go to Deployments → Latest deployment
- [ ] Click "View Function Logs"
- [ ] Look for migration messages
- [ ] No connection errors

### ✅ Step 4: Test Production Health Endpoint
Visit: `https://your-app.vercel.app/api/health/database`

Expected:
- [ ] Status is "healthy"
- [ ] Database is "neon"
- [ ] Response time is reasonable (< 500ms)
- [ ] Tables are listed correctly

### ✅ Step 5: Test Production App
1. Visit your Vercel URL
2. Sign in with Clerk
3. Create a todo item

Expected:
- [ ] Can sign in successfully
- [ ] Can create todo
- [ ] Todo persists after refresh
- [ ] Todo appears in Neon dashboard

### ✅ Step 6: Test Across Deployments
1. Make a small code change
2. Push to trigger new deployment
3. Visit app after deployment

Expected:
- [ ] Previous todos still exist
- [ ] Can create new todos
- [ ] Data persists across deployments

---

## Performance Testing

### ✅ Response Times
Check `/api/health/database` endpoint:
- [ ] Local: < 100ms
- [ ] Vercel (same region): < 200ms
- [ ] Vercel (different region): < 500ms

### ✅ Cold Start
1. Wait 10 minutes (Neon auto-suspends after 5 min)
2. Visit app
3. First request may be slower

Expected:
- [ ] First request: < 1 second
- [ ] Subsequent requests: < 200ms
- [ ] No errors during cold start

### ✅ Concurrent Connections
1. Open app in multiple tabs
2. Create todos in each tab simultaneously

Expected:
- [ ] All requests succeed
- [ ] No connection pool errors
- [ ] Data is consistent across tabs

---

## Edge Cases

### ✅ Database Unavailable
Temporarily set wrong `DATABASE_URL`:
- [ ] App shows appropriate error
- [ ] Health endpoint returns 503
- [ ] Error message is clear

### ✅ Missing Environment Variable
Remove `DATABASE_URL` from Vercel:
- [ ] App falls back to PGlite
- [ ] Health endpoint shows "not_configured"
- [ ] No crashes or errors

### ✅ Migration Failure
Try running migrations twice:
- [ ] Second run is idempotent
- [ ] No duplicate table errors
- [ ] Schema remains consistent

---

## Monitoring

### ✅ Neon Dashboard
Check in https://console.neon.tech:
- [ ] Storage usage is displayed
- [ ] Active connections are shown
- [ ] Query history is available
- [ ] No error alerts

### ✅ Vercel Logs
Check in Vercel dashboard:
- [ ] No database connection errors
- [ ] Migration logs are clean
- [ ] Query times are reasonable

---

## Rollback Test

### ✅ Verify Rollback Works
1. Remove `DATABASE_URL` from Vercel
2. Redeploy
3. Visit app

Expected:
- [ ] App works (using PGlite)
- [ ] Health endpoint shows "not_configured"
- [ ] No errors or crashes
- [ ] Can add `DATABASE_URL` back and redeploy

---

## Final Verification

### ✅ Complete End-to-End Flow
1. User signs up via Clerk
2. User creates a reel
3. Reel metadata is stored in database
4. User can view their reels
5. Data persists across sessions

Expected:
- [ ] All steps work smoothly
- [ ] Data is stored in Neon
- [ ] Can verify data in Neon dashboard
- [ ] Performance is acceptable

---

## Troubleshooting

If any test fails, check:

1. **Connection String**
   - [ ] Copied correctly (no spaces or line breaks)
   - [ ] Includes `?sslmode=require`
   - [ ] Username and password are correct

2. **Environment Variables**
   - [ ] `DATABASE_URL` is set in `.env.local`
   - [ ] `DATABASE_URL` is set in Vercel
   - [ ] No typos in variable name

3. **Migrations**
   - [ ] Ran `npm run db:migrate`
   - [ ] No errors in migration output
   - [ ] Tables exist in Neon dashboard

4. **Network**
   - [ ] Can access Neon dashboard
   - [ ] No firewall blocking connections
   - [ ] SSL/TLS is working

5. **Neon Project**
   - [ ] Project is not suspended
   - [ ] Region is correct
   - [ ] Free tier limits not exceeded

---

## Success Criteria

All tests pass when:
- ✅ Local development connects to Neon
- ✅ Migrations run successfully
- ✅ CRUD operations work
- ✅ Health endpoint returns healthy status
- ✅ Vercel deployment connects to Neon
- ✅ Data persists across deployments
- ✅ Performance is acceptable
- ✅ No errors in logs

**If all checkboxes are checked, your Neon integration is complete! 🎉**

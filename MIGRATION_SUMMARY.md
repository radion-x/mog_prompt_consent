# Migration Summary: Cloudflare D1 → SQLite for Coolify

## Date: November 10, 2025

## Changes Made

### 1. **Removed Cloudflare Dependencies**
- ❌ Removed `wrangler` from main dependencies
- ❌ Removed Cloudflare D1 bindings
- ❌ Removed Cloudflare Workers specific imports

### 2. **Added SQLite Support**
- ✅ Installed `better-sqlite3` for local SQLite database
- ✅ Installed `@hono/node-server` for Node.js deployment
- ✅ Created `src/db.ts` - SQLite database adapter
- ✅ Database auto-initializes on first run

### 3. **Updated Git Repository**
- ✅ Changed remote from: `git@github.com:markbingemann-stack/MOG-prom-consent.git`
- ✅ To new remote: `git@github.com:radion-x/mog_prompt_consent.git`

### 4. **Created Coolify Deployment Files**
- ✅ `Dockerfile` - Multi-stage build for production
- ✅ `.dockerignore` - Optimized build context
- ✅ `COOLIFY_DEPLOYMENT.md` - Complete deployment guide

### 5. **Updated Project Configuration**
- ✅ `package.json` - New scripts for Node.js
  - `npm run dev` - Development with hot reload
  - `npm run build` - TypeScript compilation
  - `npm run start` - Production server
- ✅ `tsconfig.json` - Node.js compatible configuration
- ✅ `src/server.ts` - Node.js server entry point

### 6. **Database Changes**
- **Location:** `./data/database.sqlite` (local file)
- **Backups:** File-based, easy to backup
- **Persistence:** Requires volume mount in Coolify
- **Migration:** Automatic schema creation on startup

## File Structure

```
mog-prom-consent/
├── src/
│   ├── index.tsx          # Main Hono app (updated for SQLite)
│   ├── server.ts          # NEW: Node.js server entry point
│   ├── db.ts              # NEW: SQLite database adapter
│   └── types.ts           # Updated types (removed Cloudflare bindings)
├── data/
│   ├── .gitignore         # Ignore database files
│   ├── .gitkeep          # Keep directory in git
│   └── database.sqlite    # SQLite database file (auto-created)
├── public/                # Static files (unchanged)
├── migrations/            # SQL migrations (reference only)
├── Dockerfile             # NEW: Docker configuration for Coolify
├── .dockerignore          # NEW: Docker build exclusions
├── COOLIFY_DEPLOYMENT.md  # NEW: Deployment instructions
├── package.json           # Updated for Node.js
├── tsconfig.json          # Updated for Node.js
└── README.md              # Updated documentation

```

## API Endpoints (Unchanged)

All API endpoints remain the same:
- `POST /api/sessions/create`
- `GET /api/sessions/:token`
- `POST /api/questionnaires/*`
- `GET /api/admin/*`
- And all others...

## Environment Variables

### Required in Coolify:
```bash
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/database.sqlite
```

## Key Differences

| Feature | Before (Cloudflare D1) | After (SQLite) |
|---------|----------------------|----------------|
| Database | Cloudflare D1 (cloud) | SQLite (file) |
| Deployment | Cloudflare Pages | Coolify/Docker |
| Hosting | Serverless (edge) | Container-based |
| Scaling | Global edge | Single instance |
| Backups | Cloudflare managed | Manual file backups |
| Cost | Pay per request | Fixed hosting cost |

## Testing

### Local Development:
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

### Production Build:
```bash
npm run build
npm start
```

### Docker Build:
```bash
docker build -t mog-consent .
docker run -p 3000:3000 -v $(pwd)/data:/app/data mog-consent
```

## Coolify Deployment Steps

1. **Create New Application in Coolify**
   - Repository: `https://github.com/radion-x/mog_prompt_consent.git`
   - Branch: `main`
   - Build Pack: Dockerfile

2. **Add Persistent Volume**
   - Mount Path: `/app/data`
   - This is CRITICAL for database persistence

3. **Set Environment Variables**
   - `NODE_ENV=production`
   - `PORT=3000`
   - `DATABASE_PATH=/app/data/database.sqlite`

4. **Deploy**
   - Click Deploy
   - Monitor logs
   - Verify database initialization

## Important Notes

### ⚠️ Limitations
- **Single Instance Only:** SQLite doesn't support multiple concurrent writers
- **File-Based:** Database is a single file - ensure backups
- **No Built-in Replication:** Manual backup strategy needed

### ✅ Advantages
- **Simple Setup:** No external database service needed
- **Cost Effective:** One less service to pay for
- **Easy Backups:** Just copy the .sqlite file
- **Fast:** Local file access is very fast
- **Perfect for:** Small to medium traffic applications

### 🔄 Migration Path to PostgreSQL (Future)
If you need to scale later:
1. Export SQLite data
2. Set up PostgreSQL in Coolify
3. Import data to PostgreSQL
4. Update connection string
5. Remove SQLite adapter

## Verification Checklist

After deployment, verify:
- [ ] Application loads at your domain
- [ ] Can create new patient session
- [ ] Can complete questionnaires
- [ ] Admin dashboard accessible
- [ ] Database file exists in `/app/data/`
- [ ] Data persists after container restart
- [ ] Logs show successful startup

## Support

For issues:
1. Check Coolify application logs
2. Verify persistent volume is mounted
3. Check database file permissions
4. Ensure only 1 replica is running
5. Review `COOLIFY_DEPLOYMENT.md` for troubleshooting

## Next Steps

1. ✅ Commit all changes
2. ✅ Push to new repository
3. ⏳ Deploy to Coolify
4. ⏳ Set up backup automation
5. ⏳ Configure custom domain
6. ⏳ Test end-to-end workflow

## Commands to Push Changes

```bash
# Add all changes
git add .

# Commit
git commit -m "Migrate from Cloudflare D1 to SQLite for Coolify deployment"

# Push to new repository
git push -u origin main
```

---

**Status:** ✅ Migration Complete - Ready for Coolify Deployment

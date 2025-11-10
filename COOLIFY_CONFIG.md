# Coolify Configuration Guide

Based on your Coolify configuration screen, here's what you need to set:

## ✅ Configuration Settings

### General Tab
- **Name:** `mog-prompt-consent` (or your preferred name)
- **Repository URL:** `git@github.com:radion-x/mog_prompt_consent.git`
- **Branch:** `main`
- **Build Pack:** `dockerfile` ✅ (already selected in your screenshot)

### Build Settings
- **Dockerfile Location:** `/Dockerfile` (default, already set)
- **Docker Context:** `/` (default)
- **Build Command:** Leave empty (Docker will handle it)

### Environment Variables
You need to add these under the "Environment" tab:

```bash
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/database.sqlite
```

### 🔴 CRITICAL: Persistent Storage (Volumes)

**This is the most important step!**

Go to the "Storages" section in your application configuration and add:

1. Click "Add Storage" or "Add Volume"
2. Configure:
   - **Name:** `sqlite-database` (or any name)
   - **Source Path:** Let Coolify manage it (automatic)
   - **Destination Path:** `/app/data`
   - **Type:** Persistent volume
   
This ensures your SQLite database persists across deployments and restarts.

### Network Configuration
- **Port Mapping:** 
  - Container Port: `3000`
  - Public: Let Coolify handle (usually 80/443)

### Health Check
The Dockerfile includes a health check, but you can also set it in Coolify:
- **Health Check URL:** `/`
- **Health Check Port:** `3000`

## 🚀 Deployment Steps

1. **Configure Environment Variables** (see above)
2. **Add Persistent Volume** for `/app/data` (CRITICAL!)
3. **Save Configuration**
4. **Click "Deploy"**
5. **Monitor Logs** for successful startup

## 📋 What to Look For in Logs

When deploying, you should see:
```
🚀 Server starting on http://localhost:3000
📁 Database location: /app/data/database.sqlite
Initializing database tables...
Database initialized successfully
```

## ✅ Post-Deployment Verification

Once deployed, test these URLs:

1. **Home Page:** `https://your-domain.com`
2. **Admin Dashboard:** `https://your-domain.com/admin`
3. **API Health:** `https://your-domain.com/api/init-db`

## 🔧 Troubleshooting

### If deployment fails:

1. **Check Build Logs** - Look for npm install or build errors
2. **Verify Dockerfile** - Make sure it's committed to your repo
3. **Check Node Version** - Dockerfile uses Node 20

### If app starts but data doesn't persist:

1. **Verify Volume is Mounted** - Check in Coolify console: `ls -la /app/data`
2. **Check Permissions** - Database directory should be writable
3. **Only Run 1 Replica** - SQLite doesn't support multiple writers

### If you get connection errors:

1. **Check Port Mapping** - Container should expose port 3000
2. **Verify Environment Variables** - Especially `PORT` and `DATABASE_PATH`
3. **Check Health Check** - May need to adjust timing

## 📦 Current Configuration Status

From your screenshot, I can see:
- ✅ Build Pack is set to Dockerfile
- ✅ Repository seems configured
- ⚠️ Need to add Environment Variables
- ⚠️ Need to add Persistent Volume for `/app/data`

## 🎯 Next Actions

1. Go to **"Environment"** tab → Add the 3 environment variables
2. Go to **"Storages"** tab → Add volume for `/app/data`
3. **Save** all configuration
4. Click **"Deploy"** button
5. Watch the deployment logs

## 📝 Notes

- The Dockerfile has been optimized with multi-stage build
- Better-sqlite3 native module will compile during build
- Database auto-initializes on first run
- Single replica only (SQLite limitation)

---

**Ready to deploy!** Just add the environment variables and persistent volume, then click Deploy.

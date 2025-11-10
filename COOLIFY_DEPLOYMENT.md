# Coolify Deployment Guide

## Overview
This application now uses a local SQLite database file instead of Cloudflare D1, making it perfect for deployment on Coolify.

## Prerequisites
- Coolify instance set up
- GitHub repository connected: `git@github.com:radion-x/mog_prompt_consent.git`

## Deployment Steps

### 1. Create New Application in Coolify

1. Log into your Coolify dashboard
2. Click "New Resource" → "Application"
3. Select "Public Repository"
4. Enter repository URL: `https://github.com/radion-x/mog_prompt_consent.git`
5. Select branch: `main`

### 2. Configure Build Settings

**Build Pack:** Dockerfile

The Dockerfile is already configured in the repository.

### 3. Configure Environment Variables

Add the following environment variables in Coolify:

```
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/database.sqlite
```

### 4. Configure Persistent Storage

**CRITICAL:** You MUST add a persistent volume for the SQLite database:

1. Go to "Storage" tab in your application
2. Click "Add Volume"
3. Configure:
   - **Name:** `mog-database`
   - **Mount Path:** `/app/data`
   - **Description:** SQLite database storage

This ensures your database persists across container restarts and deployments.

### 5. Configure Port Mapping

- **Container Port:** 3000
- **Public Port:** 80 or 443 (handled by Coolify)

### 6. Deploy

Click "Deploy" button and monitor the logs.

## Post-Deployment

### Verify Database Initialization

The database will be automatically initialized on first startup. Check the logs for:

```
Initializing database tables...
Database initialized successfully
🚀 Server starting on http://localhost:3000
```

### Access the Application

- **Patient Portal:** `https://your-domain.com`
- **Admin Dashboard:** `https://your-domain.com/admin`

### Health Check

Test the application is running:

```bash
curl https://your-domain.com/api/init-db
```

Should return:
```json
{"success":true,"message":"Database initialized successfully"}
```

## Database Backups

Since SQLite is file-based, you can back up your database by:

1. **Via Coolify Console:**
   ```bash
   cp /app/data/database.sqlite /app/data/database.backup-$(date +%Y%m%d).sqlite
   ```

2. **Download from Coolify:**
   - Go to your application → File Manager
   - Navigate to `/app/data/`
   - Download `database.sqlite`

3. **Automated Backups:**
   Consider setting up a cron job in Coolify to automatically backup the database file.

## Scaling Considerations

**Important:** SQLite works best with single-instance deployments. If you need to scale:

1. Keep replicas to 1 in Coolify
2. For high-traffic scenarios, consider migrating to PostgreSQL later
3. Current setup is perfect for small to medium traffic (hundreds of concurrent users)

## Troubleshooting

### Database Permission Errors

If you see permission errors, ensure the `/app/data` directory is writable:

```bash
# In Coolify console
ls -la /app/data
# Should show: drwxr-xr-x node node
```

### Database Locked Errors

This usually means multiple instances are trying to access the same database file. Ensure you're running only 1 replica.

### Data Not Persisting

Verify your persistent volume is correctly mounted:

```bash
# In Coolify console
df -h | grep /app/data
mount | grep /app/data
```

## Local Development

To run locally after cloning:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

The database will be created automatically at `./data/database.sqlite`.

## Production Configuration

### Recommended Coolify Settings

- **Replicas:** 1 (SQLite limitation)
- **Memory Limit:** 512MB - 1GB
- **CPU Limit:** 0.5 - 1 vCPU
- **Health Check:** `/api/init-db` endpoint
- **Restart Policy:** Always

### Resource Usage

Expected resource usage:
- **Memory:** ~100-200MB under normal load
- **CPU:** Low (Node.js + SQLite is lightweight)
- **Disk:** Database file will grow with data (~1MB per 100 patients typically)

## Monitoring

Monitor your application health:

```bash
# Check application logs
# In Coolify: Logs tab

# Check database size
ls -lh /app/data/database.sqlite

# Check number of records
sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM patients;"
```

## Migration from Development

If you have existing data in development:

1. Export your local database:
   ```bash
   cp data/database.sqlite data/database-backup.sqlite
   ```

2. Upload to production via Coolify File Manager

3. Place in `/app/data/database.sqlite`

4. Restart application

## Support

For issues:
- Check Coolify logs first
- Verify persistent volume is mounted
- Ensure only 1 replica is running
- Check file permissions in `/app/data`

## Next Steps After Deployment

1. ✅ Verify application loads
2. ✅ Test patient registration
3. ✅ Check admin dashboard
4. ✅ Set up database backups
5. ✅ Configure custom domain in Coolify
6. ✅ Set up SSL certificate (automatic in Coolify)
7. ✅ Monitor logs for errors

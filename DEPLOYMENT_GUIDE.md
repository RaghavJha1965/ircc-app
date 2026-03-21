# IRCC Immigration Tracker — Deployment Guide

Follow these steps in order on your local machine (Terminal).

---

## Step 1: Create GitHub Repo & Push Code

```bash
cd /Users/raghavjha/Desktop/ircc-app

# Stage all files
git add -A

# Commit
git commit -m "feat: IRCC Express Entry tracker with Telegram notifications

- Dashboard with draw history and CRS calculator
- Telegram & email notifications for new draws
- Hourly cron monitoring via IRCC scraper
- Document checklist and settings UI
- Turso (LibSQL) database support for production"

# Create GitHub repo (private) and push
gh repo create ircc-tracker --private --source=. --remote=origin --push
```

If you prefer a **public** repo, change `--private` to `--public`.

---

## Step 2: Set Up Turso Database (Free Tier)

### Install Turso CLI
```bash
# macOS
brew install tursodatabase/tap/turso

# Or universal install
curl -sSfL https://get.tur.so/install.sh | bash
```

### Create database
```bash
# Sign up / log in
turso auth signup
# (or: turso auth login)

# Create database
turso db create ircc-tracker

# Get your database URL (copy this!)
turso db show ircc-tracker --url

# Create auth token (copy this!)
turso db tokens create ircc-tracker
```

### Push your schema to Turso
```bash
# Set the Turso URL and token in your local .env
# Create a .env file:
echo 'DATABASE_URL="libsql://ircc-tracker-YOUR_USERNAME.turso.io"' > .env
echo 'TURSO_AUTH_TOKEN="your-token-here"' >> .env

# Push the Prisma schema to Turso
npx prisma db push
```

---

## Step 3: Deploy to Vercel

```bash
cd /Users/raghavjha/Desktop/ircc-app

# Install Vercel CLI if not installed
npm i -g vercel

# Deploy (follow the prompts)
vercel

# When asked:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: ircc-tracker
# - Directory: ./
# - Override settings? No
```

### Add Environment Variables in Vercel Dashboard

Go to https://vercel.com → your project → Settings → Environment Variables.

Add these:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `libsql://ircc-tracker-YOUR_USERNAME.turso.io` |
| `TURSO_AUTH_TOKEN` | (your Turso token) |
| `CRON_SECRET` | (generate with: `openssl rand -hex 32`) |
| `RESEND_API_KEY` | (from https://resend.com if you want email) |
| `NOTIFICATION_EMAIL` | `raghavnjhaa@gmail.com` |

### Redeploy with env vars
```bash
vercel --prod
```

Your app should now be live at `https://ircc-tracker.vercel.app` (or similar).

---

## Step 4: Set Up Telegram Bot

### 4a. Create the bot

1. Open Telegram and search for **@BotFather**
2. Send: `/newbot`
3. When asked for a name, type: `IRCC Express Entry Tracker`
4. When asked for a username, type: `ircc_ee_tracker_bot` (must end in `bot`, must be unique — add numbers if taken, e.g. `ircc_ee_tracker_12345_bot`)
5. BotFather will reply with your **bot token** like: `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxx`
6. **Copy the token** — you'll need it

### 4b. Get your Chat ID

1. Open Telegram and search for **@userinfobot**
2. Send it any message (e.g., `/start`)
3. It will reply with your **user ID** — this is your Chat ID (a number like `123456789`)
4. **Copy this number**

### 4c. IMPORTANT: Start your bot

1. Go back to Telegram and search for the bot username you just created
2. Click **Start** (or send `/start`)
3. This is required — the bot can't message you until you start it!

### 4d. Configure in your app

1. Open your deployed app URL (e.g., `https://ircc-tracker.vercel.app/settings`)
2. Enter the **Bot Token** and **Chat ID** in the Telegram section
3. Toggle **Enable Telegram notifications** ON
4. Click **Save Settings**
5. Click **Test** to verify you receive a message

---

## Step 5: Set Up Hourly Cron (cron-job.org)

Since Vercel free tier only allows 1 cron/day, we'll use cron-job.org for free hourly checks.

1. Go to https://cron-job.org and create a free account
2. Click **Create cronjob**
3. Fill in:
   - **Title:** IRCC Monitor
   - **URL:** `https://YOUR-APP.vercel.app/api/cron/monitor`
   - **Schedule:** Every 1 hour (or use custom: `0 * * * *`)
   - **Request method:** GET
   - **Headers:** Add a header:
     - **Name:** `Authorization`
     - **Value:** `Bearer YOUR_CRON_SECRET` (the same CRON_SECRET you set in Vercel)
4. Click **Create**

---

## Step 6: Test Everything

### Test the cron endpoint manually
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://YOUR-APP.vercel.app/api/cron/monitor
```

You should get a JSON response like:
```json
{
  "message": "Monitoring complete",
  "newDraws": 5,
  "draws": [...]
}
```

### Verify Telegram notification
- The first time the cron runs, it will find all existing draws as "new" and send notifications
- Check your Telegram for messages from your bot

### Verify the dashboard
- Visit your app URL and check that draws appear on the dashboard

---

## Troubleshooting

**Build fails on Vercel?**
- Make sure all env vars are set in Vercel dashboard
- Check Vercel build logs

**Telegram not sending?**
- Make sure you clicked "Start" on your bot in Telegram
- Verify the bot token and chat ID are correct in Settings
- Check that "Enable Telegram" is toggled ON

**Database errors?**
- Run `npx prisma db push` with your Turso credentials in `.env`
- Make sure `DATABASE_URL` starts with `libsql://`

**Cron not running?**
- Check cron-job.org execution logs
- Verify the Authorization header matches your CRON_SECRET

# Tileance - B2B Tile & Ceramic Network

This is the complete, production-ready source code for **Tileance**, a social platform for the B2B tile, ceramic, and manufacturing industry.

---

## 🚀 How to Deploy on Vercel (Vercel deployment guide)

1. **Push Code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Tileance app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/tileance.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import your GitHub repository (`tileance`).
   - Vercel will automatically detect `vercel.json` and Vite framework settings.
   - Click **Deploy**.

3. **Set Environment Keys on Vercel**:
   - In your Vercel Project Settings -> **Environment Variables**, add:
     - `GEMINI_API_KEY`: Your Gemini AI API Key
     - `APP_PRIVATE_KEY`: Your private secret key
     - `PERSONAL_ADMIN_KEY`: Your personal key
   - Save and redeploy.

---

## 🔑 Managing Private & Personal Keys

You do **NOT** need to edit the core application code when changing keys.
- **Option A**: Update variables in `keys.config.json` file.
- **Option B**: Update `.env` file locally or Environment Variables on Vercel.

---

## 🔄 Updating App in Future (App Update Guide)

Whenever the admin adds new features or updates the code:
1. Commit and push the changes to GitHub:
   ```bash
   git add .
   git commit -m "Update: Added new features"
   git push origin main
   ```
2. Vercel will automatically trigger a new deployment from `main` branch!
3. All users will instantly receive the live update automatically.
# Vyapar Bridge B2B Network

Last Deployment Sync: 2026-08-17 - Admin Barcode Upload Fix & Mobile Header Optimization.

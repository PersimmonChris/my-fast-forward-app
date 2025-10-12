# Time Capsule – Setup & Operations Guide

Welcome! Follow these steps in order. No coding experience is required.

---

## 1. Install the tools once
- Install **Node.js 20+** (https://nodejs.org). During installation, accept all defaults.
- Open **Terminal** (macOS) or **Command Prompt** (Windows).
- In the terminal, change into this project folder (replace the path if needed):
  ```bash
  cd /Users/yourfirstaiapp/Desktop/my-fast-forward-app
  ```
- Install project dependencies (this also refreshes `package-lock.json`):
  ```bash
  npm install
  ```

---

## 2. Create your environment file
1. In the project folder, make a new file named `.env.local`.
2. Copy the contents of `.env.example` into `.env.local`.
3. Fill in each value:
   - `NEXT_PUBLIC_SUPABASE_URL`: found in the Supabase dashboard under Project Settings → API.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: also in Project Settings → API.
   - `SUPABASE_SERVICE_ROLE`: service role key from Supabase (keep this secret).
   - `GEMINI_API_KEY`: create one in Google AI Studio (https://ai.google.dev/).
   - `GEMINI_MODEL`: for example `gemini-2.0-flash-exp`, or whichever model you plan to use.

> Keep `.env.local` private—never commit or share it.

---

## 3. Prepare Supabase

### 3.1 Create the tables
1. Sign in to Supabase and open your project.
2. Go to **SQL Editor**.
3. Create a new query, paste everything from `Supabase.sql`, and run it once.
4. You should see two tables created: `generation_runs` and `generation_outputs`.

### 3.2 Storage bucket
1. In the Supabase dashboard, open **Storage** → **Buckets**.
2. Create a new bucket named **`time-capsule`**.
3. Set the bucket to **public** so the app can display generated images.

### 3.3 Realtime note
- No extra configuration is required; the app polls the API for updates.

---

## 4. Start the development server
- Make sure you are still in the project folder, then run:
  ```bash
  npm run dev
  ```
- Open http://localhost:3000 in your browser.
- Upload a portrait, click **Generate**, and you will be redirected to the results page.

---

## 5. How to monitor and debug
- The terminal running `npm run dev` prints detailed logs that always start with `[time-capsule]`.
- When the app shows an error with an `errorId`, search for that `errorId` in the terminal output to see the exact failure.
- If Gemini or Supabase reject a request, the logs and the UI will point to the failing decade and error code.

---

## 6. Deployment checklist
1. Commit your changes (`git commit`) and push to your Git provider.
2. On your hosting platform (e.g. Vercel):
   - Set the same environment variables as in `.env.local`.
   - Ensure the Supabase service role key is configured as a **server-side secret** only.
3. Redeploy the project.
4. After deploy, test one full generation to confirm images save and display correctly.

---

## 7. Routine maintenance
- Rotate the Gemini and Supabase keys periodically.
- Monitor Supabase storage usage; older runs can be deleted from the dashboard if needed.
- Keep dependencies current by occasionally running:
  ```bash
  npm outdated
  npm update
  ```

That’s it! Reach out with any error message (include the `errorId`) and you’ll get pointed guidance on the next fix. Happy time traveling! 🚀


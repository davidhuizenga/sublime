# The Anonymous Room — beginner setup

This is a small static website with a Supabase database. It supports a public feed and immediate anonymous submissions. It is a starter, not a fully hardened anonymous platform.

## Files

- `index.html` — homepage, submission form, public feed
- `style.css` — dark minimalist design
- `script.js` — loads and publishes posts
- `config.js` — your public Supabase project URL/key and Telegram group link
- `rules.html` — community rules
- `supabase.sql` — database table and public access policies

## Part 1 — Set up the database

1. Go to https://supabase.com/ and create an account/project.
2. In the Supabase dashboard, open **SQL Editor** and create a new query.
3. Open `supabase.sql` from this folder, copy all its contents into the SQL editor, and click **Run**.
4. In Supabase project settings, find the **Project URL** and the **anon/public key** (the exact label may vary).
5. Open `config.js` in a text editor. Replace the two `PASTE_YOUR_...` placeholders with your Project URL and anon/public key.
6. Do **not** use a `service_role` or secret key in browser code. The public/anon key is intended to be exposed, and the SQL policies control what it can do.

## Part 2 — Add the Telegram link

1. Open Telegram Desktop or mobile and create a group named **The Anonymous Room**.
2. Open the group's settings and set it to **Public** if you want a public username/link. Choose an available username.
3. Copy the public `t.me/...` link.
4. In `config.js`, change `telegramUrl: "https://t.me/"` to your group link.
5. In Telegram privacy settings, review who can see your phone number. A group is not completely anonymous: members can see display names/usernames, and admins may have extra information. Tell members not to share identifying details.

## Part 3 — Test it locally

The site can be opened by double-clicking `index.html`. If your browser blocks requests when opened as a local file, run a tiny local server instead:

1. Install Python 3 if needed.
2. Open a terminal in this folder.
3. Run `python3 -m http.server 8000`
4. Open `http://localhost:8000` in your browser.

Try submitting a test post. If it fails, check the browser developer console and confirm the URL, key, SQL, and table permissions.

## Part 4 — Publish with GitHub Pages (free static hosting)

1. Create/sign in to a GitHub account at https://github.com/.
2. Create a **public repository** named `the-anonymous-room`.
3. Upload `index.html`, `style.css`, `script.js`, `config.js`, and `rules.html`. (You can also upload README.md and supabase.sql; do not upload private credentials. The anon/public key is public by design.)
4. In the repository, open **Settings → Pages**.
5. Under the build/deployment source, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
6. Wait for GitHub Pages to publish. The site URL will be shown in Settings → Pages.
7. Open the public URL on your phone and computer and test both reading and submitting.

## Important privacy and safety limits

- This version does not ask for a name or account, but that does **not** guarantee anonymity. Hosting providers and network services may log IP addresses, and browser/device details can sometimes identify people.
- Posts are public and may be copied or screenshotted. Avoid collecting identifying details.
- Immediate public posting invites spam and abuse. This starter has no rate limiting, CAPTCHA, report button, admin deletion dashboard, or automatic moderation. Before promoting it widely, add those protections or change to moderated submissions.
- The SQL policy permits anyone to read and insert posts. It does not allow public edits/deletes. You will need to use the Supabase dashboard to remove harmful posts, or build a secure admin-only moderation tool.
- Never put a Supabase service-role key or other secret in frontend files.
- Check current platform terms, privacy requirements, and applicable law before launching publicly.

## Troubleshooting

- **Feed won't load:** check the Project URL and anon/public key in `config.js`; confirm the SQL ran successfully.
- **Posts won't publish:** confirm the `posts` table and policies exist; open browser developer tools for the exact error.
- **GitHub Pages shows a 404:** confirm `index.html` is in the repository root and Pages is configured for `main` and `/ (root)`.
- **Telegram button opens the wrong page:** replace `telegramUrl` in `config.js` with your actual `https://t.me/yourgroup` link.

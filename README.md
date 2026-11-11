# Yodep Attendance System

A digital attendance system for Yodep. Staff clock in and out from any device, apply for leave, and report absences. HR and IT admins see live dashboards, run reports, and manage users.

## Stack

- React + Vite
- Firebase (Auth + Firestore)
- Tailwind CSS
- Recharts
- Netlify (hosting)

## Local setup

```bash
npm install
cp .env.example .env   # then fill in your Firebase values
npm run dev            # opens at http://localhost:5173
```

## Deploying to Netlify

1. Push this repo to GitHub
2. In Netlify: Add new site → Import from GitHub → select this repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add all `VITE_FIREBASE_*` environment variables from your `.env`
6. Deploy

## First-time setup

After deploying, create the first HR admin account:

1. Go to Firebase Console → Authentication → Add user manually
2. Then in Firestore → `users` collection → add a document with the user's UID as the document ID:
   ```json
   {
     "name": "Your Name",
     "email": "your@email.com",
     "department": "HR",
     "role": "hr",
     "active": true
   }
   ```
3. That admin can then add all other staff through the app's Manage Users page.

## Firestore security rules

Deploy the included `firestore.rules` file via the Firebase Console → Firestore → Rules tab (paste contents).

## Roles

| Role | Description |
|------|-------------|
| `employee` | Clock in/out, apply leave, view own records |
| `hr` | All employee capabilities + approve leave, manage users, view all reports & analytics |
| `it` | All employee capabilities + manage users, view all reports & analytics |

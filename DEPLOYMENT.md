# Deployment Guide

This guide will help you deploy the Next.js Scheduler App to Vercel.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Push your code to GitHub
3. **PostgreSQL Database** - Set up a cloud database (recommended: Supabase, Neon, or PlanetScale)
4. **Google Cloud Console** - Configure OAuth2 and Calendar API

## Step 1: Database Setup

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings → Database
3. Copy the connection string (it looks like: `postgresql://postgres:[password]@[host]:5432/postgres`)
4. Use this as your `DATABASE_URL`

### Option B: Neon

1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string from the dashboard
3. Use this as your `DATABASE_URL`

### Option C: PlanetScale

1. Go to [planetscale.com](https://planetscale.com) and create a new database
2. Get the connection string from the dashboard
3. Use this as your `DATABASE_URL`

## Step 2: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API" and enable it
4. Create OAuth2 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `https://your-app-name.vercel.app/api/auth/callback/google`
5. Create API Key (optional, for additional Google services):
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Restrict the key to Google Calendar API

## Step 3: Deploy to Vercel

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository and click "Import"

2. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

3. **Set Environment Variables**:
   In the Vercel dashboard, go to your project → Settings → Environment Variables and add each variable individually:

   **Step-by-step**:
   1. Click "Add New" for each variable
   2. Enter the exact name and value (see below)
   3. Select all environments (Production, Preview, Development)
   4. Click "Save"

   **Variables to add**:
   - `DATABASE_URL` = `postgresql://username:password@host:port/database`
   - `NEXTAUTH_URL` = `https://your-app-name.vercel.app` (your actual Vercel URL)
   - `NEXTAUTH_SECRET` = `WAkruFg4AaxEVB+Po/5BHn+IEba+ZY2UgTF5mtJYumc=` (or generate your own)
   - `GOOGLE_CLIENT_ID` = `your-google-client-id`
   - `GOOGLE_CLIENT_SECRET` = `your-google-client-secret`
   - `GOOGLE_CALENDAR_API_KEY` = `your-google-api-key` (optional)

   **CRITICAL**: 
   - ❌ **DO NOT** use @ symbols in values
   - ❌ **DO NOT** use secret references
   - ✅ **DO** enter the actual values directly
   - ✅ **DO** set for all environments (Production, Preview, Development)

4. **Deploy**:
   - Click "Deploy"
   - Wait for the deployment to complete
   - Your app will be available at `https://your-app-name.vercel.app`

## Step 4: Database Migration

After deployment, you need to run the database migrations:

1. **Option A: Using Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel login
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

2. **Option B: Using Vercel Functions**:
   Create a temporary API route to run migrations:
   ```typescript
   // src/app/api/migrate/route.ts
   import { prisma } from '@/lib/prisma'
   
   export async function POST() {
     try {
       await prisma.$executeRaw`SELECT 1`
       return Response.json({ success: true })
     } catch (error) {
       return Response.json({ error: 'Migration failed' }, { status: 500 })
     }
   }
   ```

## Step 5: Update Google OAuth Settings

1. Go back to Google Cloud Console
2. Update your OAuth2 client settings:
   - Add your production domain to authorized redirect URIs
   - Update authorized JavaScript origins
3. Save the changes

## Step 6: Test Your Deployment

1. Visit your deployed app
2. Try signing in with Google
3. Test the role selection
4. Test booking an appointment (if you have sellers)
5. Check that calendar integration works

## Troubleshooting

### Common Issues

1. **NEXTAUTH_URL Error**:
   - **Error**: "Environment Variable 'NEXTAUTH_URL' references Secret 'nextauth_url', which does not exist"
   - **Solution**: In Vercel dashboard, go to Settings → Environment Variables
   - Set `NEXTAUTH_URL` to your actual Vercel app URL (e.g., `https://your-app-name.vercel.app`)
   - Do NOT use @ symbols or secret references
   - Make sure it's set for all environments (Production, Preview, Development)

2. **Database Connection Error**:
   - Verify your `DATABASE_URL` is correct
   - Check if your database allows connections from Vercel's IPs
   - Ensure SSL is enabled if required

3. **Google OAuth Error**:
   - Verify redirect URIs match exactly
   - Check that Google Calendar API is enabled
   - Ensure client ID and secret are correct

4. **Build Errors**:
   - Check that all environment variables are set
   - Verify TypeScript compilation
   - Check for missing dependencies

5. **Runtime Errors**:
   - Check Vercel function logs
   - Verify API routes are working
   - Test database queries

### Environment Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Your Vercel app URL
- [ ] `NEXTAUTH_SECRET` - Random secret key (32+ characters)
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] `GOOGLE_CALENDAR_API_KEY` - From Google Cloud Console (optional)

### Performance Optimization

1. **Database Connection Pooling**:
   - Use connection pooling for better performance
   - Consider using Prisma Accelerate for production

2. **Caching**:
   - Implement Redis for session caching
   - Use Vercel's edge caching for static content

3. **Monitoring**:
   - Set up Vercel Analytics
   - Monitor database performance
   - Track API usage

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files
   - Use Vercel's environment variable encryption
   - Rotate secrets regularly

2. **Database Security**:
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access by IP

3. **Google OAuth**:
   - Use HTTPS in production
   - Validate redirect URIs
   - Monitor OAuth usage

## Support

If you encounter issues:

1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review the [NextAuth.js Documentation](https://next-auth.js.org)
3. Check the [Prisma Documentation](https://www.prisma.io/docs)
4. Open an issue in the GitHub repository


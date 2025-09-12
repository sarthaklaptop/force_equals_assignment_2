# Vercel Environment Variables Setup

## Step-by-Step Instructions

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Navigate to Environment Variables**:
   - Go to Settings → Environment Variables

3. **Add Each Variable** (click "Add New" for each one):

   ### Required Variables:
   
   **NEXTAUTH_URL**
   - Name: `NEXTAUTH_URL`
   - Value: `https://your-app-name.vercel.app` (replace with your actual Vercel URL)
   - Environment: Production, Preview, Development (select all)

   **NEXTAUTH_SECRET**
   - Name: `NEXTAUTH_SECRET`
   - Value: Generate a random 32+ character string (you can use: `openssl rand -base64 32`)
   - Environment: Production, Preview, Development (select all)

   **DATABASE_URL**
   - Name: `DATABASE_URL`
   - Value: Your PostgreSQL connection string
   - Environment: Production, Preview, Development (select all)

   **GOOGLE_CLIENT_ID**
   - Name: `GOOGLE_CLIENT_ID`
   - Value: From Google Cloud Console
   - Environment: Production, Preview, Development (select all)

   **GOOGLE_CLIENT_SECRET**
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: From Google Cloud Console
   - Environment: Production, Preview, Development (select all)

   **GOOGLE_CALENDAR_API_KEY** (Optional)
   - Name: `GOOGLE_CALENDAR_API_KEY`
   - Value: From Google Cloud Console
   - Environment: Production, Preview, Development (select all)

## Important Notes:
- ❌ **DO NOT** use @ symbols in the values
- ❌ **DO NOT** use secret references
- ✅ **DO** use the actual values directly
- ✅ **DO** set for all environments (Production, Preview, Development)

## After Setting Variables:
1. Save all variables
2. Go to Deployments tab
3. Click "Redeploy" on your latest deployment
4. The error should be resolved!

# Vercel Deployment Setup Guide

This guide will help you set up automated deployment to Vercel using GitHub Actions.

## Prerequisites

- GitHub repository with this project
- Vercel account ([sign up at vercel.com](https://vercel.com))
- Supabase project configured
- Gemini API key (for receipt analysis features)

## Step-by-Step Setup

### 1. Link Your Project to Vercel

First, you need to link your local project to Vercel to get the required credentials.

```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Link your project to Vercel
vercel link
```

Follow the prompts:
- Select your Vercel account/team
- Choose to link to an existing project or create a new one
- Confirm the project settings

This creates a `.vercel/project.json` file containing your `projectId` and `orgId`.

### 2. Get Your Vercel Token

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a descriptive name (e.g., "GitHub Actions Deploy")
4. Set the scope to your account/team
5. Copy the token (you won't be able to see it again!)

### 3. Configure GitHub Secrets

Navigate to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets one by one:

#### Vercel Credentials

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel authentication token | Created in step 2 |
| `VERCEL_ORG_ID` | Your Vercel organization ID | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | `.vercel/project.json` → `projectId` |

#### Application Environment Variables

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) → Project URL |
| `SUPABASE_KEY` | Supabase anonymous/public key | [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) → anon/public key |
| `GEMINI_API_KEY` | Gemini API key | [Google AI Studio](https://aistudio.google.com/app/apikey) |

### 4. Verify the Workflow File

The workflow file is already created at [.github/workflows/vercel-deploy.yml](.github/workflows/vercel-deploy.yml).

It will automatically:
- Trigger on every push to the `master` branch
- Install dependencies
- Build your Astro project with the Vercel adapter
- Deploy to Vercel production

### 5. Test the Deployment

#### Option A: Push to Master

Simply push a commit to the `master` branch:

```bash
git add .
git commit -m "feat: test Vercel deployment"
git push origin master
```

#### Option B: Manual Workflow Trigger

1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Deploy to Vercel" workflow
4. Click "Run workflow"
5. Select the `master` branch
6. Click "Run workflow"

### 6. Monitor Deployment

1. **GitHub Actions**: Go to the "Actions" tab in your repository to see the workflow running
2. **Vercel Dashboard**: Go to [vercel.com/dashboard](https://vercel.com/dashboard) to see the deployment status

## Vercel Environment Variables (Alternative)

Instead of passing environment variables during the build step in GitHub Actions, you can also configure them directly in Vercel:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `GEMINI_API_KEY`
4. Make sure to select "Production" environment

**Note**: If you configure environment variables in Vercel, the workflow will still work because `vercel pull` downloads these variables during the build process.

## Troubleshooting

### Build Fails

**Issue**: Build fails with "Missing environment variables"

**Solution**: Ensure all required secrets are added to GitHub repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GEMINI_API_KEY`

### Deployment Fails

**Issue**: Deployment fails with "Invalid token"

**Solution**:
1. Regenerate your Vercel token at [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Update the `VERCEL_TOKEN` secret in GitHub

### Wrong Project Deployed

**Issue**: Deployment goes to the wrong Vercel project

**Solution**:
1. Check that `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` match your `.vercel/project.json`
2. Run `vercel link` again to ensure correct project linkage

### Runtime Errors in Production

**Issue**: App works locally but fails in production

**Solution**:
1. Check Vercel deployment logs in the Vercel Dashboard
2. Verify all environment variables are correctly set
3. Test the production build locally:
   ```bash
   npm run build
   npm run preview
   ```

## Manual Deployment (Alternative)

If you prefer to deploy manually without GitHub Actions:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Astro Vercel Adapter](https://docs.astro.build/en/guides/integrations-guide/vercel/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)

## Security Best Practices

1. **Never commit** `.env` files or `.vercel/project.json` to Git
2. **Rotate secrets regularly**, especially if they're exposed
3. **Use separate** Supabase projects for development and production
4. **Enable RLS** (Row Level Security) on all Supabase tables
5. **Use service role keys** only in secure server environments (never in client code)

## Need Help?

If you encounter issues:
1. Check the GitHub Actions workflow logs
2. Check Vercel deployment logs
3. Verify all secrets are correctly configured
4. Ensure your `.gitignore` includes `.env` and `.vercel/`

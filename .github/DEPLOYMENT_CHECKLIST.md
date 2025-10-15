# Vercel Deployment Checklist

Use this checklist to ensure your Vercel deployment is properly configured.

## Initial Setup

- [ ] Vercel account created
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Project linked to Vercel (`vercel link`)
- [ ] `.vercel/project.json` file exists locally
- [ ] Vercel token created at [vercel.com/account/tokens](https://vercel.com/account/tokens)

## GitHub Secrets Configuration

Navigate to: **GitHub Repository → Settings → Secrets and variables → Actions**

### Vercel Credentials

- [ ] `VERCEL_TOKEN` - Vercel authentication token
- [ ] `VERCEL_ORG_ID` - Organization ID from `.vercel/project.json`
- [ ] `VERCEL_PROJECT_ID` - Project ID from `.vercel/project.json`

### Environment Variables

- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_KEY` - Supabase anonymous/public key
- [ ] `GEMINI_API_KEY` - Gemini API key (for AI receipt analysis)

## Verification Steps

- [ ] Workflow file exists at [.github/workflows/vercel-deploy.yml](.github/workflows/vercel-deploy.yml)
- [ ] `.gitignore` includes `.env` and `.vercel/`
- [ ] All secrets are added to GitHub (6 total)
- [ ] Push to `master` branch triggers workflow
- [ ] GitHub Actions workflow completes successfully
- [ ] Deployment appears in Vercel Dashboard
- [ ] Production site loads correctly
- [ ] Environment variables work in production

## Post-Deployment

- [ ] Test all features in production environment
- [ ] Verify Supabase connection works
- [ ] Verify Gemini API integration works for receipt analysis
- [ ] Check for any console errors in browser
- [ ] Test authentication flow
- [ ] Verify database operations work correctly

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `.vercel/` directory is in `.gitignore`
- [ ] No secrets committed to Git repository
- [ ] Supabase RLS (Row Level Security) enabled on all tables
- [ ] Production uses separate Supabase project from development (recommended)
- [ ] Vercel token has appropriate scope (not overly permissive)

## Common Issues

If deployment fails, check:

- [ ] All 6 secrets are correctly added to GitHub
- [ ] Secret names match exactly (case-sensitive)
- [ ] No trailing spaces in secret values
- [ ] Vercel token is valid and not expired
- [ ] Project IDs match `.vercel/project.json`
- [ ] Supabase URL and key are from the correct project
- [ ] Gemini API key is valid and enabled

## Resources

- [Full Setup Guide](../DEPLOYMENT.md)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions](https://github.com/features/actions)
- [Supabase Dashboard](https://app.supabase.com)

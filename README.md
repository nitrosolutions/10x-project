# PortfelIO

[![Deploy to Vercel](https://github.com/nitrosolutions/10x-project/actions/workflows/vercel-deploy.yml/badge.svg)](https://github.com/nitrosolutions/10x-project/actions/workflows/vercel-deploy.yml)

> AI-powered household expense tracking through automatic receipt scanning

**🚀 Live App**: [https://10x-project.vercel.app](https://10x-project.vercel.app)

PortfelIO is a Progressive Web App (PWA) that revolutionizes expense tracking by automatically analyzing Polish fiscal receipts using AI. Simply scan a receipt with your phone's camera, and let Google Gemini extract and categorize all items instantly—eliminating the tedious manual data entry.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Project Scope](#-project-scope)
- [Project Status](#-project-status)
- [License](#-license)

## ✨ Features

### Core Functionality

- **🤖 AI-Powered Receipt Analysis**: Automatic extraction of items, prices, dates, and store names from Polish fiscal receipts using Google Gemini
- **📸 Multiple Input Methods**:
  - Scan receipts with camera
  - Upload from gallery
  - Manual entry
- **📊 Visual Analytics**: Monthly expense breakdown with interactive donut charts by category
- **✏️ Full Edit Capabilities**: Modify all recognized data (dates, store names, items, categories, prices)
- **📱 Progressive Web App**: Install on mobile/desktop for app-like experience
- **🔐 Secure Authentication**: Email/password authentication via Supabase Auth

### Expense Categories

9 predefined categories with emoji icons:

- 🛒 Food & Beverages
- 🚗 Transport
- 💊 Health & Beauty
- 🏠 Home & Garden
- 👕 Clothing & Footwear
- 🎬 Entertainment & Culture
- 📱 Electronics & Appliances
- 💼 Services & Fees
- ❓ Other

## 🛠 Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** (v5.14.1) - Modern web framework with static site generation
- **[React 19](https://react.dev/)** (v19.1.1) - UI library for interactive components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** (v4.1.13) - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible component library built on Radix UI

### Backend & Services

- **[Supabase](https://supabase.com/)** - PostgreSQL database + Authentication
- **[Google Gemini API](https://ai.google.dev/)** - Gemini for receipt analysis

### DevOps & Hosting

- **[Vercel](https://vercel.com/)** - Serverless deployment platform
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipelines:
  - **Pull Request Checks** ([pull-request.yml](.github/workflows/pull-request.yml)) - Automated PR validation with linting, unit tests, and e2e tests with coverage reports
  - **Master Branch Validation** ([master.yml](.github/workflows/master.yml)) - Post-merge testing and production build verification
  - **Vercel Deployment** ([vercel-deploy.yml](.github/workflows/vercel-deploy.yml)) - Automatic production deployment on master branch push

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v22.20.0 (use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- **npm**: v10+ (comes with Node.js)
- **Supabase Account**: [Sign up here](https://supabase.com/)
- **Gemini API Key**: [Get your API key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd 10x-project
   ```

2. **Use the correct Node version**

   ```bash
   nvm use
   # or manually: nvm install 22.20.0 && nvm use 22.20.0
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Configure the following variables in `.env`:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_KEY` - Your Supabase anonymous key
   - `GEMINI_API_KEY` - Your Gemini API key

5. **Run database migrations**

   ```bash
   # Using Supabase CLI
   npx supabase db push
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start development server (port 3000) |
| `npm run build`    | Build for production                 |
| `npm run preview`  | Preview production build locally     |
| `npm run lint`     | Run ESLint for code quality checks   |
| `npm run lint:fix` | Automatically fix ESLint issues      |
| `npm run format`   | Format code with Prettier            |

### Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically lint and format code before commits.

## 🚀 Deployment & CI/CD

This project uses GitHub Actions for continuous integration and deployment with three automated workflows:

### CI/CD Workflows

1. **Pull Request Checks** ([.github/workflows/pull-request.yml](.github/workflows/pull-request.yml))
   - Triggers on PRs to `master` branch
   - Runs in parallel: linting, unit tests (with coverage), e2e tests (with coverage)
   - Uploads coverage artifacts (retained for 7 days)
   - Posts success comment on PR with check results

2. **Master Branch Validation** ([.github/workflows/master.yml](.github/workflows/master.yml))
   - Triggers on push to `master` branch
   - Runs unit tests and e2e tests in parallel
   - Builds production bundle after tests pass
   - Ensures master branch always has a working build

3. **Vercel Deployment** ([.github/workflows/vercel-deploy.yml](.github/workflows/vercel-deploy.yml))
   - Triggers on push to `master` branch
   - Deploys to Vercel production environment
   - Can be manually triggered via `workflow_dispatch`

### Setting Up Vercel Deployment

1. **Create a Vercel account** at [vercel.com](https://vercel.com/)

2. **Install Vercel CLI** (optional, for local testing)

   ```bash
   npm install -g vercel
   ```

3. **Get your Vercel credentials**

   Run locally to link your project:

   ```bash
   vercel link
   ```

   This creates a `.vercel/project.json` file containing:
   - `projectId` - Your Vercel project ID
   - `orgId` - Your Vercel organization ID

   Get your Vercel token from: [vercel.com/account/tokens](https://vercel.com/account/tokens)

4. **Configure GitHub Secrets**

   Add the following secrets to your GitHub repository at `Settings > Secrets and variables > Actions`:

   **Required Vercel Secrets:**
   - `VERCEL_TOKEN` - Your Vercel authentication token
   - `VERCEL_ORG_ID` - Your Vercel organization ID
   - `VERCEL_PROJECT_ID` - Your Vercel project ID

   **Required Environment Variables:**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_KEY` - Your Supabase anonymous/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for e2e tests)
   - `GEMINI_API_KEY` - Your Gemini API key (for AI receipt analysis)

   **Required E2E Test Credentials:**
   - `E2E_USERNAME_ID` - Test user ID for e2e tests
   - `E2E_USERNAME` - Test user email for e2e tests
   - `E2E_PASSWORD` - Test user password for e2e tests

5. **Trigger Deployment**

   The GitHub Actions workflow ([.github/workflows/vercel-deploy.yml](.github/workflows/vercel-deploy.yml)) will automatically:
   - Deploy to production on every push to `master` branch
   - Build the project with environment variables
   - Run the Vercel deployment

### Manual Deployment

You can also deploy manually using the Vercel CLI:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Configuration

The project uses `@astrojs/vercel` adapter configured in [astro.config.mjs](astro.config.mjs):

```javascript
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel({}),
  // ... other config
});
```

## 🎯 Project Scope

### ✅ Included in MVP

**User Authentication**

- Email/password registration and login
- Password validation (min 8 chars, uppercase, lowercase, digit, special char)
- Session management via Astro.cookies
- Account deletion

**Receipt Management**

- AI-powered receipt scanning using Google Gemini (Polish fiscal receipts only)
- Three input methods: camera, gallery upload, manual entry
- Support for JPEG/PNG images (max 10MB)
- Full CRUD operations on receipts and items
- Automatic category assignment by AI
- Manual category override

**Data Visualization**

- Monthly expense view with donut chart
- Breakdown by 9 predefined categories
- Receipt list sorted by date (newest first)
- Month-to-month navigation

**Progressive Web App**

- Install on iOS/Android/Desktop
- Standalone app experience
- Responsive design (mobile-first)
- App icons and splash screen

### ❌ Not Included in MVP

**Budget Features**

- Spending limits per category
- Budget alerts and notifications
- Savings goals
- Month-to-month comparisons
- Expense forecasting

**Advanced Categories**

- Custom user-defined categories
- Category editing/deletion
- Subcategories

**Social & Sharing**

- Multi-user accounts (family mode)
- Expense report sharing
- Receipt comments/notes

**Advanced Analytics**

- Trend charts (line, bar)
- Period comparisons
- CSV/PDF export
- Detailed reports and insights

**Advanced Features**

- Receipt image storage after analysis
- Warranty tracking
- Offline mode with sync
- Push notifications
- Multi-language support (Polish only in MVP)
- Multi-currency support (PLN only in MVP)
- Bank account integration

For a complete list of future enhancements, see the [PRD](.ai/prd.md#4-granice-produktu).

## 📊 Project Status

**Current Phase**: MVP Development 🚧

### Success Metrics (KPIs)

- **Scan Adoption Rate**: Target 80% of receipts added via scanning (vs. manual entry)
- **User Engagement**: Target 60% of users adding ≥4 receipts per month

### Supported Platforms

- ✅ Polish fiscal receipts only
- ✅ JPEG/PNG images (max 10MB)
- ✅ Modern browsers with ES6+ support
- ✅ Requires internet connection (no offline mode in MVP)

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) for details.

You are free to:
- ✅ Use this software for personal or commercial projects
- ✅ Modify and distribute the code
- ✅ Sublicense the software
- ⚠️ Must include the original copyright notice and license

**No warranty provided** - use at your own risk.

---

**Built with ❤️ using Astro, React, and AI**

# Astral Warp Archive

<img width="1536" height="1024" alt="Astral Warp Archive dashboard preview" src="https://github.com/user-attachments/assets/1ad67817-e069-43cb-8d47-ea841cef4cab" />

🚂🌠 Astral Warp Archive is a fan-made gacha companion for tracking pulls, pity, probability, and spending across seven games: Honkai: Star Rail, Genshin Impact, Zenless Zone Zero, Honkai Impact 3rd, Wuthering Waves, Arknights, and Arknights: Endfield.

It combines quick logging, detailed analytics, public leaderboards, supporter tools, and a clean multi-game dashboard designed for players who want to stay on top of every banner and recruitment.

---

## Live Demo

- Web app: https://honkai-star-rail-app.vercel.app/
- Project status: active prototype / production-style demo for the PayPal AI Hackathon

---

## Recent Updates

- Added support for Arknights and Arknights: Endfield, bringing the app to seven supported games
- Updated game mappings used by demo data and pull import/export workflows
- Added PayPal Sandbox supporter checkout with server-side order creation and capture
- Added checkout success and cancellation handling from the Settings supporter card
- Added premium supporter gating with receipt review and unlock flow
- Added calculator, forecast, todo list, timeline, and export utility pages
- Added public leaderboard and shareable profile support for community comparison
- Added quick log and event tracking workflows for faster pull intake
- Added dedicated admin review tools for supporter receipts
- Added multi-banner probability and pity modeling to estimate future outcomes
- Improved app structure around a DynamoDB-backed single-table design for user data, stats, and receipts

---

## Core Features

- Multi-game pull tracking with banner-specific history
- Soft pity and hard pity tracking per game and banner
- 50/50 win/loss tracking for limited banner mechanics where applicable
- Pull predictor and spending insights with cost-per-five-star calculations
- Global leaderboard and public profile views
- Import-ready workflow for gacha logs and data export, with game-specific mappings
- Supporter planning tools: Calculator, Forecast, Todo List, Timeline, and Exports
- PayPal Sandbox supporter checkout and receipt review workflows
- Admin receipt review flow for supporter verification
- Fast dashboard for overviewing total pulls, five-star totals, and progress over time

---

## Supported Games

- Honkai: Star Rail
- Genshin Impact
- Zenless Zone Zero
- Honkai Impact 3rd
- Wuthering Waves
- Arknights
- Arknights: Endfield

---

## Connected Infrastructure

Astral Warp Archive brings together a flexible app and tooling ecosystem for development, data presentation, integrations, and deployment:

- **Postman** and **APIMatic** for API workflows, schema context, and developer tooling
- **AG Grid** and **Bryntum-ready** platform positioning for rich data grids and planning experiences
- **Astropods** and **Channel3** as part of the connected product ecosystem
- **Elastic** and **KERNEL** for search and platform capabilities
- **Render** for deployment options
- **Zapier** for automation and connected workflows

---

## Tech Stack

- Framework: Next.js 16 + React 19 + TypeScript
- Styling: Tailwind CSS
- UI: shadcn-style components, AG Grid-compatible patterns, charts, dashboard layouts
- Data layer: Amazon DynamoDB with a single-table design
- Storage: Vercel Blob for receipt uploads and file-backed flows
- Analytics: Vercel Analytics
- API / tooling: Postman, APIMatic context plugin, AI-assisted development workflows
- Payments: PayPal Orders API Sandbox integration
- Hosting: Vercel + Render-ready deployment architecture

---

## Project Structure

```text
app/                 # App routes and pages
components/          # Dashboard, dialogs, analytics, UI shells
lib/                 # Game definitions, probability logic, auth, DB access, types
public/              # Static assets
next.config.mjs       # Next.js configuration
package.json         # App scripts and dependencies
README.md            # Project overview
```

---

## How It Works

Astral Warp Archive gives each player a personal archive of their pulls, grouped by game and banner type. It stores:

- Per-banner pull history
- Pity progression and probability state
- Supporting metadata such as currency spent and averages
- Leaderboard stats for public ranking views
- Supporter verification submissions for premium unlocks

This makes it possible to mix a lightweight daily tracker with deeper planning tools without losing context across multiple gacha games.

---

## Supporter Flow & Compliance Notes

### PayPal Sandbox checkout

- The Settings supporter card provides a PayPal checkout button
- The server creates and captures PayPal orders; client-side code does not handle PayPal secrets
- Checkout success and cancellation are handled by the app
- Configure `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in the deployment environment
- This integration uses PayPal Sandbox credentials and is for testing; use the appropriate production configuration before accepting live payments

### Receipt review

The app also supports receipt submission and manual admin review for supporter verification. Approved supporters can unlock premium planning utilities for their account.

### AI & tooling disclosures

- Google Cloud Vertex AI / Gemini is used for AI Warp Advisor-style summaries and planning assistance
- APIMatic context tooling supports API schema awareness during development
- Probability, pity, and forecasting logic are handled by deterministic app logic instead of relying on opaque black-box generation
- AI coding assistants were used during scaffolding and iteration

---

## Features by Area

### Pull tracking

- Track warps, wishes, signals, supplies, convenes, and recruits
- Maintain per-banner history with total pulls and five-star counts
- Monitor soft and hard pity values
- Import and export pull data using game-specific mappings

### Planning and forecasting

- Predict future odds over a selected number of pulls
- Model banner-saving and spending timelines
- Plan for pity windows and 50/50 outcomes

### Community

- Compare leaderboard performance against other players
- View public game profiles and luck percentile information
- Share profile data through generated links

### Premium / supporter tools

- Calculator
- Forecast
- Todo List
- Timeline
- Data export utilities

---

## Running Locally

### Prerequisites

- Node.js 18+
- npm or pnpm
- Access to required environment variables for your DynamoDB and Vercel Blob setup

### Install

```bash
npm install
```

### Start dev server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
npm run lint
```

---

## Environment Variables

Create an environment file such as `.env.local` and add the configuration required by your deployment setup. At minimum, this app expects credentials and table configuration for:

- AWS DynamoDB access
- AWS region / IAM role setup
- Vercel Blob storage
- Admin email configuration if using protected admin pages
- PayPal Sandbox client credentials for supporter checkout

Example variables:

```bash
DYNAMODB_TABLE_NAME=your-table-name
AWS_REGION=us-east-1
AWS_ROLE_ARN=your-role-arn
ADMIN_EMAILS=you@example.com
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
```

> Keep secrets out of source control. Do not commit local environment files. PayPal credentials must remain server-side.

---

## Testing and Demo Flow

To test the supporter workflow in Sandbox:

1. Configure `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` with PayPal Sandbox credentials
2. Open the Settings supporter card
3. Start checkout using the PayPal button and complete the Sandbox flow
4. Verify the app's success or cancellation handling

For receipt-based supporter verification, upload a receipt image or PDF and submit it for admin review. Once approved, premium utility features unlock on the account.

---

## Notes

This project is a fan-made companion tool and is not affiliated with or endorsed by HoYoverse, Hypergryph, or their partners. All game names and assets remain the property of their respective owners.

---

## License

See [LICENSE](LICENSE) for the project license.

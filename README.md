# Astral Warp Archive

<img width="1536" height="1024" alt="Astral Warp Archive dashboard preview" src="https://github.com/user-attachments/assets/1ad67817-e069-43cb-8d47-ea841cef4cab" />

🚂🌠 Astral Warp Archive is a fan-made gacha companion for tracking pulls, pity, probability, and spending across six HoYoverse titles in one place: Honkai: Star Rail, Genshin Impact, Zenless Zone Zero, Honkai Impact 3rd, Wuthering Waves, and Arknights: Endfield.

It combines quick logging, detailed analytics, public leaderboards, supporter-gated planning tools, and a clean multi-game dashboard designed for players who want to stay on top of every banner and every 50/50.

---

## Live Demo

- Web app: https://honkai-star-rail-app.vercel.app/
- Project status: active prototype / production-style demo for the PayPal AI Hackathon

---

## Recent Updates

- Added support for six games in a single app shell: Star Rail, Genshin, ZZZ, Honkai 3rd, Wuthering Waves, and Endfield
- Added premium supporter gating with manual receipt review and unlock flow
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
- 50/50 win/loss tracking for limited banner mechanics
- Pull predictor and spending insights with cost-per-five-star calculations
- Global leaderboard and public profile views
- Import-ready workflow for gacha logs and data export
- Supporter-only planning tools: Calculator, Forecast, Todo List, Timeline, Exports
- Admin receipt review flow for supporter verification
- Fast dashboard for overviewing total pulls, five-star totals, and progress over time

---

## Supported Games

- Honkai: Star Rail
- Genshin Impact
- Zenless Zone Zero
- Honkai Impact 3rd
- Wuthering Waves
- Arknights: Endfield

---

## Tech Stack

- Framework: Next.js 16 + React 19 + TypeScript
- Styling: Tailwind CSS
- UI: shadcn-style components, AG Grid-compatible patterns, charts, dashboard layouts
- Data layer: Amazon DynamoDB with a single-table design
- Storage: Vercel Blob for receipt uploads and file-backed flows
- Analytics: Vercel Analytics
- API / tooling: Postman, APIMatic context plugin, AI-assisted development workflows
- Hosting: Vercel + Render-ready deployment architecture

---

## Project Structure

```text
app/                 # App routes and pages
components/         # Dashboard, dialogs, analytics, UI shells
lib/                # Game definitions, probability logic, auth, DB access, types
public/             # Static assets
next.config.mjs     # Next.js configuration
package.json        # App scripts and dependencies
README.md           # Project overview
```

---

## How It Works

Astral Warp Archive gives each player a personal archive of their pulls, grouped by game and banner type. It stores:

- per-banner pull history
- pity progression and probability state
- supporting metadata such as currency spent and averages
- leaderboard stats for public ranking views
- supporter verification submissions for premium unlocks

This makes it possible to mix a lightweight daily tracker with deeper planning tools without losing context across multiple gacha games.

---

## Supporter Flow & Compliance Notes

### PayPal / supporter experience

- Users can donate via the supporter modal and then upload a receipt as proof of payment
- The app stores the uploaded receipt and marks it for manual admin review
- Approved supporters unlock premium planning utilities for their account

### Sandbox / roadmap notice

The current implementation uses a manual review flow rather than direct automated checkout and webhook verification. The project is structured so a future direct PayPal Orders API / webhook integration can be added without redesigning the app flow.

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
- admin email configuration if using protected admin pages

Example variables:

```bash
DYNAMODB_TABLE_NAME=your-table-name
AWS_REGION=us-east-1
AWS_ROLE_ARN=your-role-arn
ADMIN_EMAILS=you@example.com
```

> Keep secrets out of source control. Do not commit local environment files.

---

## Testing and Demo Flow

To test the supporter workflow on the live app:

1. Open the support modal from the main navigation
2. Complete a donation via PayPal
3. Upload a receipt image or PDF
4. Submit it for admin review
5. Once approved, premium utility features unlock on the account

---

## Notes

This project is a fan-made companion tool and is not affiliated with or endorsed by HoYoverse or its partners. All game names and assets remain the property of their respective owners.

---

## License

See [LICENSE](LICENSE) for the project license.

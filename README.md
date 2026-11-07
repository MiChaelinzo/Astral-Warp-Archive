# Astral Warp Archive
<img width="1536" height="1024" alt="jpeg" src="https://github.com/user-attachments/assets/1ad67817-e069-43cb-8d47-ea841cef4cab" />

🚂🌠 Track warps, wishes, signals, supplies, convenes, and recruits across six games: Honkai: Star Rail, Genshin Impact, Zenless Zone Zero, Honkai Impact 3rd, Wuthering Waves, and Arknights: Endfield. Watch your pity climb, plan future pulls, and compare your luck with the community.

> **PayPal AI Hackathon project note:** This repository currently includes a PayPal.Me donation link and a manual receipt-review flow for Supporter access. It does **not** currently use the PayPal API or SDK, and its pull forecasts are deterministic probability calculations—not an AI model. Those distinctions are stated here so the project description accurately reflects the implementation; both meaningful PayPal technology integration and AI capabilities would need to be added before claiming those hackathon requirements are met.

## What it does

- **Multi-game pull tracking:** Keep banner records and pity counters for six supported games.
- **Probability-based planning:** View soft/hard pity odds, pull predictions, and banner forecasts, including limited-banner 50/50 and guarantee modeling.
- **Spending insights:** Estimate currency and real-money value associated with pulls.
- **Community features:** Compare luck and pull totals on leaderboards and share public profiles.
- **Supporter features:** The Calculator, Forecast, Todo List, Timeline, and exports are gated behind Supporter status.
- **Data portability:** Import supported UIGF/SRGF records and export pull history.

## PayPal and Supporter flow

The current Supporter donation flow is intentionally manual:

1. Choose **Donate via PayPal** in the Supporter dialog. This opens the project's PayPal.Me page.
2. Return to the app and submit a payment receipt, provider, and optional amount or transaction note.
3. An administrator reviews the receipt and approves or rejects the Supporter request.

The app does not create PayPal orders, capture payments, verify transactions through PayPal, or receive PayPal webhooks. A receipt submission is a claim for manual review, not automated payment verification.

## AI status

The current pull predictor and forecast features use explicit probability calculations and banner rules. They are not machine-learning or generative-AI features. No AI provider or model is currently integrated. For a PayPal AI Hackathon submission, add and document a real AI capability and a meaningful PayPal API/SDK integration, then update this section with the specific models, PayPal products, and end-to-end demo flow actually used.

## Tech stack

- Next.js 16, React 19, and TypeScript
- Tailwind CSS
- Amazon DynamoDB for application data
- Vercel Blob for uploaded receipt files
- Vercel Analytics

## Running locally

Requirements: Node.js and npm, plus configured access to the application's AWS DynamoDB and Vercel Blob services.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production build and lint commands:

```bash
npm run build
npm run lint
```

The app expects deployment configuration for DynamoDB/AWS credentials and receipt uploads. Consult the deployment environment and source configuration before running against a real database; do not commit secrets to the repository.

## Hackathon demo checklist

For an accurate and reviewable submission, provide the following once available:

- A deployed demo URL and test instructions.
- A short walkthrough showing the user problem, the AI feature, and the PayPal-powered flow.
- A public demo video and the Devpost submission details.
- The exact AI model/service and PayPal API/SDK products used, including the sandbox setup and any required environment variables.
- Clear disclosure of what is implemented versus planned, and how payment status is verified.

See the [PayPal AI Hackathon on Devpost](https://paypalaihackathon.devpost.com/) for the current official rules and submission instructions.

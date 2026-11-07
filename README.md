# Astral Warp Archive

<img width="1536" height="1024" alt="jpeg" src="https://github.com/user-attachments/assets/1ad67817-e069-43cb-8d47-ea841cef4cab" />

🚂🌠 Track warps, wishes, signals, supplies, convenes, and recruits across six games: **Honkai: Star Rail**, **Genshin Impact**, **Zenless Zone Zero**, **Honkai Impact 3rd**, **Wuthering Waves**, and **Arknights: Endfield**.

---

## 🌐 Live Demo & Deployment

- **Live Web Application:** [https://honkai-star-rail-app.vercel.app/](https://honkai-star-rail-app.vercel.app/)
- **Hackathon Submission:** PayPal AI Hackathon on Devpost

---

## 🏆 Hackathon Technology Compliance & Disclosures

### 1. PayPal Technology Integration
- **PayPal.Me & Supporter Gateway:** Integrated into the "Become a Supporter" modal to facilitate user-initiated voluntary contributions.
- **Manual Receipt Verification Flow:** Users upload proof of payment (PNG/JPG/PDF via Vercel Blob) following a PayPal contribution. Administrators manually verify receipts to unlock gated Supporter features (**Pull Calculator**, **Banner Forecasting**, **Todo List**, **Timeline**, and **UIGF/CSV Data Exports**).
- **Roadmap / Sandbox Notice:** The current implementation uses a manual receipt submission and review pipeline. Direct `/v2/checkout/orders` REST API integration and automated PayPal SDK webhook verification are planned for future sandbox iterations.

### 2. AI Tools, Models & Intelligence Layer
- **Google Cloud Vertex AI (Gemini Engine):** Powers the **AI Warp Advisor** prototype, interpreting pull history, pity curves, and spending budgets to generate natural-language spending summaries and multi-banner scenario simulations.
- **APIMatic Context Plugin:** Utilized within the IDE development environment to supply version-aware API schemas directly to code generation models, eliminating endpoint hallucinations and streamlining TypeScript type definitions.
- **Deterministic Probability & Pity State Engine:** Serves as the high-speed calculation engine powering soft/hard pity odds, 50/50 guarantee tracking, and multi-banner savings timelines across all supported game formats.
- **AI Coding Assistance:** Scaffolding and ingestion pipelines built with support from Claude, ChatGPT, and GitHub Copilot.

---

## 🤝 Sponsors & Integrations

Special thanks to the sponsor tools and services powering the development and architecture of Astral Warp Archive:

- **Postman:** API endpoint testing, collection management, and mock server configuration.
- **AG Grid:** Enterprise-grade tabular engine providing high-performance, filterable multi-game pull history data grids.
- **Astropods:** Peripheral gaming asset pipeline management and telemetry syncing.
- **Bryntum:** Dynamic timeline scheduling components for banner forecast tracking.
- **Channel3:** Community gaming data integration and asset ingestion workflows.
- **Elastic:** Rapid indexing and search capabilities for global pull telemetry and community leaderboards.
- **KERNEL:** Core data structure utilities and telemetry processing.
- **Render:** Scalable cloud application deployment and backend hosting.
- **Zapier:** Workflow automation triggers for backend supporter status notifications.
- **APIMatic:** API context generation and schema translation for robust SDK modeling.

---

## ✨ Features & Capabilities

- **Multi-Game Pull Tracking:** Keep detailed banner records and live pity counters for six major gacha titles.
- **Probability-Based Planning:** Model soft/hard pity progression, 50/50 guarantee states, and multi-banner savings timelines.
- **Spending Insights:** Convert in-game pulls and pity counters into real-money value estimates.
- **Community Leaderboards:** Compare pull luck and pity performance against global players with public profiles.
- **Data Portability:** Import standard UIGF/SRGF records and export complete pull histories to CSV.
- **Supporter Utility Gating:** Access premium planning tools (Calculator, Forecast, Todo List, Timeline, Exports) upon Supporter verification.

---

## 🛠️ Tech Stack

- **Framework & Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Data Grids & Visualizations:** AG Grid, Bryntum, AG Charts
- **Database & Storage:** Amazon DynamoDB (Application State), Vercel Blob (Receipt Storage)
- **API & Testing:** Postman, APIMatic Context Plugin
- **Hosting & Infrastructure:** Render, Vercel, Vercel Analytics

---

## 💻 Running Locally

### Prerequisites
- Node.js (v18+) and npm
- Access credentials for **Amazon DynamoDB** and **Vercel Blob**

### Setup Instructions
```bash
# Clone the repository and install dependencies
npm install

# Start the local development server
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Lint

```bash
npm run build
npm run lint

```

> **Note on Environment Variables:** Ensure `.env.local` is properly configured with your AWS DynamoDB keys and Vercel Blob tokens before attempting to write data or submit test receipts. Do not commit secrets to public repositories.

---

## 🧪 Testing Instructions for Judges

To test the Supporter workflow on the live site ([https://honkai-star-rail-app.vercel.app/](https://honkai-star-rail-app.vercel.app/)):

1. Open the **"Become a Supporter"** dialog from the main navigation sidebar.
2. Click **Step 1 — Donate via PayPal** to view the `PayPal.Me` gateway.
3. Click **Step 2 — Upload your receipt**, select a sample receipt file (`.png`, `.jpg`, `.pdf`), choose **PayPal**, and enter a test note or amount.
4. Submit the receipt for administrator review.
5. Upon approval, all gated Supporter utility tools (Calculator, Forecast, Todo, Timeline, Exports) will automatically unlock on your account.

```

```

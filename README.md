# PagePulseAI ⚡

A lightweight, high-fidelity AI-powered Website Audit Tool designed to extract factual page metrics, generate grounded structural reviews (covering SEO, messaging clarity, CTAs, and UX), and log complete execution traces for inspection in a live developer tool.

---

## 🏗️ Architecture Overview

PagePulseAI is built as a decoupled fullstack application with a clean, service-oriented backend structure:

```
[React Client (port 3000)]
         │
         ▼ (POST /api/audit)
[Express Server (port 5000)]
         │
         ├─► [scraper.service.js]          (Scrapes metadata, counts elements, cleans page copy)
         ├─► [prompt-builder.service.js]   (Wraps metrics & content in grounding prompts)
         ├─► [ai.service.js]               (Orchestrates Gemini API requests with JSON Schema)
         └─► [logger.service.js]           (Writes prompt/completion traces to disk)
                 │
                 ▼
          [/prompt-logs]                  (Sequential JSON files, e.g. audit-001.json)
```

### File Structure:
- `/client`: React frontend bootstrapped with Vite.
- `/server`: Node.js backend using Express.
- `/server/services`: Dedicated service modules separating concerns:
  - `scraper.service.js`: Handles HTML extraction, text sanitization, and metric counting.
  - `prompt-builder.service.js`: Constructs the expert system context and user templates.
  - `ai.service.js`: Interfaces with the Gemini API and configures schema outputs.
  - `logger.service.js`: Manages directory scans and writes trace logs.
- `/server/prompt-logs`: Stored execution traces.

---

## 🔬 AI Design & Engineering Decisions

### 1. Choice of AI Model
We utilize the `gemini-1.5-flash` model. It offers:
- **Low Latency**: Key for real-time web applications.
- **Large Context Window**: Easily processes long scraped page content.
- **Robust Schema Enforcement**: Natively supports JSON schema validation, ensuring zero failures when parsing insights on the backend.

### 2. Prompt Engineering Strategy
The AI is guided by a two-tiered prompt layout:
- **System Prompt**: Enforces the role of a *senior website auditor* specializing in conversion rate optimization (CRO) and SEO. It requires all claims to be anchored strictly to provided metrics and forbids generic templates.
- **User Prompt**: Injects a clean markdown-like template detailing URL, structured counts (headings, images, CTAs), metadata validation length, and sanitised text copy.

### 3. AI Grounding Strategy
To prevent hallucinated audits, **the LLM is never sent raw text copy on its own**. 
By feeding the model a structured block of factual DOM counts (e.g. *number of H1 tags, alt-text percentages*), the model is forced to reference actual observations. For example, the model cannot state "fix your multiple H1 tags" unless the scraped metrics explicitly count H1 > 1.

### 4. Structured AI Output Schema
Gemini's `responseSchema` configuration is used to enforce a strict JSON output matching:
```json
{
  "scores": { "seo": 90, "ux": 80, "cta": 75, "content": 85, "overall": 82 },
  "insights": {
    "seo": "Critique...",
    "messaging": "Critique...",
    "cta": "Critique...",
    "contentDepth": "Critique...",
    "ux": "Critique..."
  },
  "recommendations": [
    { "priority": "HIGH | MEDIUM | LOW", "action": "Actionable label...", "reasoning": "Reason grounded in metrics..." }
  ]
}
```

### 5. Prompt Logging Design
Every audit executes a trace log, saving the details into `/server/prompt-logs/audit-[XXX].json`. This file records:
- System and user prompts.
- Latency (ms) and timestamp.
- Structured inputs and raw outputs.
The frontend `AI Trace Drawer` loads this log by trace ID, exposing the inner workings directly in the web app.

---

## ⚖️ Technical Trade-offs

1. **Cheerio vs. Puppeteer/Playwright**:
   - *Decision*: We used `cheerio` + `axios`.
   - *Trade-off*: Cheerio fetches and parses static HTML within milliseconds, whereas Puppeteer requires launching a headless browser (~1.5s overhead). However, Cheerio cannot execute client-side JavaScript, meaning Single Page Applications (SPAs) like React apps might return empty metrics. For a lightweight auditor, Cheerio is the preferred choice for speed and server resource conservation.
2. **Local Logs vs. Database**:
   - *Decision*: Saved traces as sequential local `.json` files.
   - *Trade-off*: Storing logs locally on disk is simple, requires zero database setup, and makes inspection easy during code review. For a high-throughput production environment, this would be migrated to a structured database like MongoDB or an ELK stack.

---

## 🚀 Setup & Execution

### Prerequisites
- Node.js (v18+ recommended)
- npm (v10+ recommended)
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd PagePulseAI
   ```

2. Install dependencies for the root, client, and server:
   ```bash
   npm run install:all
   ```

3. Configure your API key:
   - Create a `.env` file in the `/server` directory:
     ```bash
     cp server/.env.example server/.env
     ```
   - Open `/server/.env` and insert your API key:
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```

### Running the Application

Start both the client and server concurrently:
```bash
npm run dev
```

- **Frontend**: Runs on [http://localhost:3000](http://localhost:3000)
- **Backend Server**: Runs on [http://localhost:5000](http://localhost:5000)

---

## 🔮 Future Improvements
1. **JavaScript Scraping Fallback**: Automatically fall back to Playwright if static HTML word count is extremely low, enabling SPA auditing.
2. **Image Performance Audits**: Fetch scraped image headers to measure image byte sizes and calculate load time impact.
3. **Multi-Page Crawling**: Support crawling up to 5 linked child pages to compile a sitewide health score.
4. **Retry Loop on JSON Errors**: Implement LLM call retries if schema validations fail or parsing issues arise.

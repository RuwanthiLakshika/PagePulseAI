import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { scrapePage } from './services/scraper.service.js';
import { getSystemPrompt, buildUserPrompt } from './services/prompt-builder.service.js';
import { runAnalysis } from './services/ai.service.js';
import { logAuditTrace, getTraceLog } from './services/logger.service.js';

import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static assets from Vite build in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

app.post('/api/audit', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL. Please enter a complete URL starting with http:// or https://.' });
  }

  console.log(`Starting audit for URL: ${url}`);

  try {
    console.log('Scraping page content...');
    let scrapData;
    try {
      scrapData = await scrapePage(url);
    } catch (scrapeErr) {
      console.error('Scraping error:', scrapeErr);
      return res.status(502).json({
        error: `Scraping failed: ${scrapeErr.message}`,
        message: 'Could not connect to the target website. Check if the URL is reachable and does not block scrapers.'
      });
    }

    const { metrics, cleanedContent } = scrapData;

    console.log('Constructing grounded prompts...');
    const systemPrompt = getSystemPrompt();
    const userPrompt = buildUserPrompt(url, metrics, cleanedContent);

    console.log('Sending context to Gemini API...');
    let aiResult;
    try {
      aiResult = await runAnalysis(systemPrompt, userPrompt);
    } catch (aiErr) {
      console.error('Gemini API Error:', aiErr);
      return res.status(502).json({
        error: `AI Completion failed: ${aiErr.message}`,
        message: 'The AI model failed to analyze the extracted metrics. Verify that your GEMINI_API_KEY environment variable is configured correctly.'
      });
    }

    const { data: aiData, rawOutput, responseTime, modelUsed } = aiResult;

    console.log('Writing prompt trace log to disk...');
    let traceId;
    try {
      traceId = await logAuditTrace({
        url,
        systemPrompt,
        userPrompt,
        metrics,
        metadata: metrics.metadata,
        rawOutput,
        responseTime,
        model: modelUsed
      });
    } catch (logErr) {
      console.warn('Logging trace warning:', logErr);
      traceId = `failed-log-${Date.now()}`;
    }

    const traceLog = {
      traceId,
      timestamp: new Date().toISOString(),
      url,
      model: modelUsed || 'gemini-2.0-flash',
      systemPrompt,
      userPrompt,
      structuredInput: {
        metrics,
        metadata: metrics.metadata
      },
      rawOutput,
      responseTime
    };

    return res.status(200).json({
      metrics,
      scores: aiData.scores,
      insights: aiData.insights,
      recommendations: aiData.recommendations,
      traceId,
      traceLog
    });

  } catch (err) {
    console.error('Unexpected server error during audit:', err);
    return res.status(500).json({
      error: 'An unexpected internal error occurred.',
      details: err.message
    });
  }
});

app.get('/api/trace/:traceId', async (req, res) => {
  const { traceId } = req.params;

  try {
    const log = await getTraceLog(traceId);
    return res.status(200).json(log);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
});

// Catch-all route to serve the React SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PagePulseAI backend server running on http://localhost:${PORT}`);
});

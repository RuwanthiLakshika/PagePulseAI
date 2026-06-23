import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.resolve(__dirname, '../prompt-logs');

async function ensureLogsDir() {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Failed to create logs directory:', err);
    }
  }
}

async function getNextTraceId() {
  await ensureLogsDir();
  try {
    const files = await fs.readdir(LOGS_DIR);
    
    const numbers = files
      .map(file => {
        const match = file.match(/^audit-(\d+)\.json$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(num => num !== null);

    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = max + 1;
    
    return `audit-${String(nextNum).padStart(3, '0')}`;
  } catch (err) {
    console.error('Failed reading logs directory, using timestamp fallback:', err);
    return `audit-${Date.now()}`;
  }
}

export async function logAuditTrace(traceData) {
  const traceId = await getNextTraceId();
  const filePath = path.join(LOGS_DIR, `${traceId}.json`);

  const fullLog = {
    traceId,
    timestamp: new Date().toISOString(),
    url: traceData.url,
    model: 'gemini-2.5-flash',
    systemPrompt: traceData.systemPrompt,
    userPrompt: traceData.userPrompt,
    structuredInput: {
      metrics: traceData.metrics,
      metadata: traceData.metadata
    },
    rawOutput: traceData.rawOutput,
    responseTime: traceData.responseTime
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(fullLog, null, 2), 'utf-8');
    return traceId;
  } catch (err) {
    console.error('Failed to write prompt trace log:', err);
    throw new Error(`Logging failed: ${err.message}`);
  }
}

export async function getTraceLog(traceId) {
  if (!/^audit-\d+$/.test(traceId)) {
    throw new Error('Invalid trace ID format.');
  }

  const filePath = path.join(LOGS_DIR, `${traceId}.json`);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Audit log ${traceId} not found.`);
  }
}

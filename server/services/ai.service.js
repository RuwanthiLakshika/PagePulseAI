import { GoogleGenerativeAI } from '@google/generative-ai';

export async function runAnalysis(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing. Please create a .env file inside the /server directory containing GEMINI_API_KEY=[your_key].');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const responseSchema = {
    type: "OBJECT",
    properties: {
      scores: {
        type: "OBJECT",
        properties: {
          seo: { type: "INTEGER", description: "Score from 0-100 evaluating the search engine optimization based on headers/meta tags." },
          ux: { type: "INTEGER", description: "Score from 0-100 evaluating structural and UX quality." },
          cta: { type: "INTEGER", description: "Score from 0-100 based on presence, count, and alignment of CTA elements." },
          content: { type: "INTEGER", description: "Score from 0-100 on page readability and content depth." },
          overall: { type: "INTEGER", description: "Weighted average score from 0-100." }
        },
        required: ["seo", "ux", "cta", "content", "overall"]
      },
      insights: {
        type: "OBJECT",
        properties: {
          seo: { type: "STRING", description: "Factual metrics-based SEO analysis (must cite specific title/desc length and heading counts)." },
          messaging: { type: "STRING", description: "Factual analysis on copy clarity, density, and flow." },
          cta: { type: "STRING", description: "Critique of call-to-actions, referencing CTA count and layout." },
          contentDepth: { type: "STRING", description: "Critique of text copy length, completeness, and completeness of details." },
          ux: { type: "STRING", description: "Critique of clear layout flaws (such as missing/duplicate H1s, readability concerns)." }
        },
        required: ["seo", "messaging", "cta", "contentDepth", "ux"]
      },
      recommendations: {
        type: "ARRAY",
        description: "Array of 3-5 prioritized recommendations grounded in metrics.",
        items: {
          type: "OBJECT",
          properties: {
            priority: { type: "STRING", description: "Urgency: HIGH, MEDIUM, or LOW" },
            action: { type: "STRING", description: "Short, actionable command outlining what needs to be fixed." },
            reasoning: { type: "STRING", description: "Factual explanation referencing the scraped page data." }
          },
          required: ["priority", "action", "reasoning"]
        }
      }
    },
    required: ["scores", "insights", "recommendations"]
  };

  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest'
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting audit with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.1,
        }
      });

      const startTime = Date.now();
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const response = await result.response;
      const rawText = response.text();

      if (!rawText) {
        throw new Error('Model returned an empty completion.');
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(`Model output did not conform to valid JSON format: ${parseErr.message}. Output was: ${rawText}`);
      }

      return {
        data: parsedResult,
        rawOutput: rawText,
        responseTime,
        modelUsed: modelName
      };

    } catch (err) {
      console.warn(`Model ${modelName} failed with error: ${err.message}. Trying next fallback model...`);
      lastError = err;
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

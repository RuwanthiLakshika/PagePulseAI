export function getSystemPrompt() {
  return "You are an expert website auditor specializing in SEO, UX, content strategy, accessibility, and conversion optimization. Base all recommendations and evaluations strictly on the provided factual metrics, metadata, and page text content. Avoid general, vague statements; you must reference the specific numbers, headings, or missing elements detected in the provided context.";
}

export function buildUserPrompt(url, metrics, pageContent) {
  const headingOutline = metrics.headingsList 
    ? metrics.headingsList.map(h => `[${h.type}] ${h.text}`).join('\n')
    : 'No headings detected.';

  const ctaOutline = metrics.ctasList
    ? metrics.ctasList.map(cta => `- [${cta.tagName}] "${cta.text}" (href: ${cta.href || 'none'})`).join('\n')
    : 'No primary CTAs detected.';

  return `URL: ${url}

EXTRACTED METRICS:
- Total Word Count: ${metrics.wordCount}
- Headings Count: H1: ${metrics.headings.h1}, H2: ${metrics.headings.h2}, H3: ${metrics.headings.h3}
- Calls-To-Action (CTAs): ${metrics.ctas}
- Links Count: Internal: ${metrics.links.internal}, External: ${metrics.links.external}
- Images: Total: ${metrics.images.total}, Missing Alt: ${metrics.images.missingAlt} (${metrics.images.missingAltPercent}% missing alt text)

METADATA:
- Meta Title: "${metrics.metadata.title || '[Missing Title]'}" (Length: ${metrics.metadata.title?.length || 0} chars)
- Meta Description: "${metrics.metadata.description || '[Missing Description]'}" (Length: ${metrics.metadata.description?.length || 0} chars)

PAGE LAYOUT & ELEMENTS:
-- HEADINGS HIERARCHY OUTLINE --
${headingOutline}

-- DETECTED CALL-TO-ACTIONS --
${ctaOutline}

PAGE CONTENT PLAIN TEXT COPY:
"""
${pageContent}
"""

---
AUDIT INSTRUCTIONS:
1. Conduct a rigorous review covering the following 5 dimensions:
   - SEO Structure: Critique page meta tags length, heading hierarchies, H1 usage, and image alt text presence.
   - Messaging Clarity: Analyze the content depth, reading flow, and if the page copy is clear or wordy.
   - CTA Usage: Evaluate the prominence, count, and labeling of action buttons based on the metrics.
   - Content Depth: Critique if the word count is sufficient for the page type.
   - UX Concerns: Highlight structural risks (e.g. missing H1, duplicate H1 tags, text-dense layout, missing CTAs).

2. Generate 3 to 5 prioritized, actionable recommendations. Each recommendation must contain a priority (HIGH, MEDIUM, or LOW), a specific action item, and a clear reason grounded in the extracted metrics.

3. Enforce the output JSON structure strictly. Ensure every insight directly cites the metrics provided (e.g., if you mention headings, mention that you detected H1/H2/H3 counts; if you mention accessibility, cite the alt-text percentage).
`;
}

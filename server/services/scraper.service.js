import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

export async function scrapePage(targetUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (err) {
    throw new Error('Invalid URL format. Please include protocol (e.g., https://example.com).');
  }

  const hostname = parsedUrl.hostname;

  let html;
  try {
    const response = await axios.get(targetUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    html = response.data;
  } catch (err) {
    throw new Error(`Failed to retrieve website: ${err.message}`);
  }

  const $ = cheerio.load(html);

  const title = $('title').first().text().trim() || 
                $('meta[property="og:title"]').first().attr('content')?.trim() || 
                '';
  
  const description = $('meta[name="description"]').first().attr('content')?.trim() || 
                      $('meta[property="og:description"]').first().attr('content')?.trim() || 
                      '';

  const headings = { h1: 0, h2: 0, h3: 0 };
  const headingsList = [];
  
  $('h1, h2, h3').each((_, el) => {
    const tagName = el.name.toLowerCase();
    const text = $(el).text().trim();
    if (text) {
      headings[tagName]++;
      headingsList.push({
        type: tagName.toUpperCase(),
        text: cleanText(text)
      });
    }
  });

  const links = { internal: 0, external: 0 };
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    
    const trimmedHref = href.trim();
    if (trimmedHref.startsWith('#') || trimmedHref.startsWith('javascript:') || trimmedHref.startsWith('tel:') || trimmedHref.startsWith('mailto:')) {
      return;
    }

    try {
      const linkUrl = new URL(trimmedHref, targetUrl);
      if (linkUrl.hostname === hostname) {
        links.internal++;
      } else {
        links.external++;
      }
    } catch (e) {
      if (trimmedHref.startsWith('/') || !trimmedHref.includes('://')) {
        links.internal++;
      } else {
        links.external++;
      }
    }
  });

  let totalImages = 0;
  let missingAlt = 0;
  $('img').each((_, el) => {
    totalImages++;
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === null || alt.trim() === '') {
      missingAlt++;
    }
  });
  
  const missingAltPercent = totalImages > 0 ? Math.round((missingAlt / totalImages) * 100) : 0;

  const ctasList = [];
  const ctaKeywords = [
    'sign up', 'signup', 'get started', 'join', 'subscribe', 'buy', 
    'purchase', 'contact', 'book', 'download', 'register', 'try free', 
    'learn more', 'schedule', 'demo', 'checkout', 'apply now'
  ];

  $('button, a, input[type="button"], input[type="submit"]').each((_, el) => {
    const tagName = el.name || el.tagName.toLowerCase();
    const text = $(el).text().trim() || $(el).attr('value')?.trim() || '';
    const href = $(el).attr('href') || '';
    const className = $(el).attr('class') || '';
    
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.includes('twitter.com') || href.includes('facebook.com')) {
      return;
    }

    const lowerText = text.toLowerCase();
    const lowerClass = className.toLowerCase();

    const isButtonTag = tagName === 'button' || (tagName === 'input' && ['button', 'submit'].includes($(el).attr('type')));
    const hasButtonClass = lowerClass.includes('btn') || lowerClass.includes('button') || lowerClass.includes('cta');
    const hasCtaText = ctaKeywords.some(kw => lowerText.includes(kw));

    if (text && (isButtonTag || hasButtonClass || hasCtaText)) {
      ctasList.push({
        tagName: tagName.toUpperCase(),
        text: cleanText(text),
        href: href || null
      });
    }
  });

  const bodyClone = $('body').clone();
  
  bodyClone.find('script, style, noscript, svg, iframe, header, footer, nav, .header, .footer, .nav, #header, #footer, #nav').remove();
  
  const rawBodyText = bodyClone.text();
  const mainText = cleanText(rawBodyText);

  const words = mainText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  return {
    metrics: {
      wordCount,
      headings,
      ctas: ctasList.length,
      links,
      images: {
        total: totalImages,
        missingAlt,
        missingAltPercent
      },
      metadata: {
        title,
        description
      },
      headingsList,
      ctasList: ctasList.slice(0, 15)
    },
    cleanedContent: mainText.substring(0, 10000)
  };
}

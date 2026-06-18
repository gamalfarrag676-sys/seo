import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Fetch the target URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()
    
    // Parse HTML using Cheerio
    const $ = cheerio.load(html)
    
    // Remove unwanted elements
    $('script, style, noscript, iframe, img, svg').remove()

    // Extract basic SEO elements
    const title = $('title').text().trim()
    const metaDescription = $('meta[name="description"]').attr('content') || ''
    
    const h1 = []
    $('h1').each((_, el) => h1.push($(el).text().trim()))
    
    const h2 = []
    $('h2').each((_, el) => h2.push($(el).text().trim()))

    // Extract raw text content for analysis
    const textContent = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()

    // Calculate actual word count (approximate for Arabic/English)
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length

    // Return the clean data
    const result = {
      title,
      metaDescription,
      headings: {
        h1,
        h2: h2.slice(0, 5) // Return top 5 H2s to save tokens
      },
      wordCount,
      // We limit the text content to first 10,000 chars to avoid exceeding AI token limits
      textContent: textContent.substring(0, 10000) 
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

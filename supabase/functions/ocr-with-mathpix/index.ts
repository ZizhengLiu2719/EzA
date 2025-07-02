import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Mathpix OCR function loaded')

serve(async (req) => {
  // 处理浏览器发起的CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 从请求体中获取图片数据。注意：前端需要发送base64编码的图片字符串。
    const { image_b64 } = await req.json()
    if (!image_b64) {
      throw new Error('No image data provided. Please send a base64 encoded image.')
    }

    // 从Supabase Secrets中安全地获取API密钥
    const appId = Deno.env.get('MATHPIX_APP_ID')
    const appKey = Deno.env.get('MATHPIX_APP_KEY')

    if (!appId || !appKey) {
      throw new Error('Mathpix API credentials are not set in Supabase secrets.')
    }

    // 调用 Mathpix API
    const response = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'app_id': appId,
        'app_key': appKey,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        src: `data:image/jpeg;base64,${image_b64}`,
        formats: ['text', 'latex_styled'],
      }),
    })

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Mathpix API error: ${response.statusText} - ${errorBody}`)
    }

    const result = await response.json()

    // 提取识别出的LaTeX公式
    const latex = result?.latex_styled

    if (!latex) {
        throw new Error('Could not extract LaTeX from Mathpix response.')
    }

    // 将识别结果返回给前端
    return new Response(JSON.stringify({ latex }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in Mathpix function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 
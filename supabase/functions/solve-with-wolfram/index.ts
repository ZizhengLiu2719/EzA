import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Wolfram Alpha solver function loaded')

// 定义前端期望的返回格式
interface SolutionStep {
  title: string;
  step: string;
}

interface Visual {
  type: string;
  imageUrl: string;
}

interface Solution {
  steps: SolutionStep[];
  visuals: Visual[];
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    if (!query) {
      throw new Error('No query provided')
    }

    const appId = Deno.env.get('WOLFRAM_ALPHA_APP_ID')
    if (!appId) {
      throw new Error('Wolfram Alpha API App ID is not set in Supabase secrets.')
    }

    // 构建Wolfram|Alpha API请求URL
    const apiUrl = new URL('https://api.wolframalpha.com/v2/query')
    apiUrl.searchParams.append('input', query)
    apiUrl.searchParams.append('appid', appId)
    apiUrl.searchParams.append('output', 'json') // 请求JSON格式的输出
    apiUrl.searchParams.append('format', 'image,plaintext')
    apiUrl.searchParams.append('podstate', 'Step-by-step solution') // 请求分步解答
    apiUrl.searchParams.append('scantimeout', '5.0')


    // 调用API
    const response = await fetch(apiUrl.toString())
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Wolfram Alpha API error: ${response.statusText} - ${errorBody}`)
    }

    const result = await response.json()
    const pods = result.queryresult.pods || []

    const solution: Solution = {
      steps: [],
      visuals: [],
    }

    // 解析API返回的数据
    pods.forEach((pod: any) => {
      // 提取分步解答
      if (pod.id === 'Result' || pod.title.toLowerCase().includes('solution') || pod.id.toLowerCase().includes('step')) {
        pod.subpods.forEach((subpod: any) => {
          if (subpod.plaintext) {
            solution.steps.push({
              title: pod.title,
              step: subpod.plaintext,
            })
          }
        })
      }
      // 提取图像和可视化结果
      if (pod.title.toLowerCase().includes('plot') || pod.title.toLowerCase().includes('diagram')) {
        pod.subpods.forEach((subpod: any) => {
          if (subpod.img) {
            solution.visuals.push({
              type: pod.title,
              imageUrl: subpod.img.src,
            })
          }
        })
      }
    });

    if (solution.steps.length === 0 && solution.visuals.length === 0) {
        throw new Error('Could not find a parsable solution from Wolfram Alpha.')
    }

    return new Response(JSON.stringify(solution), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in Wolfram Alpha function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 
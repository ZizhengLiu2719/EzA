import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('OpenAI Solver function loaded')

// 定义前端期望的返回格式
interface SolutionStep {
  title: string;
  step: string;
}

interface Solution {
  steps: SolutionStep[];
  visuals: []; // OpenAI无法直接生成图像，所以这个数组总是空的
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    if (!query) {
      throw new Error('No query provided.')
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in Supabase secrets.')
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are a brilliant STEM tutor. Your task is to solve the given mathematical problem and provide a step-by-step explanation. You MUST return the answer in a specific JSON format. The format is: {"steps": [{"title": "Step Title", "step": "Explanation of the step."}]}. The "steps" field must be an array of objects, where each object has a "title" and a "step" key. Do NOT return any text or explanation outside of this JSON structure.`,
                },
                {
                    role: 'user',
                    content: `Solve the following problem: ${query}`,
                },
            ],
            response_format: { type: 'json_object' },
        }),
    })

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`OpenAI API error: ${errorBody.error.message}`)
    }

    const result = await response.json()
    const solutionString = result.choices[0].message.content
    const solutionJson = JSON.parse(solutionString)

    // 添加空的visuals数组以匹配前端期望的格式
    const finalSolution: Solution = {
        steps: solutionJson.steps || [],
        visuals: [], 
    }

    return new Response(JSON.stringify(finalSolution), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in OpenAI Solver function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 
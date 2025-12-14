import OpenAI from 'openai';

// ============================================================================
// AI CLIENT (OpenAI)
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawResponse?: string;
}

/**
 * Run an AI agent with a system prompt and user message.
 * Expects the agent to return valid JSON.
 */
export async function runAgent<T>(
  systemPrompt: string,
  userPrompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<AgentResult<T>> {
  const { maxTokens = 4096, temperature = 0.7 } = options;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content || '';

    // Parse JSON from response
    const parsed = extractJSON<T>(text);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error,
        rawResponse: text,
      };
    }

    return {
      success: true,
      data: parsed.data,
      rawResponse: text,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract JSON from a string that might contain markdown code blocks or plain JSON
 */
function extractJSON<T>(text: string): { success: boolean; data?: T; error?: string } {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      return { success: true, data: JSON.parse(codeBlockMatch[1].trim()) };
    } catch {
      // Continue to try other methods
    }
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    } catch {
      // Continue
    }
  }

  // Try to parse the entire response as JSON
  try {
    return { success: true, data: JSON.parse(text.trim()) };
  } catch {
    return {
      success: false,
      error: 'Could not extract valid JSON from response',
    };
  }
}

/**
 * Run an agent with revision capability - if feedback is provided,
 * include the previous output and feedback in the prompt
 */
export async function runAgentWithRevision<T>(
  systemPrompt: string,
  userPrompt: string,
  previousOutput?: T,
  feedback?: string,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<AgentResult<T>> {
  let finalPrompt = userPrompt;

  if (previousOutput && feedback) {
    finalPrompt = `${userPrompt}

---

REVISION REQUEST:
Here was my previous output:
\`\`\`json
${JSON.stringify(previousOutput, null, 2)}
\`\`\`

The user provided this feedback:
"${feedback}"

Please revise the output based on this feedback. Keep what works, fix what doesn't.`;
  }

  return runAgent<T>(systemPrompt, finalPrompt, options);
}

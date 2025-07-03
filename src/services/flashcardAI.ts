/**
 * AI Flashcard Generator Service
 * This service handles the interaction with the OpenAI API to generate educational flashcards.
 */
import { getAIModel } from '../config/aiModel';

export interface GeneratedAICard {
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
  tags: string[];
  card_type: 'basic' | 'cloze';
  confidence: number;
}

class FlashcardAI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Generates a single flashcard by calling the OpenAI API.
   * @param prompt - The detailed prompt instructing the AI on how to generate the card.
   * @returns A promise that resolves to the generated card data.
   */
  async generateFlashcard(prompt: string): Promise<GeneratedAICard> {
    try {
      const response = await this.callOpenAI(prompt);
      const parsedResponse = this.parseResponse(response);
      return parsedResponse;
    } catch (error) {
      console.error('Failed to generate flashcard from AI:', error);
      // In case of an error, return a fallback card to avoid crashing the UI
      return this.getFallbackCard();
    }
  }

  /**
   * Calls the OpenAI API with the given prompt.
   * @param prompt - The prompt to send to the AI.
   * @returns A promise that resolves to the AI's response text.
   */
  private async callOpenAI(prompt: string, options: { max_tokens?: number } = {}): Promise<string> {
    const aiModelId = getAIModel(); // Gets the currently selected AI model ID

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: aiModelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: options.max_tokens || 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parses and validates the JSON response from the AI.
   * @param response - The JSON string response from the AI.
   * @returns The parsed and validated card object.
   */
  private parseResponse(response: string): GeneratedAICard {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response did not contain a valid JSON object.");
      }
      const parsed = JSON.parse(jsonMatch[0]);

      // Basic validation to ensure required fields are present
      if (!parsed.question || !parsed.answer || !Array.isArray(parsed.tags)) {
        throw new Error("AI response is missing required fields (question, answer, tags).");
      }

      return {
        question: parsed.question,
        answer: parsed.answer,
        hint: parsed.hint || undefined,
        explanation: parsed.explanation || undefined,
        tags: parsed.tags,
        card_type: parsed.card_type === 'cloze' ? 'cloze' : 'basic',
        confidence: parsed.confidence || 0.8,
      };
    } catch (error: any) {
      console.error('Failed to parse AI response:', error, 'Raw response:', response);
      throw new Error(`AI returned an invalid structure. ${error.message}`);
    }
  }

  /**
   * Extracts key topics from a large text document. This is a low-cost initial call.
   * @param textContent - The full text content from the user's document.
   * @returns A promise that resolves to an array of topic strings.
   */
  async extractTopicsFromDocument(textContent: string): Promise<string[]> {
    const prompt = `
You are an AI assistant skilled at academic analysis. Read through the following document text and identify the top 5-10 main themes, topics, or key sections discussed within it. Do NOT summarize the text. Do NOT generate flashcards.

**Source Text (first 4000 characters):**
---
${textContent.substring(0, 4000)}
---

**Your Instructions:**
Return the output as a SINGLE JSON object with a key "topics", which contains an array of the identified topic strings. Be concise and accurate. Each topic should be a short, descriptive phrase.

**Example JSON structure:**
{
  "topics": [
    "The Causes of World War I",
    "Key Battles on the Western Front",
    "The Role of Technology in the War",
    "The Treaty of Versailles and its Consequences",
    "The Economic Impact on Europe"
  ]
}
`;
    try {
      const response = await this.callOpenAI(prompt, { max_tokens: 500 }); // Low max_tokens for this call
      const parsed = JSON.parse(response);
      if (parsed.topics && Array.isArray(parsed.topics)) {
        return parsed.topics;
      }
      throw new Error("AI response did not contain a 'topics' array.");
    } catch (error) {
      console.error('Failed to extract topics from document:', error);
      // Return a generic topic as a fallback to allow the user to proceed
      return ["General Document Review"];
    }
  }

  /**
   * Generates a set of flashcards from a large text document, focusing on specific topics.
   * @param textContent - The full text content from the user's document.
   * @param topics - The specific topics to focus on when generating cards.
   * @param count - The desired number of flashcards.
   * @returns A promise that resolves to an array of generated cards.
   */
  async generateFlashcardsFromDocument(textContent: string, topics: string[], count: number = 10): Promise<GeneratedAICard[]> {
    const prompt = `
As an expert instructional designer, your task is to analyze the provided document text and generate a set of ${count} high-quality, university-level flashcards.

**Crucially, you must focus *only* on the following specified topics:**
---
**Topics to Cover:**
- ${topics.join('\n- ')}
---

**Full Document Text (for context):**
---
${textContent.substring(0, 8000)}
---

**Your Instructions:**
1.  **Targeted Generation:** Generate flashcards *only* for the concepts, definitions, and key information related to the "Topics to Cover". Ignore other information in the document.
2.  **Generate Diverse Cards:** Create a mix of 'Question/Answer' and 'Cloze Deletion' (fill-in-the-blank) flashcards.
3.  **Adhere to Quality Standards:**
    *   **Atomicity:** Each card should test only ONE single, atomic concept.
    *   **Clarity:** Questions must be unambiguous and clear.
    *   **Meaningful Cloze:** For cloze deletions, the blanked-out word must be a critical, non-obvious term.
4.  **Format:** Return the output as a SINGLE JSON object with a key "flashcards" which contains an array of the generated card objects. Each card object must have the fields: \`question\`, \`answer\`, \`card_type\`, \`hint\`, \`explanation\`, and \`tags\`.

**Example JSON structure:**
{
  "flashcards": [
    {
      "question": "What treaty officially ended World War I?",
      "answer": "The Treaty of Versailles",
      "card_type": "basic",
      "hint": "It was signed in a famous hall of mirrors.",
      "explanation": "The Treaty of Versailles, signed in 1919, imposed heavy reparations on Germany and redrew the map of Europe, contributing to the conditions that led to World War II.",
      "tags": ["World War I", "Treaty of Versailles"]
    }
  ]
}
`;
    try {
      const response = await this.callOpenAI(prompt, { max_tokens: 2048 });
      const parsed = JSON.parse(response);
      if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        return parsed.flashcards;
      }
      throw new Error("AI response did not contain a 'flashcards' array.");
    } catch (error) {
      console.error('Failed to generate flashcards from document:', error);
      throw error; // Re-throw the error to be handled by the calling component
    }
  }

  /**
   * Provides a fallback flashcard in case of an API or parsing error.
   * @returns A default fallback card.
   */
  private getFallbackCard(): GeneratedAICard {
    return {
      question: "Error: AI Failed to Generate Card",
      answer: "Could not generate a valid card due to an internal error. Please try again or adjust your topic.",
      hint: "This is a fallback card.",
      explanation: "This card is displayed because the AI service failed to return a valid response. This could be due to an API error, network issue, or invalid configuration.",
      tags: ["error", "fallback"],
      card_type: 'basic',
      confidence: 0,
    };
  }
}

export const flashcardAI = new FlashcardAI(); 
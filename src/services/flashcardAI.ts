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
  private async callOpenAI(prompt: string): Promise<string> {
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
        max_tokens: 500,
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
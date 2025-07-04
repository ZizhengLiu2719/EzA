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
  private async callOpenAI(prompt: string, options: { max_tokens?: number; temperature?: number } = {}): Promise<string> {
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
        temperature: options.temperature || 0.7,
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
   * Robust JSON parser that can handle malformed AI responses
   * @param response - The response string from AI
   * @returns Parsed JSON object or throws an error
   */
  private parseRobustJSON(response: string): any {
    try {
      // First, try direct parsing
      return JSON.parse(response);
    } catch (firstError: any) {
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON object found in response");
        }
        
        let jsonStr = jsonMatch[0];
        
        // Common fixes for malformed JSON
        // 1. Fix unescaped newlines in strings
        jsonStr = jsonStr.replace(/\\n/g, '\\\\n');
        
        // 2. Fix unescaped quotes in strings (this is tricky, we'll be conservative)
        // Replace unescaped quotes that are clearly in the middle of string values
        jsonStr = jsonStr.replace(/"([^"]*)"([^"]*)"([^"]*)":/g, '"$1\\"$2\\"$3":');
        
        // 3. Fix trailing commas
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        
        // 4. Fix missing quotes around property names
        jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        
        // 5. Fix unterminated strings by adding closing quotes before newlines/end
        const lines = jsonStr.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          // Check if line has an opening quote but no closing quote
          const openQuotes = (line.match(/"/g) || []).length;
          if (openQuotes % 2 === 1 && !line.endsWith('"') && !line.endsWith('",')) {
            // Try to fix by adding closing quote before comma or end
            if (line.endsWith(',')) {
              lines[i] = line.slice(0, -1) + '",';
            } else {
              lines[i] = line + '"';
            }
          }
        }
        jsonStr = lines.join('\n');
        
        return JSON.parse(jsonStr);
      } catch (secondError: any) {
        console.error('Failed to parse JSON even after cleanup attempts');
        console.error('Original error:', firstError);
        console.error('Cleanup error:', secondError);
        console.error('Raw response:', response);
        throw new Error(`Unable to parse AI response as JSON: ${firstError.message}`);
      }
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

**IMPORTANT:** Ensure your JSON is properly formatted with:
- All property names in double quotes
- All string values properly escaped
- No trailing commas
- No unescaped newlines in strings

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
      const parsed = this.parseRobustJSON(response);
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
   * Validates and cleans up generated flashcards
   * @param cards - Raw cards from AI
   * @returns Cleaned and validated cards
   */
  private validateAndCleanCards(cards: any[]): GeneratedAICard[] {
    return cards.map((card, index) => {
      // Ensure all required fields exist with fallbacks
      const cleanCard: GeneratedAICard = {
        question: card.question || `Generated Question ${index + 1}`,
        answer: card.answer || "Answer not provided",
        hint: card.hint || undefined,
        explanation: card.explanation || undefined,
        tags: Array.isArray(card.tags) ? card.tags : ["generated"],
        card_type: (card.card_type === 'cloze' || card.card_type === 'basic') ? card.card_type : 'basic',
        confidence: typeof card.confidence === 'number' ? card.confidence : 0.8,
      };

      // Clean up text fields - remove excessive whitespace and fix encoding
      cleanCard.question = cleanCard.question.trim().replace(/\s+/g, ' ');
      cleanCard.answer = cleanCard.answer.trim().replace(/\s+/g, ' ');
      if (cleanCard.hint) {
        cleanCard.hint = cleanCard.hint.trim().replace(/\s+/g, ' ');
      }
      if (cleanCard.explanation) {
        cleanCard.explanation = cleanCard.explanation.trim().replace(/\s+/g, ' ');
      }

      return cleanCard;
    }).filter(card => 
      // Filter out cards with empty questions or answers
      card.question.length > 0 && card.answer.length > 0
    );
  }

  /**
   * Generates a set of flashcards from a large text document, focusing on specific topics.
   * @param textContent - The full text content from the user's document.
   * @param topics - The specific topics to focus on when generating cards.
   * @param count - The desired number of flashcards.
   * @returns A promise that resolves to an array of generated cards.
   */
  async generateFlashcardsFromDocument(textContent: string, topics: string[], count: number = 10): Promise<GeneratedAICard[]> {
    let attempts = 0;
    const maxAttempts = 3;
    let allGeneratedCards: GeneratedAICard[] = [];

    while (attempts < maxAttempts && allGeneratedCards.length < count) {
      attempts++;
      const remainingCount = count - allGeneratedCards.length;
      
      console.log(`Attempt ${attempts}/${maxAttempts}: Generating ${remainingCount} cards (${allGeneratedCards.length} already generated)`);
      
      const prompt = `
As an expert instructional designer, your task is to analyze the provided document text and generate a set of ${remainingCount} high-quality, university-level flashcards.

**Crucially, you must focus *only* on the following specified topics:**
---
**Topics to Cover:**
- ${topics.join('\n- ')}
---

**Full Document Text (for context):**
---
${textContent.substring(0, 8000)}
---

**IMPORTANT GENERATION REQUIREMENTS:**
1. **Exact Count**: Generate EXACTLY ${remainingCount} flashcards. Do not generate fewer.
2. **Targeted Generation:** Generate flashcards *only* for the concepts, definitions, and key information related to the "Topics to Cover". Ignore other information in the document.
3. **Generate Diverse Cards:** Create a mix of 'Question/Answer' and 'Cloze Deletion' (fill-in-the-blank) flashcards.
4. **Avoid Duplicates:** ${allGeneratedCards.length > 0 ? 'Make sure your questions are different from previously generated ones.' : 'Ensure each card tests a unique concept.'}
5. **Adhere to Quality Standards:**
    *   **Atomicity:** Each card should test only ONE single, atomic concept.
    *   **Clarity:** Questions must be unambiguous and clear.
    *   **Meaningful Cloze:** For cloze deletions, the blanked-out word must be a critical, non-obvious term.
6. **Format:** Return the output as a SINGLE JSON object with a key "flashcards" which contains an array of EXACTLY ${remainingCount} card objects. Each card object must have the fields: \`question\`, \`answer\`, \`card_type\`, \`hint\`, \`explanation\`, and \`tags\`.

**CRITICAL JSON FORMATTING REQUIREMENTS:**
- All property names MUST be in double quotes
- All string values MUST be properly escaped (especially newlines and quotes)
- NO trailing commas
- NO unescaped newlines in string values
- Use \\n for line breaks within strings if needed
- Generate EXACTLY ${remainingCount} cards in the array

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

**Remember: You MUST generate exactly ${remainingCount} cards. If you cannot generate enough unique cards from the content, be more creative with different question types, perspectives, or levels of detail.**
`;

      try {
        const response = await this.callOpenAI(prompt, { 
          max_tokens: Math.min(4096, remainingCount * 200), // Increase tokens for more cards
          temperature: 0.7 + (attempts - 1) * 0.1 // Increase creativity with each attempt
        });
        
        const parsed = this.parseRobustJSON(response);
        if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
          const cleanedCards = this.validateAndCleanCards(parsed.flashcards);
          
          // Filter out duplicates based on question similarity
          const uniqueCards = cleanedCards.filter(newCard => {
            return !allGeneratedCards.some(existingCard => 
              this.areSimilarQuestions(newCard.question, existingCard.question)
            );
          });
          
          console.log(`Generated ${cleanedCards.length} cards, ${uniqueCards.length} are unique`);
          allGeneratedCards.push(...uniqueCards);
          
          // If we got enough cards, break early
          if (allGeneratedCards.length >= count) {
            break;
          }
        } else {
          console.warn(`Attempt ${attempts}: AI response did not contain a 'flashcards' array`);
        }
      } catch (error: any) {
        console.error(`Attempt ${attempts} failed:`, error);
        if (attempts === maxAttempts) {
          // On final attempt failure, provide fallback cards
          const fallbackCardsNeeded = Math.max(1, count - allGeneratedCards.length);
          const fallbackCards: GeneratedAICard[] = Array.from({ length: fallbackCardsNeeded }, (_, i) => ({
            question: `Review Question ${i + 1}: ${topics[i % topics.length]}`,
            answer: `This is a review question about ${topics[i % topics.length]}. Please refer to your study materials for detailed information.`,
            card_type: 'basic' as const,
            hint: `Think about the key concepts related to ${topics[i % topics.length]}.`,
            explanation: `This fallback card was created because the AI service encountered difficulties generating cards from your document. The topic focuses on ${topics[i % topics.length]}.`,
            tags: [topics[i % topics.length]],
            confidence: 0.3,
          }));
          
          allGeneratedCards.push(...fallbackCards);
        }
      }
    }

    // Trim to exact count if we generated too many
    const finalCards = allGeneratedCards.slice(0, count);
    
    console.log(`Final result: Generated ${finalCards.length} out of ${count} requested cards`);
    
    if (finalCards.length === 0) {
      throw new Error("Failed to generate any valid flashcards from the document.");
    }
    
    return finalCards;
  }

  /**
   * Check if two questions are similar to avoid duplicates
   */
  private areSimilarQuestions(q1: string, q2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const norm1 = normalize(q1);
    const norm2 = normalize(q2);
    
    // Check if questions are very similar (more than 70% overlap)
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word) && word.length > 2);
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarity > 0.7;
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

  /**
   * Test method to verify robust JSON parsing (for debugging)
   */
  public testRobustJSONParsing(): void {
    console.log('Testing robust JSON parsing...');
    
    // Test case 1: Valid JSON
    try {
      const validJson = '{"flashcards": [{"question": "Test", "answer": "Test"}]}';
      const result1 = this.parseRobustJSON(validJson);
      console.log('✅ Valid JSON parsed successfully:', result1);
    } catch (e) {
      console.error('❌ Valid JSON failed:', e);
    }

    // Test case 2: JSON with unescaped newlines
    try {
      const malformedJson = `{
        "flashcards": [
          {
            "question": "What is 
            the answer?",
            "answer": "This is the answer"
          }
        ]
      }`;
      const result2 = this.parseRobustJSON(malformedJson);
      console.log('✅ Malformed JSON (newlines) parsed successfully:', result2);
    } catch (e) {
      console.error('❌ Malformed JSON (newlines) failed:', e);
    }

    // Test case 3: JSON with missing quotes around property names
    try {
      const malformedJson2 = `{
        flashcards: [
          {
            question: "What is the answer?",
            answer: "This is the answer"
          }
        ]
      }`;
      const result3 = this.parseRobustJSON(malformedJson2);
      console.log('✅ Malformed JSON (missing quotes) parsed successfully:', result3);
    } catch (e) {
      console.error('❌ Malformed JSON (missing quotes) failed:', e);
    }

    console.log('JSON parsing tests completed.');
  }
}

export const flashcardAI = new FlashcardAI(); 
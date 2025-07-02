import React, { useState } from 'react';
import { BlockMath } from 'react-katex';
import styles from './StemSolver.module.css';

// Define types for the solution data
interface SolutionStep {
  title: string;
  step: string;
}

interface Visual {
  type: 'plot';
  imageUrl: string;
}

interface Solution {
  steps: SolutionStep[];
  visuals: Visual[];
}

// 从环境变量中获取API Key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const StemSolver = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);

  const handleManualSolve = async () => {
    if (!inputText.trim()) {
      setError('Please enter a problem to solve.');
      return;
    }
    await solveProblem(inputText);
  };

  // 辅助函数：将文件转换为Base64
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // 返回结果格式: "data:image/jpeg;base64,LzlqLzRBQ...""
        // 我们只需要逗号后面的部分
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSolution(null);
    setRecognizedText(null);

    if (!OPENAI_API_KEY) {
      setError('OpenAI API Key is not configured in your .env file.');
      setIsLoading(false);
      return;
    }

    try {
      const image_b64 = await toBase64(file);
      
      const ocrResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a highly accurate math OCR tool. Your task is to analyze the user-provided image, identify the mathematical problem or equation within it, and return ONLY the corresponding LaTeX string for that problem. Do not provide any explanation, context, or surrounding text. For example, if you see "x^2 + 5x + 6 = 0", you must return "\\\\x^{\\\\^2} + 5x + 6 = 0".',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${image_b64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (!ocrResponse.ok) {
        const errorBody = await ocrResponse.json();
        throw new Error(`OpenAI API error (OCR): ${errorBody.error.message}`);
      }
      
      const ocrResult = await ocrResponse.json();
      const latex = ocrResult.choices[0].message.content.trim();
      
      setRecognizedText(latex);
      await solveProblem(latex);

    } catch (err: any) {
      console.error('Error with OCR:', err);
      setError('Failed to recognize the problem from the image. Please try again or type it manually.');
      setIsLoading(false);
    }
  };

  const solveProblem = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setSolution(null);
    
    if (!OPENAI_API_KEY) {
      setError('OpenAI API Key is not configured in your .env file.');
      setIsLoading(false);
      return;
    }

    try {
      const solveResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
      });

      if (!solveResponse.ok) {
          const errorBody = await solveResponse.json();
          throw new Error(`OpenAI API error (Solver): ${errorBody.error.message}`);
      }

      const solveResult = await solveResponse.json();
      const solutionString = solveResult.choices[0].message.content;
      const solutionJson = JSON.parse(solutionString);

      const finalSolution: Solution = {
          steps: solutionJson.steps || [],
          visuals: [], 
      };
      
      setSolution(finalSolution);

    } catch (err: any) {
      console.error('Error solving problem:', err);
      setError('Failed to solve the problem. The solver might not support this type of question yet.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className={styles.solverContainer}>
      <div className={styles.inputColumn}>
        <div className={styles.inputCard}>
          <h2 className={styles.cardTitle}>Upload a Problem</h2>
          <p className={styles.cardSubtitle}>Snap a picture of a math, physics, or chemistry problem.</p>
          <input 
            type="file" 
            id="imageUpload" 
            style={{ display: 'none' }} 
            onChange={handleImageUpload}
            accept="image/*"
          />
          <label htmlFor="imageUpload" className={styles.uploadButton}>
            <span className={styles.uploadIcon}>📷</span>
            {isLoading ? 'Processing...' : 'Upload Image'}
          </label>
        </div>
        <div className={styles.inputCard}>
          <h2 className={styles.cardTitle}>Or Type Manually</h2>
          <p className={styles.cardSubtitle}>Use LaTeX for complex formulas.</p>
          <textarea 
            className={styles.manualInput}
            placeholder="e.g., solve x^2 + 5x + 6 = 0"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
          />
          <button onClick={handleManualSolve} className={styles.solveButton} disabled={isLoading}>
            {isLoading ? 'Solving...' : 'Solve'}
          </button>
        </div>
        <div className={styles.historyCard}>
            <h2 className={styles.cardTitle}>History</h2>
            <p className={styles.cardSubtitle}>Your recent problems will appear here.</p>
            <div className={styles.historyList}>
              {/* History items will be mapped here */}
              <div className={styles.historyItem}>No problems solved yet.</div>
            </div>
        </div>
      </div>
      <div className={styles.resultsColumn}>
        <div className={styles.resultsCard}>
          {isLoading && (
            <div className={styles.placeholder}>
              <div className={styles.loader}></div>
              <p>AI is thinking...</p>
            </div>
          )}
          {error && (
             <div className={styles.placeholder}>
              <div className={styles.errorIcon}>⚠️</div>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}
          {!isLoading && !error && !solution && (
             <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>🔬</div>
              <p>Ready to solve your STEM problems!</p>
            </div>
          )}
          {solution && (
            <div className={styles.solutionContainer}>
              {recognizedText && (
                <div className={styles.recognizedProblem}>
                  <h3>Recognized Problem:</h3>
                  <div className={styles.latexDisplay}>
                    <BlockMath math={recognizedText} />
                  </div>
                </div>
              )}
              <h3>Solution Steps:</h3>
              <div className={styles.stepsContainer}>
                {solution.steps.map((item, index) => (
                  <div key={index} className={styles.step}>
                    <div className={styles.stepTitle}>{item.title}</div>
                    <div className={styles.stepContent}>{item.step}</div>
                  </div>
                ))}
              </div>
              {solution.visuals.length > 0 && <h3>Visualizations:</h3>}
              <div className={styles.visualsContainer}>
                {solution.visuals.map((vis, index) => (
                  <img key={index} src={vis.imageUrl} alt={vis.type} className={styles.visualImage} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StemSolver; 
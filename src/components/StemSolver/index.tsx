import { deleteAllProblemHistory, deleteProblemHistory, getProblemHistory, ProblemHistoryItem, saveProblemToHistory } from '@/api/solver'
import { Solution, SolutionStep, Visual } from '@/types'
import { Trash2 } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { BlockMath } from 'react-katex'
import styles from './StemSolver.module.css'

// Define types for the solution data

// 从环境变量中获取API Key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const StemSolver = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [history, setHistory] = useState<ProblemHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ProblemHistoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean
    type: 'single' | 'all'
    id?: string
  }>({ isOpen: false, type: 'single' });

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const fetchedHistory = await getProblemHistory();
      setHistory(fetchedHistory);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      // Non-critical error, so we don't show it to the user
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
    setSelectedHistoryItem(null);

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
      await solveProblem(latex, `data:image/jpeg;base64,${image_b64}`);

    } catch (err: any) {
      console.error('Error with OCR:', err);
      setError('Failed to recognize the problem from the image. Please try again or type it manually.');
      setIsLoading(false);
    }
  };

  const solveProblem = async (query: string, imageUrl: string | null = null) => {
    setIsLoading(true);
    setError(null);
    setSolution(null);
    setSelectedHistoryItem(null);

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

      // Save to history
      try {
        const problem_type = imageUrl ? 'image' : 'text';
        const problem_input = imageUrl || query;
        const problem_title = query.length > 40 ? query.substring(0, 37) + '...' : query;

        const newHistoryItem = await saveProblemToHistory({
          problem_type,
          problem_input,
          ai_solution: { steps: finalSolution.steps, visuals: finalSolution.visuals },
          problem_title
        });

        // Optimistic update
        setHistory(prev => [newHistoryItem, ...prev]);
      } catch (saveError) {
        console.error('Failed to save to history:', saveError);
        // Non-critical, so we just log it
      }

    } catch (err: any) {
      console.error('Error solving problem:', err);
      setError('Failed to solve the problem. The solver might not support this type of question yet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryClick = (item: ProblemHistoryItem) => {
    setSelectedHistoryItem(item);
    setSolution(item.ai_solution);
    setRecognizedText(item.problem_type === 'image' ? item.problem_title : null);
    setInputText(item.problem_type === 'text' ? item.problem_input : '');
    setError(null);
  };

  const handleDeleteSingle = (id: string) => {
    setShowDeleteConfirm({ isOpen: true, type: 'single', id });
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    setShowDeleteConfirm({ isOpen: true, type: 'all' });
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm({ isOpen: false, type: 'single' });
  };

  const handleConfirmDelete = async () => {
    const { type, id } = showDeleteConfirm;

    if (type === 'single' && id) {
      const originalHistory = [...history];
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
        setSolution(null);
      }
      try {
        await deleteProblemHistory(id);
      } catch (err) {
        console.error('Failed to delete history item:', err);
        setHistory(originalHistory);
        alert('Failed to delete item. Please try again.');
      }
    } else if (type === 'all') {
      const originalHistory = [...history];
      setHistory([]);
      setSelectedHistoryItem(null);
      setSolution(null);
      try {
        await deleteAllProblemHistory();
      } catch (err) {
        console.error('Failed to clear history:', err);
        setHistory(originalHistory);
        alert('Failed to clear history. Please try again.');
      }
    }

    handleCancelDelete();
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
          <button onClick={() => handleManualSolve()} className={styles.solveButton} disabled={isLoading}>
            {isLoading && !solution ? 'Solving...' : 'Solve'}
          </button>
        </div>
        <div className={styles.historyCard}>
          <div className={styles.historyCardHeader}>
            <h2 className={styles.cardTitle}>History</h2>
            <button
              onClick={handleClearAll}
              className={styles.clearAllButton}
              disabled={history.length === 0 || historyLoading}
              title="Clear all history"
            >
              <Trash2 size={16} />
              <span>Clear All</span>
            </button>
          </div>
          <p className={styles.cardSubtitle}>Your recent problems will appear here.</p>
          <div className={styles.historyList}>
            {historyLoading ? (
              <div className={styles.historyItem}>Loading history...</div>
            ) : history.length === 0 ? (
              <div className={styles.historyItem}>No problems solved yet.</div>
            ) : (
              history.map(item => (
                <div
                  key={item.id}
                  className={`${styles.historyItem} ${selectedHistoryItem?.id === item.id ? styles.selected : ''}`}
                  onClick={() => handleHistoryClick(item)}
                >
                  <span className={styles.historyIcon}>{item.problem_type === 'image' ? '🖼️' : '✏️'}</span>
                  <span className={styles.historyTitle}>{item.problem_title}</span>
                  <button
                    className={styles.deleteItemButton}
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteSingle(item.id)
                    }}
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
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
              {selectedHistoryItem && selectedHistoryItem.problem_type === 'image' && (
                 <div className={styles.recognizedProblem}>
                    <h3>Problem Image:</h3>
                    <img src={selectedHistoryItem.problem_input} alt="Problem" className={styles.historyImage} />
                  </div>
              )}
              <h3>Solution Steps:</h3>
              <div className={styles.stepsContainer}>
                {solution.steps.map((item: SolutionStep, index: number) => (
                  <div key={index} className={styles.step}>
                    <h4>{index + 1}. {item.title}</h4>
                    <p>{item.step}</p>
                  </div>
                ))}
              </div>
              {solution.visuals && solution.visuals.length > 0 && (
                <div className={styles.visualsContainer}>
                  <h3>Visuals:</h3>
                  {solution.visuals.map((vis: Visual, index: number) => (
                    <div key={index} className={styles.visual}>
                      <img src={vis.imageUrl} alt={`Visual aid ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirm Deletion</h3>
            <p className={styles.modalText}>
              {showDeleteConfirm.type === 'all'
                ? 'Are you sure you want to delete all your history? This action cannot be undone.'
                : 'Are you sure you want to delete this item?'}
            </p>
            <div className={styles.modalActions}>
              <button onClick={handleCancelDelete} className={`${styles.modalButton} ${styles.modalButtonSecondary}`}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className={`${styles.modalButton} ${styles.modalButtonDanger}`}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StemSolver; 
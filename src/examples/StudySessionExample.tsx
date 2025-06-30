/**
 * Study Session Example
 * Demonstrates how to use the new data persistence hooks and APIs
 */

import React, { useState } from 'react';
import {
    useActiveStudySession,
    useConnectionStatus,
    useFlashcardSets,
    useRealtimeFlashcardSets,
    useStudyAnalytics
} from '../hooks';
import { ReviewRating } from '../types/SRSTypes';

const StudySessionExample: React.FC = () => {
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  
  // Use our custom hooks
  const { sets, isLoading: isLoadingSets, createSet } = useFlashcardSets();
  const { 
    session, 
    sessionStats, 
    startSession, 
    completeSession, 
    recordCardReview,
    isStarting 
  } = useActiveStudySession();
  const { analytics } = useStudyAnalytics();
  const connectionStatus = useConnectionStatus();

  // Enable realtime updates for flashcard sets
  useRealtimeFlashcardSets('user-id'); // In real app, get from auth

  const handleStartSession = async () => {
    if (!selectedSetId) return;
    
    try {
      await startSession({
        set_id: selectedSetId,
        mode: 'flashcard',
        config: {
          maxCards: 20,
          showHints: true
        }
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleCardReview = async (rating: ReviewRating) => {
    if (!session) return;

    // Example card - in real app, this would come from your study component
    const exampleCard = {
      id: 'card-1',
      question: 'What is the capital of France?',
      answer: 'Paris',
      set_id: selectedSetId,
      // ... other FSRS properties
    } as any;

    try {
      await recordCardReview(exampleCard, rating, 2500); // 2.5 seconds response time
    } catch (error) {
      console.error('Failed to record review:', error);
    }
  };

  const handleCompleteSession = async () => {
    if (!session || !sessionStats) return;

    try {
      await completeSession({
        cardsReviewed: sessionStats.cardsStudied,
        accuracy: sessionStats.accuracy,
        averageResponseTime: sessionStats.averageResponseTime,
        sessionDuration: sessionStats.duration,
        improvementRate: 0.1, // Calculate based on performance
        masteredCards: 5,
        strugglingCards: 2
      });
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleCreateSampleSet = async () => {
    try {
      await createSet({
        title: 'Sample Flashcard Set',
        description: 'A test set created from the example component',
        subject: 'Example',
        difficulty: 3,
        tags: ['sample', 'test']
      });
    } catch (error) {
      console.error('Failed to create set:', error);
    }
  };

  if (isLoadingSets) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading flashcard sets...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Study Session Example</h1>
      
      {/* Connection Status */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <div className="flex items-center space-x-4">
          <span className={`inline-block w-3 h-3 rounded-full ${
            connectionStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span>
            {connectionStatus.isOnline ? 'Online' : 'Offline'} | 
            {connectionStatus.isConnected ? ' Realtime Connected' : ' Realtime Disconnected'}
          </span>
        </div>
      </div>

      {/* Study Analytics */}
      {analytics && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Your Study Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.total_sessions}
              </div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(analytics.overall_accuracy * 100)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.current_streak}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(analytics.total_study_time / 3600)}h
              </div>
              <div className="text-sm text-gray-600">Study Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Flashcard Sets */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Flashcard Sets</h2>
          <button
            onClick={handleCreateSampleSet}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Sample Set
          </button>
        </div>

        {sets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No flashcard sets found. Create one to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {sets.map((set) => (
              <div
                key={set.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSetId === set.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSetId(set.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{set.title}</h3>
                    <p className="text-sm text-gray-600">{set.description}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {set.card_count} cards • {Math.round(set.mastery_level * 100)}% mastery
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-orange-600">
                      {set.due_cards_count || 0} due
                    </div>
                    <div className="text-xs text-gray-500">
                      {set.new_cards_count || 0} new
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study Session Controls */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Study Session</h2>
        
        {!session ? (
          <div className="space-y-4">
            <p className="text-gray-600">Select a flashcard set and start studying!</p>
            <button
              onClick={handleStartSession}
              disabled={!selectedSetId || isStarting}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starting...' : 'Start Study Session'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Active Session</h3>
              {sessionStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-lg font-bold">{sessionStats.cardsStudied}</div>
                    <div className="text-sm text-gray-600">Cards Studied</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {Math.round(sessionStats.accuracy * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{sessionStats.currentStreak}</div>
                    <div className="text-sm text-gray-600">Current Streak</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {Math.floor(sessionStats.duration / 60)}:{(sessionStats.duration % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                </div>
              )}
            </div>

            {/* Example Review Buttons */}
            <div className="space-y-2">
              <p className="font-medium">Rate your answer:</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCardReview(1)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Again (1)
                </button>
                <button
                  onClick={() => handleCardReview(2)}
                  className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Hard (2)
                </button>
                <button
                  onClick={() => handleCardReview(3)}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Good (3)
                </button>
                <button
                  onClick={() => handleCardReview(4)}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Easy (4)
                </button>
              </div>
            </div>

            <button
              onClick={handleCompleteSession}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Complete Session
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">How to Use This Example</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
          <li>Create a sample flashcard set using the "Create Sample Set" button</li>
          <li>Select a flashcard set by clicking on it</li>
          <li>Start a study session</li>
          <li>Use the rating buttons to simulate reviewing cards</li>
          <li>Complete the session to see how data is persisted</li>
          <li>Check the study analytics to see your progress</li>
        </ol>
      </div>
    </div>
  );
};

export default StudySessionExample; 
/**
 * useFlashcardSets Hook
 * Manages flashcard sets state, operations, and caching
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    createFlashcardSet,
    CreateFlashcardSetData,
    deleteFlashcardSet,
    FlashcardSetWithStats,
    getFlashcardSet,
    getFlashcardSets,
    getPublicFlashcardSets,
    updateFlashcardSet,
    UpdateFlashcardSetData
} from '../api/flashcards';
import { useToast } from './useToast';

// ============================================================================
// Hook for managing all flashcard sets
// ============================================================================

export const useFlashcardSets = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for user's flashcard sets
  const {
    data: sets = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['flashcard-sets'],
    queryFn: getFlashcardSets,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onError: (error: Error) => {
      toast({
        title: 'Failed to load flashcard sets',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Create set mutation
  const createSetMutation = useMutation({
    mutationFn: createFlashcardSet,
    onSuccess: (newSet) => {
      queryClient.setQueryData(['flashcard-sets'], (old: FlashcardSetWithStats[] = []) => [
        newSet,
        ...old
      ]);
      
      toast({
        title: 'Flashcard set created',
        description: `"${newSet.title}" has been created successfully.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create flashcard set',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update set mutation
  const updateSetMutation = useMutation({
    mutationFn: ({ setId, updates }: { setId: string; updates: UpdateFlashcardSetData }) =>
      updateFlashcardSet(setId, updates),
    onSuccess: (updatedSet) => {
      queryClient.setQueryData(['flashcard-sets'], (old: FlashcardSetWithStats[] = []) =>
        old.map(set => set.id === updatedSet.id ? { ...set, ...updatedSet } : set)
      );
      
      queryClient.setQueryData(['flashcard-set', updatedSet.id], updatedSet);
      
      toast({
        title: 'Flashcard set updated',
        description: `"${updatedSet.title}" has been updated successfully.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update flashcard set',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete set mutation
  const deleteSetMutation = useMutation({
    mutationFn: deleteFlashcardSet,
    onSuccess: (_, setId) => {
      queryClient.setQueryData(['flashcard-sets'], (old: FlashcardSetWithStats[] = []) =>
        old.filter(set => set.id !== setId)
      );
      
      queryClient.removeQueries(['flashcard-set', setId]);
      queryClient.removeQueries(['flashcards', setId]);
      
      toast({
        title: 'Flashcard set deleted',
        description: 'The flashcard set has been deleted successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete flashcard set',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Computed values
  const statistics = useMemo(() => {
    const totalSets = sets.length;
    const totalCards = sets.reduce((sum, set) => sum + set.card_count, 0);
    const totalDueCards = sets.reduce((sum, set) => sum + (set.due_cards_count || 0), 0);
    const averageMastery = sets.length > 0 
      ? sets.reduce((sum, set) => sum + set.mastery_level, 0) / sets.length 
      : 0;

    const setsBySubject = sets.reduce((acc, set) => {
      const subject = set.subject || 'Uncategorized';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentlyStudied = sets
      .filter(set => set.last_studied)
      .sort((a, b) => new Date(b.last_studied!).getTime() - new Date(a.last_studied!).getTime())
      .slice(0, 5);

    return {
      totalSets,
      totalCards,
      totalDueCards,
      averageMastery,
      setsBySubject,
      recentlyStudied
    };
  }, [sets]);

  // Actions
  const createSet = useCallback((setData: CreateFlashcardSetData) => {
    return createSetMutation.mutateAsync(setData);
  }, [createSetMutation]);

  const updateSet = useCallback((setId: string, updates: UpdateFlashcardSetData) => {
    return updateSetMutation.mutateAsync({ setId, updates });
  }, [updateSetMutation]);

  const deleteSet = useCallback((setId: string) => {
    return deleteSetMutation.mutateAsync(setId);
  }, [deleteSetMutation]);

  const refreshSets = useCallback(() => {
    return refetch();
  }, [refetch]);

  return {
    // Data
    sets,
    statistics,
    
    // State
    isLoading,
    error,
    isCreating: createSetMutation.isLoading,
    isUpdating: updateSetMutation.isLoading,
    isDeleting: deleteSetMutation.isLoading,
    
    // Actions
    createSet,
    updateSet,
    deleteSet,
    refreshSets
  };
};

// ============================================================================
// Hook for managing a single flashcard set
// ============================================================================

export const useFlashcardSet = (setId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: set,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['flashcard-set', setId],
    queryFn: () => getFlashcardSet(setId),
    enabled: !!setId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: Error) => {
      toast({
        title: 'Failed to load flashcard set',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update set mutation (specific to this set)
  const updateMutation = useMutation({
    mutationFn: (updates: UpdateFlashcardSetData) => updateFlashcardSet(setId, updates),
    onSuccess: (updatedSet) => {
      queryClient.setQueryData(['flashcard-set', setId], updatedSet);
      queryClient.setQueryData(['flashcard-sets'], (old: FlashcardSetWithStats[] = []) =>
        old.map(s => s.id === setId ? { ...s, ...updatedSet } : s)
      );
    }
  });

  const updateSet = useCallback((updates: UpdateFlashcardSetData) => {
    return updateMutation.mutateAsync(updates);
  }, [updateMutation]);

  return {
    set,
    isLoading,
    error,
    isUpdating: updateMutation.isLoading,
    updateSet,
    refetch
  };
};

// ============================================================================
// Hook for public flashcard sets
// ============================================================================

export const usePublicFlashcardSets = (
  subject?: string,
  difficulty?: number,
  enabled: boolean = true
) => {
  const [page, setPage] = useState(0);
  const [allSets, setAllSets] = useState<FlashcardSetWithStats[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 20;
  const offset = page * pageSize;

  const {
    data: pageSets = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['public-flashcard-sets', subject, difficulty, page],
    queryFn: () => getPublicFlashcardSets(subject, difficulty, pageSize, offset),
    enabled: enabled && hasMore,
    staleTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
    onSuccess: (data) => {
      if (page === 0) {
        setAllSets(data);
      } else {
        setAllSets(prev => [...prev, ...data]);
      }
      
      if (data.length < pageSize) {
        setHasMore(false);
      }
    }
  });

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  const resetPagination = useCallback(() => {
    setPage(0);
    setAllSets([]);
    setHasMore(true);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [subject, difficulty, resetPagination]);

  return {
    sets: allSets,
    isLoading,
    error,
    hasMore,
    loadMore,
    resetPagination,
    refetch
  };
};

// ============================================================================
// Hook for flashcard set search and filtering
// ============================================================================

export const useFlashcardSetSearch = (initialSets: FlashcardSetWithStats[] = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'updated_at' | 'mastery_level' | 'card_count'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedSets = useMemo(() => {
    let filtered = initialSets;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(set =>
        set.title.toLowerCase().includes(term) ||
        set.description?.toLowerCase().includes(term) ||
        set.subject?.toLowerCase().includes(term) ||
        set.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter(set => set.subject === selectedSubject);
    }

    // Filter by difficulty
    if (selectedDifficulty !== null) {
      filtered = filtered.filter(set => set.difficulty === selectedDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        case 'mastery_level':
          aValue = a.mastery_level;
          bValue = b.mastery_level;
          break;
        case 'card_count':
          aValue = a.card_count;
          bValue = b.card_count;
          break;
        default:
          aValue = a.updated_at;
          bValue = b.updated_at;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [initialSets, searchTerm, selectedSubject, selectedDifficulty, sortBy, sortOrder]);

  // Get unique subjects for filter dropdown
  const availableSubjects = useMemo(() => {
    const subjects = new Set(
      initialSets
        .map(set => set.subject)
        .filter(Boolean)
    );
    return Array.from(subjects).sort();
  }, [initialSets]);

  // Search statistics
  const searchStats = useMemo(() => ({
    totalSets: initialSets.length,
    filteredSets: filteredAndSortedSets.length,
    isFiltered: searchTerm !== '' || selectedSubject !== '' || selectedDifficulty !== null
  }), [initialSets.length, filteredAndSortedSets.length, searchTerm, selectedSubject, selectedDifficulty]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedSubject('');
    setSelectedDifficulty(null);
  }, []);

  return {
    // Filtered data
    sets: filteredAndSortedSets,
    availableSubjects,
    searchStats,
    
    // Filter state
    searchTerm,
    selectedSubject,
    selectedDifficulty,
    sortBy,
    sortOrder,
    
    // Filter actions
    setSearchTerm,
    setSelectedSubject,
    setSelectedDifficulty,
    setSortBy,
    setSortOrder,
    clearFilters
  };
};

// ============================================================================
// Utility hook for set operations
// ============================================================================

export const useFlashcardSetOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const duplicateSet = useCallback(async (originalSetId: string, newTitle?: string) => {
    try {
      // Get original set with cards
      const originalSet = await getFlashcardSet(originalSetId);
      
      // Create new set
      const newSet = await createFlashcardSet({
        title: newTitle || `${originalSet.title} (Copy)`,
        description: originalSet.description,
        subject: originalSet.subject,
        difficulty: originalSet.difficulty,
        tags: originalSet.tags,
        visibility: 'private'
      });

      // Note: Cards would need to be duplicated separately
      // This would require additional API endpoints

      queryClient.invalidateQueries(['flashcard-sets']);
      
      toast({
        title: 'Set duplicated successfully',
        description: `"${newSet.title}" has been created.`
      });

      return newSet;
    } catch (error: any) {
      toast({
        title: 'Failed to duplicate set',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  }, [queryClient, toast]);

  const exportSet = useCallback(async (setId: string) => {
    try {
      const set = await getFlashcardSet(setId);
      
      // Create export data
      const exportData = {
        meta: {
          title: set.title,
          description: set.description,
          subject: set.subject,
          difficulty: set.difficulty,
          tags: set.tags,
          exported_at: new Date().toISOString(),
          version: '1.0'
        },
        cards: [] // Would need to fetch cards separately
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${set.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Set exported',
        description: 'The flashcard set has been downloaded.'
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);

  return {
    duplicateSet,
    exportSet
  };
};

// ============================================================================
// Type exports
// ============================================================================

export type { CreateFlashcardSetData, FlashcardSetWithStats, UpdateFlashcardSetData };


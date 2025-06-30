/**
 * useRealtimeSync Hook
 * Manages real-time synchronization with Supabase and offline state management
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../api/supabase';
import { useToast } from './useToast';

// ============================================================================
// Types
// ============================================================================

interface ConnectionState {
  isOnline: boolean;
  isConnected: boolean;
  lastSyncTime: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: Date;
  retries: number;
}

interface RealtimeSubscription {
  table: string;
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
  queryKey: string[];
}

// ============================================================================
// Main Realtime Sync Hook
// ============================================================================

export const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    isConnected: false,
    lastSyncTime: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  });
  
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const subscriptionsRef = useRef<RealtimeSubscription[]>([]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setConnectionState(prev => ({ ...prev, isOnline: true, reconnectAttempts: 0 }));
      // Process sync queue when coming back online
      processSyncQueue();
    };

    const handleOffline = () => {
      setConnectionState(prev => ({ ...prev, isOnline: false, isConnected: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize connection status monitoring
  useEffect(() => {
    const checkConnection = () => {
      const isConnected = supabase.realtime.isConnected();
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected,
        lastSyncTime: isConnected ? new Date() : prev.lastSyncTime
      }));
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  // Process offline sync queue
  const processSyncQueue = useCallback(async () => {
    if (!connectionState.isOnline || syncQueue.length === 0) return;

    const itemsToProcess = [...syncQueue];
    setSyncQueue([]);

    for (const item of itemsToProcess) {
      try {
        // Execute the queued operation
        switch (item.operation) {
          case 'INSERT':
            await supabase.from(item.table).insert(item.data);
            break;
          case 'UPDATE':
            await supabase.from(item.table).update(item.data).eq('id', item.data.id);
            break;
          case 'DELETE':
            await supabase.from(item.table).delete().eq('id', item.data.id);
            break;
        }

        toast({
          title: 'Sync completed',
          description: `${item.operation} operation synced successfully.`
        });
      } catch (error: any) {
        // If operation fails, add back to queue with retry count
        if (item.retries < 3) {
          setSyncQueue(prev => [...prev, { ...item, retries: item.retries + 1 }]);
        } else {
          toast({
            title: 'Sync failed',
            description: `Failed to sync ${item.operation} after 3 attempts.`,
            variant: 'destructive'
          });
        }
      }
    }
  }, [connectionState.isOnline, syncQueue, toast]);

  // Add item to sync queue (for offline operations)
  const addToSyncQueue = useCallback((
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any
  ) => {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      table,
      operation,
      data,
      timestamp: new Date(),
      retries: 0
    };

    setSyncQueue(prev => [...prev, item]);

    // If online, try to process immediately
    if (connectionState.isOnline) {
      setTimeout(processSyncQueue, 100);
    }
  }, [connectionState.isOnline, processSyncQueue]);

  // Subscribe to realtime changes
  const subscribe = useCallback((subscription: RealtimeSubscription) => {
    const channelKey = `${subscription.table}-${subscription.event}-${subscription.filter || 'all'}`;
    
    // Don't create duplicate subscriptions
    if (channelsRef.current.has(channelKey)) {
      return;
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: subscription.event,
          schema: 'public',
          table: subscription.table,
          filter: subscription.filter
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          handleRealtimeChange(payload, subscription.queryKey);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState(prev => ({ ...prev, isConnected: true }));
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionState(prev => ({ ...prev, isConnected: false }));
          toast({
            title: 'Connection error',
            description: 'Realtime connection lost. Trying to reconnect...',
            variant: 'destructive'
          });
        }
      });

    channelsRef.current.set(channelKey, channel);
    subscriptionsRef.current.push(subscription);
  }, [toast]);

  // Unsubscribe from realtime changes
  const unsubscribe = useCallback((table: string, event?: string) => {
    const keysToRemove: string[] = [];
    
    channelsRef.current.forEach((channel, key) => {
      if (key.startsWith(`${table}-`) && (!event || key.includes(`-${event}-`))) {
        channel.unsubscribe();
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      channelsRef.current.delete(key);
    });

    subscriptionsRef.current = subscriptionsRef.current.filter(
      sub => sub.table !== table || (event && sub.event !== event)
    );
  }, []);

  // Handle realtime changes
  const handleRealtimeChange = useCallback((
    payload: RealtimePostgresChangesPayload<any>,
    queryKey: string[]
  ) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new record to existing cache
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (Array.isArray(oldData)) {
            return [newRecord, ...oldData];
          }
          return oldData;
        });
        break;

      case 'UPDATE':
        // Update existing record in cache
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map((item: any) => 
              item.id === newRecord.id ? { ...item, ...newRecord } : item
            );
          }
          return newRecord;
        });
        break;

      case 'DELETE':
        // Remove record from cache
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.filter((item: any) => item.id !== oldRecord.id);
          }
          return null;
        });
        break;
    }

    // Invalidate related queries to ensure consistency
    queryClient.invalidateQueries(queryKey);
  }, [queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(channel => {
        channel.unsubscribe();
      });
      channelsRef.current.clear();
      subscriptionsRef.current = [];
    };
  }, []);

  return {
    connectionState,
    syncQueue,
    subscribe,
    unsubscribe,
    addToSyncQueue,
    processSyncQueue
  };
};

// ============================================================================
// Specific Realtime Hooks
// ============================================================================

/**
 * Hook for realtime flashcard sets updates
 */
export const useRealtimeFlashcardSets = (userId?: string) => {
  const { subscribe, unsubscribe } = useRealtimeSync();

  useEffect(() => {
    if (!userId) return;

    const subscription: RealtimeSubscription = {
      table: 'flashcard_sets',
      event: '*',
      filter: `user_id=eq.${userId}`,
      queryKey: ['flashcard-sets']
    };

    subscribe(subscription);

    return () => {
      unsubscribe('flashcard_sets');
    };
  }, [userId, subscribe, unsubscribe]);
};

/**
 * Hook for realtime flashcards updates in a specific set
 */
export const useRealtimeFlashcards = (setId: string) => {
  const { subscribe, unsubscribe } = useRealtimeSync();

  useEffect(() => {
    if (!setId) return;

    const subscription: RealtimeSubscription = {
      table: 'flashcards',
      event: '*',
      filter: `set_id=eq.${setId}`,
      queryKey: ['flashcards', setId]
    };

    subscribe(subscription);

    return () => {
      unsubscribe('flashcards');
    };
  }, [setId, subscribe, unsubscribe]);
};

/**
 * Hook for realtime study sessions updates
 */
export const useRealtimeStudySessions = (userId?: string) => {
  const { subscribe, unsubscribe } = useRealtimeSync();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to study sessions
    const sessionsSubscription: RealtimeSubscription = {
      table: 'study_sessions',
      event: '*',
      filter: `user_id=eq.${userId}`,
      queryKey: ['study-sessions']
    };

    // Subscribe to review logs
    const reviewLogsSubscription: RealtimeSubscription = {
      table: 'review_logs',
      event: '*',
      filter: `user_id=eq.${userId}`,
      queryKey: ['review-logs']
    };

    subscribe(sessionsSubscription);
    subscribe(reviewLogsSubscription);

    return () => {
      unsubscribe('study_sessions');
      unsubscribe('review_logs');
    };
  }, [userId, subscribe, unsubscribe]);
};

// ============================================================================
// Offline-First CRUD Operations
// ============================================================================

/**
 * Hook for offline-first operations
 */
export const useOfflineOperations = () => {
  const { connectionState, addToSyncQueue } = useRealtimeSync();
  const queryClient = useQueryClient();

  const performOperation = useCallback(async (
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any,
    queryKey: string[],
    optimisticUpdate?: (oldData: any) => any
  ) => {
    // Perform optimistic update immediately
    if (optimisticUpdate) {
      queryClient.setQueryData(queryKey, optimisticUpdate);
    }

    if (connectionState.isOnline && connectionState.isConnected) {
      // If online, perform operation immediately
      try {
        let result;
        switch (operation) {
          case 'INSERT':
            result = await supabase.from(table).insert(data).select().single();
            break;
          case 'UPDATE':
            result = await supabase.from(table).update(data).eq('id', data.id).select().single();
            break;
          case 'DELETE':
            result = await supabase.from(table).delete().eq('id', data.id);
            break;
        }
        
        // Update cache with real data
        if (result.data && operation !== 'DELETE') {
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (Array.isArray(oldData)) {
              return oldData.map(item => 
                item.id === result.data.id ? result.data : item
              );
            }
            return result.data;
          });
        }
        
        return result.data;
      } catch (error) {
        // If operation fails, add to queue and revert optimistic update
        addToSyncQueue(table, operation, data);
        queryClient.invalidateQueries(queryKey);
        throw error;
      }
    } else {
      // If offline, add to sync queue
      addToSyncQueue(table, operation, data);
      return data; // Return optimistic data
    }
  }, [connectionState, addToSyncQueue, queryClient]);

  return {
    performOperation,
    isOnline: connectionState.isOnline,
    isConnected: connectionState.isConnected
  };
};

// ============================================================================
// Connection Status Hook
// ============================================================================

/**
 * Hook for monitoring connection status with user-friendly notifications
 */
export const useConnectionStatus = () => {
  const { connectionState } = useRealtimeSync();
  const { toast } = useToast();
  const [hasShownOfflineMessage, setHasShownOfflineMessage] = useState(false);
  const [hasShownOnlineMessage, setHasShownOnlineMessage] = useState(false);

  useEffect(() => {
    if (!connectionState.isOnline && !hasShownOfflineMessage) {
      toast({
        title: 'You\'re offline',
        description: 'Your changes will be saved and synced when you\'re back online.',
        variant: 'destructive'
      });
      setHasShownOfflineMessage(true);
      setHasShownOnlineMessage(false);
    } else if (connectionState.isOnline && hasShownOfflineMessage && !hasShownOnlineMessage) {
      toast({
        title: 'You\'re back online',
        description: 'Syncing your changes now...'
      });
      setHasShownOnlineMessage(true);
      setHasShownOfflineMessage(false);
    }
  }, [connectionState.isOnline, hasShownOfflineMessage, hasShownOnlineMessage, toast]);

  return {
    isOnline: connectionState.isOnline,
    isConnected: connectionState.isConnected,
    lastSyncTime: connectionState.lastSyncTime,
    reconnectAttempts: connectionState.reconnectAttempts
  };
};

// ============================================================================
// Sync Status Component Hook
// ============================================================================

/**
 * Hook for displaying sync status in UI
 */
export const useSyncStatus = () => {
  const { connectionState, syncQueue } = useRealtimeSync();

  const status = useMemo(() => {
    if (!connectionState.isOnline) {
      return {
        type: 'offline' as const,
        message: 'Offline',
        description: `${syncQueue.length} items queued for sync`,
        color: 'orange'
      };
    }

    if (!connectionState.isConnected) {
      return {
        type: 'connecting' as const,
        message: 'Connecting...',
        description: 'Establishing realtime connection',
        color: 'yellow'
      };
    }

    if (syncQueue.length > 0) {
      return {
        type: 'syncing' as const,
        message: 'Syncing',
        description: `${syncQueue.length} items pending`,
        color: 'blue'
      };
    }

    return {
      type: 'synced' as const,
      message: 'Synced',
      description: 'All changes saved',
      color: 'green'
    };
  }, [connectionState, syncQueue.length]);

  return status;
};

export type { ConnectionState, RealtimeSubscription, SyncQueueItem };


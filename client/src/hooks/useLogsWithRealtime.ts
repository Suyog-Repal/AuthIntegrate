// 🔥 PHASE 3: Custom hook for managing logs with filters and real-time updates
import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import type { AccessLogWithUser } from '@shared/schema';

interface LogFilters {
  date?: string;
  month?: number;
  year?: number;
  status?: 'GRANTED' | 'DENIED' | 'REGISTERED';
  userId?: number;
  searchTerm?: string;
}

export function useLogsWithRealtime(filters?: LogFilters) {
  const [logs, setLogs] = useState<AccessLogWithUser[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Build query string from filters
  const buildQueryString = useCallback((f?: LogFilters) => {
    if (!f) return '';
    const params = new URLSearchParams();
    if (f.date) params.append('date', f.date);
    if (f.month) params.append('month', f.month.toString());
    if (f.year) params.append('year', f.year.toString());
    if (f.status) params.append('status', f.status);
    if (f.userId) params.append('userId', f.userId.toString());
    if (f.searchTerm) params.append('search', f.searchTerm);
    return params.toString() ? `?${params.toString()}` : '';
  }, []);

  // Fetch logs with filters
  const { data: fetchedLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['logs', filters],
    queryFn: async () => {
      const queryString = buildQueryString(filters);
      const response = await fetch(`/api/logs${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update logs when filters change
  useEffect(() => {
    setLogs(fetchedLogs);
  }, [fetchedLogs]);

  // Set up Socket.io for real-time updates
  useEffect(() => {
    // Only enable real-time if no filters are applied (showing all logs)
    const hasFilters = Boolean(
      filters?.date || filters?.month || filters?.year || 
      filters?.status || filters?.userId || filters?.searchTerm
    );

    if (hasFilters) {
      console.log('⏸️ Real-time disabled while filters are active');
      return;
    }

    const newSocket = io();

    newSocket.on('connect', () => {
      console.log('✅ Connected to real-time updates');
    });

    newSocket.on('new-log', (newLog: AccessLogWithUser) => {
      console.log('📝 New log received from backend:');
      console.log('   ID:', newLog.id);
      console.log('   User ID:', newLog.userId);
      console.log('   Status:', newLog.result);
      console.log('   Created At (from backend):', newLog.createdAt);
      console.log('   User Name:', newLog.name);
      
      setLogs((prev) => {
        // Avoid duplicates
        if (prev.some((l) => l.id === newLog.id)) {
          console.warn('⚠️ Duplicate log detected, skipping');
          return prev;
        }
        // Add new log to the beginning
        console.log('✅ Adding new log to UI');
        return [newLog, ...prev].slice(0, 100); // Keep only last 100
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time updates');
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('new-log');
      newSocket.disconnect();
    };
  }, [filters]);

  return {
    logs,
    isLoading,
    refetch,
    socket,
  };
}

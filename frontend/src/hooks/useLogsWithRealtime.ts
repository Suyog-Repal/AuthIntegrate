// 🔥 PHASE 3: Custom hook for managing logs with filters and real-time updates
import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import type { AccessLogWithUser } from '@shared/schema';
import { getApiBase } from '@/lib/api';

interface LogFilters {
  date?: string;
  month?: number;
  year?: number;
  status?: 'GRANTED' | 'DENIED' | 'REGISTERED';
  userId?: number;
  searchTerm?: string;
}

/**
 * Derives the Socket.IO server URL from the environment.
 *
 * - In local dev, Vite proxies /socket.io → localhost:5010, so we connect to
 *   window.location.origin and the proxy forwards it automatically.
 * - In production (Vercel), we must connect directly to the Render backend URL
 *   because Vercel does not support WebSocket proxying.
 */
function getSocketUrl(): string {
  const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (apiUrl) {
    // Strip trailing /api path if present — Socket.IO connects to the root
    return apiUrl.replace(/\/api\/?$/, '');
  }
  // Local dev: let the Vite proxy handle it via window.location.origin
  return window.location.origin;
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
      const response = await fetch(`${getApiBase()}/api/logs${queryString}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const json = await response.json();
      return json.data || [];
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

    if (hasFilters) return;

    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      if (import.meta.env.DEV) console.log('✅ Connected to real-time updates');
    });

    newSocket.on('new-log', (newLog: AccessLogWithUser) => {
      setLogs((prev) => {
        if (prev.some((l) => l.id === newLog.id)) return prev;
        return [newLog, ...prev].slice(0, 100);
      });
    });

    newSocket.on('disconnect', () => {
      if (import.meta.env.DEV) console.log('❌ Disconnected from real-time updates');
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('new-log');
      newSocket.disconnect();
    };
  }, [filters]);

  return { logs, isLoading, refetch, socket };
}

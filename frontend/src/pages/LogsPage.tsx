// 🔥 PHASE 3-6: Comprehensive Logs Management Page
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogFilters, type LogFilters as ILogFilters } from '@/components/LogFilters';
import { LogsTable } from '@/components/LogsTable';
import { useLogsWithRealtime } from '@/hooks/useLogsWithRealtime';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function LogsPage() {
  const [filters, setFilters] = useState<ILogFilters>();
  const [isExporting, setIsExporting] = useState(false);
  const { logs, isLoading, refetch } = useLogsWithRealtime(filters);

  // Calculate statistics
  const stats = {
    total: logs.length,
    granted: logs.filter((l) => l.result === 'GRANTED').length,
    denied: logs.filter((l) => l.result === 'DENIED').length,
    registered: logs.filter((l) => l.result === 'REGISTERED').length,
  };

  const handleApplyFilters = useCallback((newFilters: ILogFilters) => {
    setFilters(newFilters);
    toast({
      description: '✅ Filters applied!',
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(undefined);
    toast({
      description: '🔄 Filters reset!',
    });
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      setIsExporting(true);
      const queryParams = new URLSearchParams();
      if (filters?.date) queryParams.append('date', filters.date);
      if (filters?.month) queryParams.append('month', filters.month.toString());
      if (filters?.year) queryParams.append('year', filters.year.toString());
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.userId) queryParams.append('userId', filters.userId.toString());
      if (filters?.searchTerm) queryParams.append('search', filters.searchTerm);

      console.log('📤 Exporting to Excel with params:', queryParams.toString());
      const response = await fetch(`/api/logs/export/excel?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: Export failed`);
      }

      const blob = await response.blob();
      console.log('✅ Received blob:', blob.type, `${blob.size} bytes`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        description: '✅ Excel file exported successfully!',
      });
    } catch (error: any) {
      console.error('❌ Excel export error:', error);
      toast({
        description: `Export failed: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  const handleExportPDF = useCallback(async () => {
    try {
      setIsExporting(true);
      const queryParams = new URLSearchParams();
      if (filters?.date) queryParams.append('date', filters.date);
      if (filters?.month) queryParams.append('month', filters.month.toString());
      if (filters?.year) queryParams.append('year', filters.year.toString());
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.userId) queryParams.append('userId', filters.userId.toString());
      if (filters?.searchTerm) queryParams.append('search', filters.searchTerm);

      console.log('📤 Exporting to PDF with params:', queryParams.toString());
      const response = await fetch(`/api/logs/export/pdf?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: Export failed`);
      }

      const blob = await response.blob();
      console.log('✅ Received blob:', blob.type, `${blob.size} bytes`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        description: '✅ PDF file exported successfully!',
      });
    } catch (error: any) {
      console.error('❌ PDF export error:', error);
      toast({
        description: `Export failed: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📊 Access Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and analyze system access events in real-time
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.granted}</div>
              <p className="text-sm text-muted-foreground">Access Granted</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{stats.denied}</div>
              <p className="text-sm text-muted-foreground">Access Denied</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.registered}</div>
              <p className="text-sm text-muted-foreground">New Registrations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <LogFilters
        onApplyFilters={handleApplyFilters}
        onReset={handleResetFilters}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        isLoading={isLoading}
        isExporting={isExporting}
      />

      {/* Active Filters Display */}
      {filters && Object.values(filters).some((v) => v !== undefined) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-blue-900">🔍 Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.date && (
                <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm">
                  📅 Date: {filters.date}
                </span>
              )}
              {filters.month && filters.year && (
                <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm">
                  📆 {new Date(filters.year, filters.month - 1).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </span>
              )}
              {filters.status && (
                <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm">
                  🏷️ Status: {filters.status}
                </span>
              )}
              {filters.userId && (
                <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm">
                  👤 User ID: {filters.userId}
                </span>
              )}
              {filters.searchTerm && (
                <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm">
                  🔎 Search: {filters.searchTerm}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            📋 Access Records
            {logs.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({logs.length} {logs.length === 1 ? 'record' : 'records'})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto max-h-[600px] overflow-y-auto">
            <LogsTable logs={logs} isLoading={isLoading} />
          </div>
        </CardContent>
      </Card>

      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        {!filters || !Object.values(filters).some((v) => v !== undefined) ? (
          <span>🔄 Real-time updates active</span>
        ) : (
          <span>⏸️ Real-time paused (filtering applied)</span>
        )}
      </div>
    </div>
  );
}

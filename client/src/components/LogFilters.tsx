// 🔥 PHASE 4: Logs Filter UI Component
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';

export interface LogFilters {
  date?: string;
  month?: number;
  year?: number;
  status?: 'GRANTED' | 'DENIED' | 'REGISTERED';
  userId?: number;
  searchTerm?: string;
}

interface LogFiltersProps {
  onApplyFilters: (filters: LogFilters) => void;
  onReset: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  isLoading?: boolean;
  isExporting?: boolean;
}

export function LogFilters({
  onApplyFilters,
  onReset,
  onExportExcel,
  onExportPDF,
  isLoading = false,
  isExporting = false,
}: LogFiltersProps) {
  const [filters, setFilters] = useState<LogFilters>({});
  const [dateFilter, setDateFilter] = useState<'all' | 'date' | 'month-year'>('all');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleApply = () => {
    const newFilters = { ...filters };

    // Add date filters based on selection
    if (dateFilter === 'date' && filters.date) {
      newFilters.date = filters.date;
    } else if (dateFilter === 'month-year' && filters.month && filters.year) {
      newFilters.month = filters.month;
      newFilters.year = filters.year;
    } else {
      delete newFilters.date;
      delete newFilters.month;
      delete newFilters.year;
    }

    onApplyFilters(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    setDateFilter('all');
    onReset();
  };

  return (
    <Card className="bg-card dark:bg-card border-border dark:border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
          <span>🔍 Filter Logs</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date Filter Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground dark:text-foreground">Date Range</label>
            <div className="flex gap-2">
              <Button
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('all');
                  setFilters((f) => ({ ...f, date: undefined, month: undefined, year: undefined }));
                }}
              >
                All Dates
              </Button>
              <Button
                variant={dateFilter === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('date')}
              >
                Specific Date
              </Button>
              <Button
                variant={dateFilter === 'month-year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('month-year')}
              >
                Month/Year
              </Button>
            </div>
          </div>

          {/* Specific Date Input */}
          {dateFilter === 'date' && (
            <div className="space-y-2">
              <label htmlFor="date-input" className="text-sm font-medium text-foreground dark:text-foreground">
                Select Date
              </label>
              <Input
                id="date-input"
                type="date"
                value={filters.date || ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, date: e.target.value || undefined }))
                }
                className="bg-input dark:bg-input text-foreground dark:text-foreground border-border dark:border-border"
              />
            </div>
          )}

          {/* Month/Year Selectors */}
          {dateFilter === 'month-year' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="month-select" className="text-sm font-medium text-foreground dark:text-foreground">
                  Month
                </label>
                <Select
                  value={filters.month?.toString() || 'all'}
                  onValueChange={(value) =>
                    setFilters((f) => ({ ...f, month: value === 'all' ? undefined : parseInt(value) }))
                  }
                >
                  <SelectTrigger id="month-select" className="bg-input dark:bg-input text-foreground dark:text-foreground border-border dark:border-border">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {dayjs().month(month - 1).format('MMMM')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="year-select" className="text-sm font-medium text-foreground dark:text-foreground">
                  Year
                </label>
                <Select
                  value={filters.year?.toString() || 'all'}
                  onValueChange={(value) =>
                    setFilters((f) => ({ ...f, year: value === 'all' ? undefined : parseInt(value) }))
                  }
                >
                  <SelectTrigger id="year-select" className="bg-input dark:bg-input text-foreground dark:text-foreground border-border dark:border-border">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <label htmlFor="status-select" className="text-sm font-medium text-foreground dark:text-foreground">
              Status
            </label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  status: (value === 'all' ? undefined : value) as 'GRANTED' | 'DENIED' | 'REGISTERED' | undefined,
                }))
              }
            >
              <SelectTrigger id="status-select" className="bg-input dark:bg-input text-foreground dark:text-foreground border-border dark:border-border">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="GRANTED">✅ Access Granted</SelectItem>
                <SelectItem value="DENIED">❌ Access Denied</SelectItem>
                <SelectItem value="REGISTERED">📝 Registered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User ID Filter */}
          <div className="space-y-2">
            <label htmlFor="user-id-input" className="text-sm font-medium text-foreground dark:text-foreground">
              User ID
            </label>
            <Input
              id="user-id-input"
              type="number"
              min="0"
              placeholder="Leave empty for all users"
              value={filters.userId || ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  userId: e.target.value ? parseInt(e.target.value) : undefined,
                }))
              }
              className="bg-input dark:bg-input text-foreground dark:text-foreground border-border dark:border-border placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* Search Filter */}
          <div className="space-y-2">
            <label htmlFor="search-input" className="text-sm font-medium text-foreground dark:text-foreground">
              Search by Name/Email
            </label>
            <Input
              id="search-input"
              type="text"
              placeholder="Search user name or email..."
              value={filters.searchTerm || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, searchTerm: e.target.value || undefined }))
              }
              className="bg-input dark:bg-input text-foreground dark:text-foreground border-border dark:border-border placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-border dark:border-border">
            <Button
              onClick={handleApply}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isLoading ? '⏳ Filtering...' : '🔍 Apply Filters'}
            </Button>

            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isLoading}
              className="bg-background dark:bg-background text-foreground dark:text-foreground border-border dark:border-border hover:bg-muted dark:hover:bg-muted"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>

            <Button
              onClick={onExportExcel}
              disabled={isExporting}
              variant="outline"
              className="text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <Download className="w-4 h-4 mr-1" />
              Excel
            </Button>

            <Button
              onClick={onExportPDF}
              disabled={isExporting}
              variant="outline"
              className="text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

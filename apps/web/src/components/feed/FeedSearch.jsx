import React, { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FeedSearch({ onSearch, onFilter }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    responseType: 'all',
    category: 'all',
    dateRange: 'all'
  });

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleApplyFilters = () => {
    onFilter(filters);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="bg-white px-4 py-3 mb-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="חפש בפיד..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-10 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(true)}
            aria-label="Open filters"
            className="h-10 w-10"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-4 py-4 mb-2 border-b">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base">סנן תוצאות</h3>
        <button onClick={() => setIsOpen(false)} aria-label="Close filters">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="filter-response-type" className="block text-sm text-gray-600 mb-2">סוג תוכן</label>
          <select
            id="filter-response-type"
            value={filters.responseType}
            onChange={(e) => setFilters({ ...filters, responseType: e.target.value })}
            className="w-full h-10 border-2 border-gray-200 rounded-lg px-3"
          >
            <option value="all">הכל</option>
            <option value="text">טקסט</option>
            <option value="drawing">ציור</option>
            <option value="voice">קול</option>
            <option value="video">וידאו</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-category" className="block text-sm text-gray-600 mb-2">קטגוריה</label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full h-10 border-2 border-gray-200 rounded-lg px-3"
          >
            <option value="all">הכל</option>
            <option value="identity">זהות</option>
            <option value="values">ערכים</option>
            <option value="relationships">מערכות יחסים</option>
            <option value="dreams">חלומות</option>
            <option value="past">עבר</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-date-range" className="block text-sm text-gray-600 mb-2">תאריך</label>
          <select
            id="filter-date-range"
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="w-full h-10 border-2 border-gray-200 rounded-lg px-3"
          >
            <option value="all">הכל</option>
            <option value="today">היום</option>
            <option value="week">השבוע</option>
            <option value="month">החודש</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setFilters({ responseType: 'all', category: 'all', dateRange: 'all' });
              onFilter({ responseType: 'all', category: 'all', dateRange: 'all' });
            }}
            className="flex-1"
          >
            איפוס
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="flex-1 bg-gray-900 text-white"
          >
            החל סינון
          </Button>
        </div>
      </div>
    </div>
  );
}
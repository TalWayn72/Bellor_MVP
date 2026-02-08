import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function UserFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  users,
}) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search by name, email or nickname..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => onFilterChange('all')}
              size="sm"
            >
              All ({users.length})
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => onFilterChange('active')}
              size="sm"
            >
              Active ({users.filter(u => !u.is_blocked).length})
            </Button>
            <Button
              variant={filterStatus === 'blocked' ? 'default' : 'outline'}
              onClick={() => onFilterChange('blocked')}
              size="sm"
            >
              Blocked ({users.filter(u => u.is_blocked).length})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

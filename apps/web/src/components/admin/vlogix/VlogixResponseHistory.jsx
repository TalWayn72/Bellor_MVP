import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/states';
import {
  getResponseCreatedAt,
  getResponseMissionId,
  getResponsePreview,
  getResponseType,
} from './vlogixAnalysisUtils';

export default function VlogixResponseHistory({
  isLoading,
  responses,
  selectedResponse,
  onSelectResponse,
}) {
  return (
    <aside className="border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-border bg-muted">
        <h3 className="font-semibold text-foreground">Response History</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <ListSkeleton count={4} />
        ) : responses.length > 0 ? (
          responses.map((response) => (
            <ResponseHistoryButton
              key={response.id}
              response={response}
              isSelected={selectedResponse?.id === response.id}
              onClick={() => onSelectResponse(response)}
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">No responses yet.</p>
        )}
      </div>
    </aside>
  );
}

function ResponseHistoryButton({ response, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge variant="secondary">{getResponseType(response)}</Badge>
        <span className="text-xs text-muted-foreground">{formatResponseDate(response)}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{getResponseMissionId(response)}</p>
      <p className="text-sm text-foreground line-clamp-3">{getResponsePreview(response)}</p>
    </button>
  );
}

function formatResponseDate(response) {
  const createdAt = getResponseCreatedAt(response);
  if (!createdAt) return 'Unknown date';
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString('en-US');
}

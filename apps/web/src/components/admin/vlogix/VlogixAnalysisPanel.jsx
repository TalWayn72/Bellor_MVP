import { Badge } from '@/components/ui/badge';
import {
  formatScore,
  getResponseMissionId,
  getResponsePreview,
  getResponseType,
  getResponseCreatedAt,
} from './vlogixAnalysisUtils';

export default function VlogixAnalysisPanel({ response, analysis }) {
  if (!response || !analysis) {
    return <p className="text-muted-foreground">Select a response from the history to inspect analysis details.</p>;
  }

  return (
    <div className="mt-5 space-y-5 overflow-y-auto max-h-[58vh] pr-1">
      <AnalysisSection title="Selected Response">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="missionId" value={getResponseMissionId(response)} />
          <DetailItem label="responseType" value={getResponseType(response)} />
          <DetailItem label="createdAt" value={formatResponseDateTime(response)} />
          <DetailItem label="content/text preview" value={getResponsePreview(response)} className="sm:col-span-2" />
        </div>
      </AnalysisSection>

      <AnalysisSection title="Result">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={getAnalysisBadgeVariant(analysis.status)}>{analysis.status}</Badge>
          <div className="text-sm text-muted-foreground">
            Anomaly Score: <span className="font-semibold text-foreground">{formatScore(analysis.anomalyScore)}</span>
          </div>
          <Badge variant={analysis.historyCount >= 5 ? 'success' : 'warning'}>
            {analysis.historyCount >= 5 ? 'Baseline Ready' : 'Insufficient Data'}
          </Badge>
        </div>
        {analysis.status === 'Baseline' && (
          <p className="mt-3 text-sm text-muted-foreground">Insufficient history for comparison</p>
        )}
      </AnalysisSection>

      <AnalysisSection title="Formula Breakdown">
        <div className="grid gap-2 sm:grid-cols-2">
          {analysis.breakdown.map((item) => <FormulaItem key={item.label} {...item} />)}
        </div>
      </AnalysisSection>

      <AnalysisSection title="Actual Calculation">
        <ActualCalculation analysis={analysis} />
      </AnalysisSection>

      <AnalysisSection title="Explanation">
        <p className="text-sm text-muted-foreground">{analysis.explanation}</p>
      </AnalysisSection>
    </div>
  );
}

function ActualCalculation({ analysis }) {
  if (analysis.status === 'Baseline') {
    return (
      <p className="text-sm text-muted-foreground">
        No anomaly calculation yet. This response is part of the baseline-building phase because only {analysis.historyCount} previous responses exist. At least 5 previous responses are required.
      </p>
    );
  }

  const c = analysis.calculation;
  return (
    <div className="rounded-md border border-border bg-background p-4 font-mono text-xs text-foreground">
      <FormulaBlock lines={['baseScore =', '(modalityDeviation × 0.8)', '+ (responseDeviation × 0.2)', '+ dominantModalityPenalty']} />
      <FormulaBlock lines={[`baseScore = (${formatScore(c.modalityDeviation)} × 0.8)`, `+ (${formatScore(c.responseDeviation)} × 0.2)`, `+ ${formatScore(c.dominantModalityPenalty)}`]} />
      <FormulaBlock lines={[`baseScore = ${formatScore(c.modalityComponent)}`, `+ ${formatScore(c.responseComponent)}`, `+ ${formatScore(c.dominantModalityPenalty)}`, `= ${formatScore(c.baseScore)}`]} />
      <FormulaBlock lines={['finalAnomalyScore =', 'clamp(baseScore × categoryWeight, 0, 1)']} />
      <FormulaBlock lines={['finalAnomalyScore =', `clamp(${formatScore(c.baseScore)} × ${formatScore(c.categoryWeight)}, 0, 1)`, `= ${formatScore(c.anomalyScore)}`]} />
    </div>
  );
}

function FormulaBlock({ lines }) {
  return (
    <div className="mb-4 last:mb-0 space-y-1">
      {lines.map((line, index) => <div key={line} className={index === 0 ? '' : 'pl-4'}>{line}</div>)}
    </div>
  );
}

function AnalysisSection({ title, children }) {
  return <div className="rounded-lg border border-border bg-muted/20 p-4"><h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>{children}</div>;
}

function DetailItem({ label, value, className = '' }) {
  return <div className={className}><div className="text-xs font-medium uppercase text-muted-foreground mb-1">{label}</div><div className="text-sm text-foreground break-words">{value || 'Not available'}</div></div>;
}

function FormulaItem({ label, value }) {
  return <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"><span className="text-xs text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

function getAnalysisBadgeVariant(status) {
  if (status === 'Consistent') return 'success';
  if (status === 'Anomalous') return 'destructive';
  return 'warning';
}

function formatResponseDateTime(response) {
  const createdAt = getResponseCreatedAt(response);
  if (!createdAt) return 'Unknown date';
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString('en-US');
}

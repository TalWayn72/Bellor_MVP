export const getResponseMissionId = (response) =>
  response.mission_id ?? response.missionId ?? 'No mission';

export const getResponseType = (response) =>
  response.response_type ?? response.responseType ?? 'Unknown';

export const getResponseCreatedAt = (response) =>
  response.created_date ?? response.created_at ?? response.createdAt;

export const getResponseTime = (response) => {
  const createdAt = getResponseCreatedAt(response);
  if (!createdAt) return 0;
  const time = new Date(createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const getResponsePreview = (response) => {
  const preview = response.text_content ?? response.textContent ?? response.content ?? 'No preview available';
  const normalized = String(preview).trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
};

const MODALITY_SCORES = { TEXT: 0.2, VOICE: 0.6, VIDEO: 0.9, DRAWING: 0.8 };
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const normalizeModality = (response) => String(getResponseType(response) || 'Unknown').toUpperCase();
const getModalityScore = (response) => MODALITY_SCORES[normalizeModality(response)] ?? 0.5;

const getResponseScore = (response) => {
  const textContent = response.text_content ?? response.textContent;
  if (textContent) return clamp(String(textContent).length, 0, 100) / 100;
  if (typeof response.content === 'string') return clamp(response.content.length, 0, 100) / 100;
  return 0;
};

export function buildResponseAnalysis(responses, selectedResponse) {
  const sorted = [...responses].sort((a, b) => getResponseTime(a) - getResponseTime(b));
  const selectedIndex = sorted.findIndex((response) => response.id === selectedResponse.id);
  const previousResponses = selectedIndex >= 0 ? sorted.slice(0, selectedIndex) : [];
  const historyCount = previousResponses.length;
  const currentModality = normalizeModality(selectedResponse);
  const currentModalityScore = getModalityScore(selectedResponse);
  const currentResponseScore = getResponseScore(selectedResponse);

  if (historyCount < 5) {
    return baselineAnalysis(historyCount, currentModalityScore, currentResponseScore);
  }

  const averageHistoricalModalityScore = average(previousResponses.map(getModalityScore));
  const averageHistoricalResponseScore = average(previousResponses.map(getResponseScore));
  const dominantHistoricalModality = getDominantModality(previousResponses);
  const modalityDeviation = Math.abs(currentModalityScore - averageHistoricalModalityScore);
  const responseDeviation = Math.abs(currentResponseScore - averageHistoricalResponseScore);
  const dominantModalityPenalty = currentModality !== dominantHistoricalModality ? 0.15 : 0;
  const categoryWeight = 1;
  const modalityComponent = modalityDeviation * 0.8;
  const responseComponent = responseDeviation * 0.2;
  const baseScore = modalityComponent + responseComponent + dominantModalityPenalty;
  const anomalyScore = clamp(baseScore * categoryWeight, 0, 1);
  const status = anomalyScore < 0.3 ? 'Consistent' : 'Anomalous';

  return {
    status,
    anomalyScore,
    historyCount,
    explanation: status === 'Consistent'
      ? 'This response is close to the user\'s previous behavioral pattern.'
      : 'This response deviates from the user\'s previous behavioral pattern.',
    breakdown: buildBreakdown({
      currentModalityScore,
      averageHistoricalModalityScore,
      modalityDeviation,
      currentResponseScore,
      averageHistoricalResponseScore,
      responseDeviation,
      dominantHistoricalModality,
      dominantModalityPenalty,
      categoryWeight,
      baseScore,
      anomalyScore,
    }),
    calculation: {
      modalityDeviation,
      responseDeviation,
      dominantModalityPenalty,
      categoryWeight,
      baseScore,
      anomalyScore,
      modalityComponent,
      responseComponent,
    },
  };
}

function baselineAnalysis(historyCount, currentModalityScore, currentResponseScore) {
  const zeros = {
    currentModalityScore,
    averageHistoricalModalityScore: 0,
    modalityDeviation: 0,
    currentResponseScore,
    averageHistoricalResponseScore: 0,
    responseDeviation: 0,
    dominantHistoricalModality: 'Not available',
    dominantModalityPenalty: 0,
    categoryWeight: 1,
    baseScore: 0,
    anomalyScore: 0,
  };
  return {
    status: 'Baseline',
    anomalyScore: 0,
    historyCount,
    explanation: 'This response is part of the baseline-building phase because fewer than 5 earlier responses exist.',
    breakdown: buildBreakdown(zeros),
    calculation: { ...zeros, modalityComponent: 0, responseComponent: 0 },
  };
}

function buildBreakdown(values) {
  return [
    ['currentModalityScore', values.currentModalityScore],
    ['averageHistoricalModalityScore', values.averageHistoricalModalityScore],
    ['modalityDeviation', values.modalityDeviation],
    ['currentResponseScore', values.currentResponseScore],
    ['averageHistoricalResponseScore', values.averageHistoricalResponseScore],
    ['responseDeviation', values.responseDeviation],
    ['dominantHistoricalModality', values.dominantHistoricalModality],
    ['dominantModalityPenalty', values.dominantModalityPenalty],
    ['categoryWeight', values.categoryWeight],
    ['baseScore', values.baseScore],
    ['final anomalyScore', values.anomalyScore],
  ].map(([label, value]) => ({ label, value: typeof value === 'number' ? formatScore(value) : value }));
}

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

function getDominantModality(responses) {
  const counts = responses.reduce((acc, response) => {
    const modality = normalizeModality(response);
    acc[modality] = (acc[modality] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Not available';
}

export const formatScore = (value) => Number(value || 0).toFixed(2);

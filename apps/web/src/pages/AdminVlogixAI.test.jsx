import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockListUsers, mockListVlogixUserResponses } = vi.hoisted(() => ({
  mockListUsers: vi.fn(),
  mockListVlogixUserResponses: vi.fn(),
}));

vi.mock('@/api', () => ({
  adminService: {
    listUsers: mockListUsers,
    listVlogixUserResponses: mockListVlogixUserResponses,
  },
}));

vi.mock('@/components/admin/LayoutAdmin', () => ({
  default: ({ children }) => <div data-testid="layout-admin">{children}</div>,
}));

import AdminVlogixAI from './AdminVlogixAI';

const adminUser = {
  id: 'user-1',
  full_name: 'Demo User',
  email: 'demo@example.com',
  response_count: 7,
};

const response = (id, createdAt, responseType, textContent, content = '') => ({
  id,
  mission_id: `mission-${id}`,
  response_type: responseType,
  text_content: textContent,
  content,
  created_at: createdAt,
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

async function renderDialogWithResponses(responses) {
  mockListUsers.mockResolvedValue({ data: { users: [adminUser] } });
  mockListVlogixUserResponses.mockResolvedValue({ data: responses });

  const user = userEvent.setup();
  render(<AdminVlogixAI />, { wrapper: createWrapper() });

  await user.click(await screen.findByRole('button', { name: /view/i }));
  await screen.findByText('Response History');

  return user;
}

describe('[P2][admin] AdminVlogixAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the placeholder before a response is selected and displays history newest first', async () => {
    await renderDialogWithResponses([
      response('old', '2026-05-01T10:00:00.000Z', 'TEXT', 'Old response'),
      response('new', '2026-05-03T10:00:00.000Z', 'VIDEO', '', 'https://example.com/new.mp4'),
    ]);

    expect(screen.getByText('Select a response from the history to inspect analysis details.')).toBeInTheDocument();

    const history = screen.getByText('Response History').closest('aside');
    const buttons = within(history).getAllByRole('button');
    expect(within(buttons[0]).getByText('mission-new')).toBeInTheDocument();
    expect(within(buttons[1]).getByText('mission-old')).toBeInTheDocument();
  });

  it('shows baseline analysis when fewer than five earlier responses exist', async () => {
    const user = await renderDialogWithResponses([
      response('one', '2026-05-01T10:00:00.000Z', 'TEXT', 'First'),
      response('two', '2026-05-02T10:00:00.000Z', 'VOICE', '', 'https://example.com/two.mp3'),
    ]);

    await user.click(screen.getByText('mission-two'));

    expect(screen.getByText('Baseline')).toBeInTheDocument();
    expect(screen.getAllByText('0.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Insufficient Data')).toBeInTheDocument();
    expect(screen.getByText('Insufficient history for comparison')).toBeInTheDocument();
    expect(screen.getByText('This response is part of the baseline-building phase because fewer than 5 earlier responses exist.')).toBeInTheDocument();
    expect(screen.getByText('Actual Calculation')).toBeInTheDocument();
    expect(screen.getByText('No anomaly calculation yet. This response is part of the baseline-building phase because only 1 previous responses exist. At least 5 previous responses are required.')).toBeInTheDocument();
  });

  it('calculates selected response analysis from earlier chronological responses only and scores unknown types as 0.5', async () => {
    const user = await renderDialogWithResponses([
      response('future', '2026-05-08T10:00:00.000Z', 'VIDEO', 'x'.repeat(100)),
      response('h1', '2026-05-01T10:00:00.000Z', 'TEXT', 'a'.repeat(20)),
      response('h2', '2026-05-02T10:00:00.000Z', 'TEXT', 'b'.repeat(20)),
      response('h3', '2026-05-03T10:00:00.000Z', 'TEXT', 'c'.repeat(20)),
      response('h4', '2026-05-04T10:00:00.000Z', 'TEXT', 'd'.repeat(20)),
      response('h5', '2026-05-05T10:00:00.000Z', 'TEXT', 'e'.repeat(20)),
      response('selected', '2026-05-06T10:00:00.000Z', 'SKETCH', 'z'.repeat(20)),
    ]);

    await user.click(screen.getByText('mission-selected'));

    expect(screen.getAllByText('SKETCH').length).toBeGreaterThan(0);
    expect(screen.getByText('Anomalous')).toBeInTheDocument();
    expect(screen.getAllByText('0.39').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Baseline Ready').length).toBeGreaterThan(0);
    expect(screen.getByText('This response deviates from the user\'s previous behavioral pattern.')).toBeInTheDocument();

    expect(screen.getByText('currentModalityScore')).toBeInTheDocument();
    expect(screen.getByText('0.50')).toBeInTheDocument();
    expect(screen.getByText('averageHistoricalModalityScore')).toBeInTheDocument();
    expect(screen.getAllByText('0.20').length).toBeGreaterThan(0);
    expect(screen.getByText('dominantHistoricalModality')).toBeInTheDocument();
    expect(screen.getAllByText('TEXT').length).toBeGreaterThan(0);
    expect(screen.getByText('Actual Calculation')).toBeInTheDocument();
    expect(screen.getByText('baseScore =')).toBeInTheDocument();
    expect(screen.getByText('baseScore = (0.30 × 0.8)')).toBeInTheDocument();
    expect(screen.getByText('+ (0.00 × 0.2)')).toBeInTheDocument();
    expect(screen.getAllByText('+ 0.15').length).toBeGreaterThan(0);
    expect(screen.getByText('baseScore = 0.24')).toBeInTheDocument();
    expect(screen.getAllByText('+ 0.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('= 0.39').length).toBeGreaterThan(0);
    expect(screen.getAllByText('finalAnomalyScore =').length).toBeGreaterThan(0);
    expect(screen.getByText('clamp(0.39 × 1.00, 0, 1)')).toBeInTheDocument();
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from './ChatInput';

const baseProps = {
  message: '',
  onMessageChange: vi.fn(),
  onSend: vi.fn(),
  showIceBreakers: false,
  onToggleIceBreakers: vi.fn(),
  iceBreakers: [],
  showIceBreakerPanel: false,
  onSelectIceBreaker: vi.fn(),
  onSendImage: vi.fn(),
  onSendVoice: vi.fn(),
  onSendDrawing: vi.fn(),
  isUploading: false,
};

describe('[P1][chat] ChatInput drawing entry', () => {
  it('shows a drawing button that opens the drawing modal', async () => {
    const user = userEvent.setup();

    render(<ChatInput {...baseProps} />);

    await user.click(screen.getByRole('button', { name: /open drawing tool/i }));

    expect(screen.getByRole('dialog', { name: /draw a message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send drawing/i })).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PrivateChatHeader from './PrivateChatHeader';

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <button type="button">Back</button>,
}));

const baseProps = {
  otherUser: { id: 'user-2', nickname: 'Dana', profile_images: [] },
  otherUserId: 'user-2',
  chatId: 'chat-1',
  isTemporary: false,
  isPermanent: true,
  timeLeft: null,
  isOtherUserOnline: false,
  isOtherUserTyping: false,
  showActions: false,
  onToggleActions: vi.fn(),
  onNavigate: vi.fn(),
  onStartVideoCall: vi.fn(),
  onBlockUser: vi.fn(),
};

describe('PrivateChatHeader', () => {
  it('shows a permanent chat tier label', () => {
    render(<PrivateChatHeader {...baseProps} />);

    expect(screen.getByText("צ'אט קבוע")).toBeInTheDocument();
  });

  it('shows online text and online avatar status when the other user is online', () => {
    const { container } = render(<PrivateChatHeader {...baseProps} isOtherUserOnline />);

    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(container.querySelector('.bg-success')).toBeInTheDocument();
  });

  it('shows offline text and offline avatar status when the other user is offline', () => {
    const { container } = render(<PrivateChatHeader {...baseProps} isOtherUserOnline={false} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(container.querySelector('.bg-muted-foreground')).toBeInTheDocument();
  });

  it('shows a temporary chat tier label when no countdown exists', () => {
    render(<PrivateChatHeader {...baseProps} isTemporary isPermanent={false} />);

    expect(screen.getByText("צ'אט זמני")).toBeInTheDocument();
  });

  it('shows the temporary tier label with countdown when timeLeft exists', () => {
    render(<PrivateChatHeader {...baseProps} isTemporary isPermanent={false} timeLeft={12} />);

    expect(screen.getByText("צ'אט זמני · נשארו 12 שעות")).toBeInTheDocument();
  });
  it('calls the video call start handler when starting a video call', () => {
    const onStartVideoCall = vi.fn();
    render(<PrivateChatHeader {...baseProps} onStartVideoCall={onStartVideoCall} />);

    fireEvent.click(screen.getByLabelText('Start video call'));

    expect(onStartVideoCall).toHaveBeenCalledTimes(1);
  });
});

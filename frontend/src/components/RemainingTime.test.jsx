import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RemainingTime, { formatTime, getRemainingSeconds } from './RemainingTime';

describe('RemainingTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats seconds as hours, minutes and seconds', () => {
    expect(formatTime(0)).toBe('00:00:00');
    expect(formatTime(3661)).toBe('01:01:01');
    expect(formatTime(86399)).toBe('23:59:59');
  });

  it('calculates remaining seconds and never returns a negative value', () => {
    expect(getRemainingSeconds('2026-01-01T12:00:10.000Z')).toBe(10);
    expect(getRemainingSeconds('2026-01-01T11:59:00.000Z')).toBe(0);
    expect(getRemainingSeconds(null)).toBe(0);
  });

  it('updates the visible countdown every second', () => {
    render(<RemainingTime estimatedCompletionAt="2026-01-01T12:00:03.000Z" />);
    expect(screen.getByText('00:00:03')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('00:00:01')).toBeInTheDocument();
  });

  it('shows completion state when time reaches zero', () => {
    render(<RemainingTime estimatedCompletionAt="2026-01-01T12:00:01.000Z" />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Concluindo...')).toBeInTheDocument();
  });

  it('renders nothing without an estimated completion date', () => {
    const { container } = render(<RemainingTime estimatedCompletionAt={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

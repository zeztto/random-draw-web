import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '@/app/App';
vi.mock('@/app/components/RouletteWheel', () => ({
  RouletteWheel: ({
    totalNumbers,
    rotation,
    winningNumber,
  }: {
    totalNumbers: number;
    rotation: number;
    winningNumber: number | null;
  }) => (
    <div
      role="img"
      aria-label="test-only wheel"
      data-total={totalNumbers}
      data-rotation={rotation}
      data-winning={winningNumber}
    />
  ),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
    (array as Uint32Array)[0] = 0;
    return array;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const finish = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(4001);
  });
};
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
describe('draw state boundaries', () => {
  it('sequential unique draws always choose the remaining pool and reset', async () => {
    const { container } = render(<App />);
    change('추첨 번호 개수', '2');
    fireEvent.click(screen.getByRole('button', { name: '고급 설정' }));
    change('당첨자 수', '2');
    fireEvent.click(screen.getByRole('button', { name: '추첨 시작' }));
    await finish();
    fireEvent.click(screen.getByRole('button', { name: /다음 추첨/ }));
    await finish();
    expect([...container.querySelectorAll('.winner-badge')].map((n) => n.textContent)).toEqual([
      '1',
      '2',
    ]);
    fireEvent.click(screen.getByRole('button', { name: '다시 추첨' }));
    expect(container.querySelectorAll('.winner-badge')).toHaveLength(0);
    expect(screen.getByRole('button', { name: '추첨 시작' })).toBeEnabled();
  });
  it('clamps winner count and resets when duplicates are switched off', () => {
    render(<App />);
    change('추첨 번호 개수', '2');
    fireEvent.click(screen.getByRole('button', { name: '고급 설정' }));
    fireEvent.click(screen.getByRole('switch', { name: '중복 허용' }));
    change('당첨자 수', '4');
    fireEvent.click(screen.getByRole('switch', { name: '중복 허용' }));
    expect(screen.getByLabelText<HTMLInputElement>('당첨자 수').value).toBe('2');
  });
  it.each(['', '1.5', 'NaN', '100'])(
    'keeps invalid number draft visible and blocks draw: %s',
    (value) => {
      render(<App />);
      change('추첨 번호 개수', value);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '추첨 시작' })).toBeDisabled();
    }
  );
  it('draws all requested results once with duplicates allowed', async () => {
    const { container } = render(<App />);
    change('추첨 번호 개수', '2');
    fireEvent.click(screen.getByRole('button', { name: '고급 설정' }));
    fireEvent.click(screen.getByRole('switch', { name: '중복 허용' }));
    change('당첨자 수', '3');
    fireEvent.click(screen.getByRole('switch', { name: '한번에 추첨' }));
    fireEvent.click(screen.getByRole('button', { name: '추첨 시작' }));
    await finish();
    expect([...container.querySelectorAll('.winner-badge')].map((n) => n.textContent)).toEqual([
      '1',
      '1',
      '1',
    ]);
  });
  it('preserves browser Ctrl+S instead of intercepting it', () => {
    render(<App />);
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

it('aligns all-at-once pointer with the last displayed winning number', async () => {
  render(<App />);
  change('추첨 번호 개수', '2');
  fireEvent.click(screen.getByRole('button', { name: '고급 설정' }));
  change('당첨자 수', '2');
  fireEvent.click(screen.getByRole('switch', { name: '한번에 추첨' }));
  fireEvent.click(screen.getByRole('button', { name: '추첨 시작' }));
  await finish();
  const wheel = screen.getByRole('img');
  const rotation = Number(wheel.dataset['rotation']);
  const total = Number(wheel.dataset['total']);
  const pointerWinner = Math.floor(((360 - (rotation % 360)) % 360) / (360 / total)) + 1;
  expect(pointerWinner).toBe(Number(wheel.dataset['winning']));
});

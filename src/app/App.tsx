import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RouletteWheel } from '@/app/components/RouletteWheel';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Settings, X, RotateCcw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { selectWinners, selectNextWinner } from '@/utils/random';
import { validateNumberInput } from '@/utils/validation';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Confetti colors
const CONFETTI_COLORS = [
  '#C9302C',
  '#E8913A',
  '#D4A017',
  '#4A9B5F',
  '#2E7D9B',
  '#6B4FA0',
  '#D4527B',
  '#3A7CA5',
  '#E8C96A',
  '#2A8C6E',
];

function createConfetti() {
  if (
    typeof document === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '100';
  document.body.appendChild(container);

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const duration = 2 + Math.random() * 2;
    const size = 6 + Math.random() * 8;
    const shapes = ['50%', '0%', '30%'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    piece.style.position = 'fixed';
    piece.style.width = `${String(size)}px`;
    piece.style.height = `${String(size)}px`;
    piece.style.background = color ?? CONFETTI_COLORS[0] ?? '#C9302C';
    piece.style.borderRadius = shape ?? '50%';
    piece.style.left = `${String(left)}%`;
    piece.style.top = '-10px';
    piece.style.animation = `confetti-fall ${String(duration)}s linear ${String(delay)}s forwards`;
    piece.style.pointerEvents = 'none';
    piece.style.zIndex = '100';
    container.appendChild(piece);
  }

  setTimeout(() => {
    container.remove();
  }, 5000);
}

export default function App() {
  const [totalNumbers, setTotalNumbers] = useState(10);
  const [winnerCount, setWinnerCount] = useState(1);
  const [totalInput, setTotalInput] = useState('10');
  const [winnerInput, setWinnerInput] = useState('1');
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [drawAtOnce, setDrawAtOnce] = useState(false);
  const [autoDraw, setAutoDraw] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const totalValidation = validateNumberInput(totalInput, 2, 99);
  const winnerValidation = validateNumberInput(
    winnerInput,
    1,
    allowDuplicates ? 100 : totalNumbers
  );
  const hasInputError = !totalValidation.isValid || !winnerValidation.isValid;
  const autoDrawTimerRef = useRef<number | null>(null);
  const drawNextWinnerRef = useRef<(() => void) | null>(null);

  const drawAllAtOnce = useCallback(() => {
    setIsSpinning(true);

    try {
      const selectedWinners = selectWinners({
        totalNumbers,
        winnerCount,
        allowDuplicates,
      });

      const anglePerSegment = 360 / totalNumbers;
      const lastWinner = selectedWinners[selectedWinners.length - 1];
      if (lastWinner === undefined) {
        throw new Error('No winner selected');
      }
      const targetAngle = (lastWinner - 1) * anglePerSegment + anglePerSegment / 2;
      const spinRotations = 5;
      const finalRotation = spinRotations * 360 + (360 - targetAngle);

      setRotation(finalRotation);

      setTimeout(() => {
        setWinners(selectedWinners);
        setIsSpinning(false);
      }, 4000);
    } catch (error) {
      console.error('Lottery draw failed:', error);
      setIsSpinning(false);
      toast.error('추첨 중 오류가 발생했습니다. 브라우저가 최신 버전인지 확인해주세요.');
    }
  }, [totalNumbers, winnerCount, allowDuplicates]);

  const drawNextWinner = useCallback(() => {
    if (isSpinning || hasInputError || winners.length >= winnerCount) return;

    setIsSpinning(true);

    try {
      const newWinner = selectNextWinner(totalNumbers, winners, allowDuplicates);

      const anglePerSegment = 360 / totalNumbers;
      const targetAngle = (newWinner - 1) * anglePerSegment + anglePerSegment / 2;
      const spinRotations = 5;

      setRotation(0);

      setTimeout(() => {
        const finalRotation = spinRotations * 360 + (360 - targetAngle);
        setRotation(finalRotation);
      }, 50);

      setTimeout(() => {
        setWinners((prev) => [...prev, newWinner]);
        setIsSpinning(false);
      }, 4000);
    } catch (error) {
      console.error('Lottery draw failed:', error);
      setIsSpinning(false);
      toast.error('추첨 중 오류가 발생했습니다.');
    }
  }, [isSpinning, hasInputError, winners, winnerCount, totalNumbers, allowDuplicates]);

  drawNextWinnerRef.current = drawNextWinner;

  // Auto-draw effect
  useEffect(() => {
    if (
      autoDraw &&
      !drawAtOnce &&
      winners.length > 0 &&
      winners.length < winnerCount &&
      !isSpinning
    ) {
      autoDrawTimerRef.current = setTimeout(() => {
        drawNextWinnerRef.current?.();
      }, 1500);
    }

    return () => {
      if (autoDrawTimerRef.current) {
        clearTimeout(autoDrawTimerRef.current);
        autoDrawTimerRef.current = null;
      }
    };
  }, [autoDraw, drawAtOnce, winners.length, winnerCount, isSpinning]);

  // Confetti on completion
  useEffect(() => {
    if (winners.length > 0 && winners.length >= winnerCount && !hasShownConfetti && !isSpinning) {
      createConfetti();
      setHasShownConfetti(true);
    }
  }, [winners.length, winnerCount, hasShownConfetti, isSpinning]);

  const handleReset = useCallback(() => {
    setRotation(0);
    setWinners([]);
    setIsSpinning(false);
    setHasShownConfetti(false);
    if (autoDrawTimerRef.current) {
      clearTimeout(autoDrawTimerRef.current);
      autoDrawTimerRef.current = null;
    }
  }, []);

  const handleSpin = useCallback(() => {
    if (isSpinning || hasInputError) return;

    setWinners([]);
    setRotation(0);
    setHasShownConfetti(false);

    if (drawAtOnce) {
      drawAllAtOnce();
    } else {
      drawNextWinner();
    }
  }, [isSpinning, hasInputError, drawAtOnce, drawAllAtOnce, drawNextWinner]);

  const isDrawingComplete = useMemo(
    () => winners.length >= winnerCount && winners.length > 0,
    [winners.length, winnerCount]
  );

  const canDrawNext = useMemo(
    () => !drawAtOnce && winners.length < winnerCount && winners.length > 0,
    [drawAtOnce, winners.length, winnerCount]
  );

  useKeyboardShortcuts({
    onSpin: () => {
      if (!isSpinning && !isDrawingComplete) {
        if (winners.length === 0) {
          handleSpin();
        } else if (canDrawNext && !autoDraw) {
          drawNextWinner();
        }
      }
    },
    onReset: () => {
      if (!isSpinning && winners.length > 0) {
        handleReset();
      }
    },
  });

  const statusMessage = useMemo(() => {
    if (isSpinning) {
      return '추첨 중입니다...';
    }
    if (winners.length === 0) {
      return '추첨을 시작하려면 추첨 시작 버튼을 누르거나 S 키를 누르세요';
    }
    if (isDrawingComplete) {
      return `추첨이 완료되었습니다. 당첨 번호: ${winners.join(', ')}`;
    }
    if (canDrawNext) {
      return `${String(winners.length)}명 추첨됨. 현재까지 당첨 번호: ${winners.join(', ')}. 다음 추첨을 계속하려면 S 키를 누르세요`;
    }
    return '';
  }, [isSpinning, winners, isDrawingComplete, canDrawNext]);

  return (
    <div className="min-h-screen bg-background break-keep [overflow-wrap:anywhere] flex flex-col items-center px-4 py-6 sm:py-10">
      {/* Screen reader live region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <header className="text-center space-y-1 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            룰렛 추첨
          </h1>
          <p className="text-sm text-muted-foreground">숫자를 설정하고 행운의 번호를 뽑아보세요</p>
        </header>

        {/* Roulette Wheel Section */}
        <section
          className="relative rounded-2xl bg-card p-3 sm:p-4 card-festival"
          style={{ boxShadow: 'var(--warm-shadow)' }}
        >
          <RouletteWheel
            totalNumbers={totalNumbers}
            rotation={rotation}
            winningNumber={winners.length > 0 ? (winners[winners.length - 1] ?? null) : null}
            isSpinning={isSpinning}
          />

          {/* Keyboard hint - below wheel */}
          <div className="flex justify-center gap-3 pt-1 pb-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] font-medium bg-muted text-muted-foreground rounded border border-border/50">
                S
              </kbd>
              추첨
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] font-medium bg-muted text-muted-foreground rounded border border-border/50">
                R
              </kbd>
              리셋
            </span>
          </div>
        </section>

        {/* Winners Display */}
        {winners.length > 0 && (
          <section
            className="rounded-2xl overflow-hidden animate-slide-up"
            style={{
              background: '#C9302C',
              boxShadow: 'none',
            }}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h2 className="text-lg font-bold text-white">당첨 번호</h2>
              </div>

              <p className="text-sm text-white/70 mb-4">
                {drawAtOnce
                  ? '한번에 추첨된 결과입니다'
                  : isDrawingComplete
                    ? '추첨이 완료되었습니다!'
                    : `${String(winners.length)}/${String(winnerCount)}명 추첨됨${isSpinning ? ' (추첨 중...)' : ''}`}
              </p>

              <div className="flex flex-wrap gap-2.5">
                {winners.map((winner, index) => (
                  <div
                    key={index}
                    className="winner-badge flex items-center justify-center rounded-xl font-bold text-xl"
                    style={{
                      width: '52px',
                      height: '52px',
                      background: '#FFFFFF',
                      color: '#3A1A0A',
                      boxShadow: 'none',
                      animationDelay: `${String(index * 0.1)}s`,
                    }}
                  >
                    {winner}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Action Buttons */}
        {!showSettings && !winnerValidation.isValid && (
          <p role="alert" className="text-sm text-destructive">
            고급 설정의 당첨자 수를 확인해 주세요.
          </p>
        )}
        <div className="space-y-2.5">
          <button
            type="button"
            className="w-full h-13 sm:h-14 rounded-xl font-bold text-base sm:text-lg tracking-tight transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={winners.length === 0 ? handleSpin : drawNextWinner}
            disabled={
              isSpinning ||
              hasInputError ||
              (autoDraw && !drawAtOnce && winners.length > 0) ||
              isDrawingComplete
            }
            style={{
              background: isSpinning ? '#777777' : '#C9302C',
              color: '#FFF8F0',
              boxShadow: isSpinning ? 'none' : 'none',
              transform: isSpinning ? 'none' : undefined,
            }}
            onMouseDown={(e) => {
              if (!isSpinning) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
              }
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            {isSpinning
              ? '추첨 중...'
              : winners.length === 0
                ? '추첨 시작'
                : canDrawNext
                  ? `다음 추첨 (${String(winners.length)}/${String(winnerCount)})`
                  : '추첨 완료'}
          </button>

          {winners.length > 0 && (
            <button
              type="button"
              className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
              onClick={handleReset}
              disabled={isSpinning}
              style={{
                background: 'transparent',
                color: 'var(--muted-foreground)',
                border: '1.5px solid var(--border)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              다시 추첨
            </button>
          )}
        </div>

        {/* Settings Section */}
        <section className="rounded-2xl bg-card card-festival overflow-hidden">
          {/* Basic setting - always visible */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="totalNumbers" className="text-sm font-medium">
                추첨 번호 개수
              </Label>
              <div className="relative">
                <Input
                  id="totalNumbers"
                  type="text"
                  inputMode="numeric"
                  value={totalInput}
                  aria-invalid={!totalValidation.isValid}
                  aria-describedby="total-error"
                  onChange={(e) => {
                    const value = e.target.value;
                    setTotalInput(value);
                    handleReset();
                    const result = validateNumberInput(value, 2, 99);
                    if (result.isValid && result.sanitized !== null) {
                      setTotalNumbers(result.sanitized);
                      if (!allowDuplicates && winnerCount > result.sanitized) {
                        setWinnerCount(result.sanitized);
                        setWinnerInput(String(result.sanitized));
                      }
                    }
                  }}
                  disabled={isSpinning}
                  className="pr-8"
                  placeholder="2-99"
                />
                {totalNumbers > 2 && !isSpinning && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="번호 개수 초기화"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => {
                      setTotalNumbers(10);
                      setTotalInput('10');
                      if (!allowDuplicates && winnerCount > 10) {
                        setWinnerCount(10);
                        setWinnerInput('10');
                      }
                      handleReset();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!totalValidation.isValid && (
                <p id="total-error" role="alert" className="text-sm text-destructive">
                  {totalValidation.error}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                1부터 {totalNumbers}까지의 번호가 생성됩니다
              </p>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
            aria-controls="advanced-settings-panel"
            aria-expanded={showSettings}
            onClick={() => {
              setShowSettings((prev) => !prev);
            }}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              고급 설정
            </span>
            {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Advanced Settings Panel */}
          {showSettings && (
            <div
              id="advanced-settings-panel"
              className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-border/50 pt-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="winnerCount" className="text-sm font-medium">
                  당첨자 수
                </Label>
                <div className="relative">
                  <Input
                    id="winnerCount"
                    type="text"
                    inputMode="numeric"
                    value={winnerInput}
                    aria-invalid={!winnerValidation.isValid}
                    aria-describedby="winner-error"
                    onChange={(e) => {
                      const value = e.target.value;
                      setWinnerInput(value);
                      handleReset();
                      const result = validateNumberInput(
                        value,
                        1,
                        allowDuplicates ? 100 : totalNumbers
                      );
                      if (result.isValid && result.sanitized !== null)
                        setWinnerCount(result.sanitized);
                    }}
                    disabled={isSpinning}
                    className="pr-8"
                    placeholder={`1-${String(allowDuplicates ? 100 : totalNumbers)}`}
                  />
                  {winnerCount > 1 && !isSpinning && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="당첨자 수 초기화"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => {
                        setWinnerCount(1);
                        setWinnerInput('1');
                        handleReset();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {!winnerValidation.isValid && (
                <p id="winner-error" role="alert" className="text-sm text-destructive">
                  {winnerValidation.error}
                </p>
              )}
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label htmlFor="allowDuplicates" className="text-sm">
                    중복 허용
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    같은 번호가 여러 번 당첨될 수 있습니다
                  </p>
                </div>
                <Switch
                  id="allowDuplicates"
                  checked={allowDuplicates}
                  onCheckedChange={(checked) => {
                    setAllowDuplicates(checked);
                    if (!checked && winnerCount > totalNumbers) {
                      setWinnerCount(totalNumbers);
                      setWinnerInput(String(totalNumbers));
                    }
                    handleReset();
                  }}
                  disabled={isSpinning}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label htmlFor="drawAtOnce" className="text-sm">
                    한번에 추첨
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    룰렛 한번 회전으로 모든 당첨자 표시
                  </p>
                </div>
                <Switch
                  id="drawAtOnce"
                  checked={drawAtOnce}
                  onCheckedChange={(checked) => {
                    setDrawAtOnce(checked);
                    handleReset();
                  }}
                  disabled={isSpinning || autoDraw}
                />
              </div>

              {!drawAtOnce && (
                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoDraw" className="text-sm">
                      자동 연속 추첨
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      일정 간격으로 자동으로 추첨 진행
                    </p>
                  </div>
                  <Switch
                    id="autoDraw"
                    checked={autoDraw}
                    onCheckedChange={(checked) => {
                      setAutoDraw(checked);
                      handleReset();
                    }}
                    disabled={isSpinning}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

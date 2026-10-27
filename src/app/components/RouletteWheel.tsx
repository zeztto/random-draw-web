import { useCallback, useState, memo } from 'react';
import { logger } from '@/utils/logger';
import { AlertTriangle } from 'lucide-react';

interface RouletteWheelProps {
  totalNumbers: number;
  rotation: number;
  winningNumber: number | null;
  isSpinning?: boolean;
}

// Vibrant carnival color palette for wheel segments
const SEGMENT_COLORS = [
  '#C9302C', // crimson red
  '#E8913A', // warm orange
  '#D4A017', // rich gold
  '#4A9B5F', // forest green
  '#2E7D9B', // teal blue
  '#6B4FA0', // royal purple
  '#D4527B', // rose pink
  '#3A7CA5', // ocean blue
  '#C2681C', // burnt sienna
  '#2A8C6E', // emerald
];

function RouletteWheelComponent({
  totalNumbers,
  rotation,
  winningNumber,
  isSpinning,
}: RouletteWheelProps) {
  const [canvasError, setCanvasError] = useState<string | null>(null);

  const handleCanvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      try {
        if (!canvas) {
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setCanvasError(
            'Canvas 렌더링 컨텍스트를 가져올 수 없습니다. 브라우저가 Canvas를 지원하지 않습니다.'
          );
          logger.error('Failed to get 2D context from canvas');
          return;
        }

        setCanvasError(null);

        // High-DPI support
        const dpr = window.devicePixelRatio || 1;
        const displaySize = 320;
        canvas.width = displaySize * dpr;
        canvas.height = displaySize * dpr;
        ctx.scale(dpr, dpr);

        const size = displaySize;
        const centerX = size / 2;
        const centerY = size / 2;
        const outerRadius = size / 2 - 6;
        const innerRadius = outerRadius - 14; // Gold ring width
        const segmentRadius = innerRadius - 3;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // === Outer gold ring ===
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
        const goldGrad = ctx.createRadialGradient(
          centerX - 20,
          centerY - 20,
          0,
          centerX,
          centerY,
          outerRadius
        );
        goldGrad.addColorStop(0, '#F0D98A');
        goldGrad.addColorStop(0.5, '#C8962E');
        goldGrad.addColorStop(1, '#9A7420');
        ctx.fillStyle = goldGrad;
        ctx.fill();

        // Gold ring inner border (subtle inset)
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#9A7420';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // === Tick marks on gold ring ===
        const tickCount = Math.min(totalNumbers, 60);
        for (let i = 0; i < tickCount; i++) {
          const angle = (i * 2 * Math.PI) / tickCount - Math.PI / 2;
          const outerTick = outerRadius - 2;
          const innerTick = innerRadius + 2;

          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * innerTick, centerY + Math.sin(angle) * innerTick);
          ctx.lineTo(centerX + Math.cos(angle) * outerTick, centerY + Math.sin(angle) * outerTick);
          ctx.strokeStyle = 'rgba(255, 248, 240, 0.6)';
          ctx.lineWidth = i % 5 === 0 ? 2 : 1;
          ctx.stroke();
        }

        // === Decorative dots on gold ring ===
        const dotCount = Math.min(totalNumbers, 36);
        for (let i = 0; i < dotCount; i++) {
          const angle = (i * 2 * Math.PI) / dotCount - Math.PI / 2;
          const dotRadius = (outerRadius + innerRadius) / 2;
          const x = centerX + Math.cos(angle) * dotRadius;
          const y = centerY + Math.sin(angle) * dotRadius;

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 248, 240, 0.5)';
          ctx.fill();
        }

        // === Draw wheel segments ===
        const anglePerSegment = (2 * Math.PI) / totalNumbers;

        for (let i = 0; i < totalNumbers; i++) {
          const startAngle = i * anglePerSegment - Math.PI / 2;
          const endAngle = (i + 1) * anglePerSegment - Math.PI / 2;
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length] ?? '#C9302C';

          // Segment fill
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, segmentRadius, startAngle, endAngle);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();

          // Segment border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw number label
          if (totalNumbers <= 100) {
            const textAngle = startAngle + anglePerSegment / 2;
            const textRadius = segmentRadius * 0.68;
            const textX = centerX + Math.cos(textAngle) * textRadius;
            const textY = centerY + Math.sin(textAngle) * textRadius;

            ctx.save();
            ctx.translate(textX, textY);
            ctx.rotate(textAngle + Math.PI / 2);

            // Text shadow for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            const fontSize =
              totalNumbers > 50 ? 8 : totalNumbers > 30 ? 10 : totalNumbers > 15 ? 12 : 14;
            ctx.font = `bold ${String(fontSize)}px 'Noto Sans KR', system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), 0.5, 0.5);

            // White number text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(String(i + 1), 0, 0);
            ctx.restore();
          }
        }

        // === Center hub ===
        // Outer ring of hub
        ctx.beginPath();
        ctx.arc(centerX, centerY, 26, 0, 2 * Math.PI);
        const hubOuterGrad = ctx.createRadialGradient(
          centerX - 4,
          centerY - 4,
          0,
          centerX,
          centerY,
          26
        );
        hubOuterGrad.addColorStop(0, '#F0D98A');
        hubOuterGrad.addColorStop(0.6, '#C8962E');
        hubOuterGrad.addColorStop(1, '#9A7420');
        ctx.fillStyle = hubOuterGrad;
        ctx.fill();

        // Inner hub
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        const hubGrad = ctx.createRadialGradient(centerX - 6, centerY - 6, 0, centerX, centerY, 20);
        hubGrad.addColorStop(0, '#3A1A1A');
        hubGrad.addColorStop(1, '#1C0E0E');
        ctx.fillStyle = hubGrad;
        ctx.fill();

        // Hub highlight
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY - 4, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        setCanvasError(`Canvas 렌더링 중 오류 발생: ${errorMessage}`);
        logger.error('Canvas rendering error', error, {
          totalNumbers,
        });
      }
    },
    [totalNumbers]
  );

  // Show error fallback if canvas fails
  if (canvasError) {
    return (
      <div className="relative flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div className="space-y-2">
            <p className="font-medium text-destructive">룰렛을 표시할 수 없습니다</p>
            <p className="text-sm text-muted-foreground">{canvasError}</p>
            <p className="text-xs text-muted-foreground">
              최신 버전의 브라우저를 사용하고 있는지 확인해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center py-6">
      {/* Pointer - dramatic triangle with gold accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        <svg width="36" height="42" viewBox="0 0 36 42" fill="none">
          {/* Gold outline */}
          <path d="M18 42 L3 4 Q2 0 6 0 L30 0 Q34 0 33 4 Z" fill="#C8962E" />
          {/* Red fill */}
          <path d="M18 37 L6 5 Q5.5 3 7.5 3 L28.5 3 Q30.5 3 30 5 Z" fill="#C9302C" />
          {/* Highlight */}
          <path d="M18 32 L9 7 Q8.5 5.5 10 5.5 L16 5.5 L18 32 Z" fill="rgba(255,255,255,0.15)" />
        </svg>
      </div>

      {/* Wheel container */}
      <div
        data-slot="roulette-rotation"
        className={isSpinning ? 'wheel-spinning' : ''}
        style={{
          transform: `rotate(${String(rotation)}deg)`,
          transition: rotation === 0 ? 'none' : 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
        }}
      >
        <canvas
          ref={handleCanvasRef}
          className="max-w-full h-auto"
          style={{ width: '100%', maxWidth: '320px', height: 'auto', aspectRatio: '1 / 1' }}
          role="img"
          aria-label={
            winningNumber === null
              ? `룰렛 휠 (1부터 ${String(totalNumbers)}까지)`
              : `룰렛 휠 (1부터 ${String(totalNumbers)}까지), 최근 당첨 번호 ${String(winningNumber)}`
          }
        />
      </div>
    </div>
  );
}

export const RouletteWheel = memo(RouletteWheelComponent);

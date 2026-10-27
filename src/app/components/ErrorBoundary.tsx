import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { Button } from '@/app/components/ui/button';
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}
/** Keep rendering failures local; do not export stack, URL or device metadata. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('React rendering error', error, { componentStack: errorInfo.componentStack });
  }
  override render(): ReactNode {
    if (this.state.hasError)
      return (
        <main
          role="alert"
          className="min-h-screen bg-background p-6 flex flex-col items-center justify-center gap-4 break-keep"
        >
          <h1>화면을 표시할 수 없습니다</h1>
          <p>페이지를 새로고침한 뒤 다시 시도해 주세요.</p>
          <Button
            onClick={() => {
              window.location.reload();
            }}
          >
            페이지 새로고침
          </Button>
        </main>
      );
    return this.props.children;
  }
}

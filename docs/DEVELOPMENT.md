# 개발

React·TypeScript·Vite로 구성된 static frontend입니다. 주요 경로는 `src/app/App.tsx`(추첨 state), `src/app/components/RouletteWheel.tsx`(Canvas), `src/utils/random.ts`(선택), `src/utils/validation.ts`(검증), `src/hooks/useKeyboardShortcuts.ts`입니다.

README의 clean install → typecheck → test → build → audit 명령을 사용합니다. CI는 최소 read-only 권한으로 같은 필수 검사를 실행합니다. 기존 lint/format 도구를 유지하고 lint는 필수 CI gate에 포함합니다. 수정 전 실패는 검증 기록에 구분합니다.

테스트 fixture와 deterministic Crypto spy는 test 파일에만 있습니다. production entry는 test 코드를 import하지 않습니다. 원본의 분포 테스트는 통계적 smoke이며 실제 browser flow와 별도로 취급합니다.

`npm run test:coverage`는 고정된 `@vitest/coverage-v8`로 실행하며 `coverage/`에 local 보고서를 생성합니다. test·보고서·coverage fixture는 production entry에 포함하지 않습니다.

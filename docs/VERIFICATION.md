# 검증 기록

검증일: 2026-10-28. macOS, Node.js 26.8.1, npm 11.19.0의 local production build를 검사했습니다. 원격 CI·공개 source readback·실제 hosting header 적용은 별도 단계입니다.

| 검사 | 결과 |
| --- | --- |
| clean `npm ci --ignore-scripts --no-audit --no-fund` | 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 0 errors·0 warnings |
| `npm test` | 85/85, 4 files 통과 |
| `npm run format:check` | 통과 |
| `npm run test:coverage` | 85/85 통과, v8 provider 명시 |
| `npm run build` | 통과, 아래 경고 유지 |
| fresh npm audit | 0건 |

원본 66개를 실제 실행했고 회귀 19개를 추가했습니다. 기존 일부 테스트는 난수 분포의 통계적 smoke이며 공정성 인증·전체 UI 정확성의 증거로 확대하지 않습니다. 새 검사는 raw max NaN·소수·상한, rejection sampling의 reject/accept 경로, 배열 자원 제한, 순차 잔여 pool·reset, 중복 해제 clamp, 잘못된 raw draft, 다중 결과, 브라우저 단축키, 포인터와 마지막 결과 정렬을 포함합니다.

수정 전 strict lint 48개 오류를 보존했습니다. 규칙을 끄거나 source를 일괄 ignore하지 않고 TS config project 범위·Node 타입, unknown JSON·배열·index narrowing, String 변환, async act와 접근 가능한 heading 내용을 정리했습니다. CI에 원래 lint 검사를 포함합니다.

빌드에는 원본 UI의 `use client` directive를 처리하는 sourcemap 경고와 empty `vendor-react` chunk 경고가 남습니다. build 종료 코드는 0이며 실제 entry와 Canvas 동작은 browser QA로 별도로 검사합니다. source map이나 chunk 크기 경고를 숨기는 새 예외를 추가하지 않았습니다.

실제 browser에서는 entry와 Canvas, 숫자·당첨 수의 잘못된 raw 값 및 복구, 숨겨진 고급 설정의 오류 안내, 중복 해제 clamp, 순차 2/2·한번에·자동 2/2, S/R·reset 잠금, Crypto 오류와 Canvas fallback을 확인했습니다. 한번에 추첨이 끝난 뒤 포인터가 마지막 표시 번호를 가리키는 실제 pixel도 확인했습니다.

1440×900, 1024×768, 390×844, 360×800의 runtime 및 PNG를 확인했고 화면 내용의 가로 overflow는 없었습니다. 360px의 Canvas가 내부 폭에 맞게 줄어드는 실제 bbox를 확인했습니다. Ctrl 조합은 자동 회귀로, Meta/Alt 조합은 같은 guard의 코드 검토로 구분해 확인했습니다. 운영체제 저장 단축키를 실제 실행한 검증으로 확대하지 않습니다.

Gitleaks 8.30.1 기본 rule, 100% redaction, custom allowlist 없이 공개 directory를 검사하여 0건을 확인했습니다. 기존 private Git history는 공개·검사 대상에 섞지 않았습니다.

결과는 외부 인증 서비스가 제공하는 것이 아니며 모든 입력 조합·변경된 browser를 검증한 것으로 표현하지 않습니다.

선언되어 있던 coverage runner의 누락된 v8 provider를 동일 Vitest 4.1.12 버전으로 고정했습니다. Coverage는 instrument된 import 경로의 수치입니다. draw-flow의 Canvas stub 및 deterministic Crypto는 test-only이며, 해당 수치를 실제 Canvas·저장소 전체의 coverage나 공정성 증명으로 표현하지 않습니다. 실제 Canvas는 별도 browser QA로 확인했습니다. 새 coverage threshold는 추가하지 않았습니다.

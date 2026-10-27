# 변경 기록

## 1.1.0 — 2026-10-28

- 독립 source edition, patched lockfile, read-only CI 및 외부 MIT 고지를 구성했습니다.
- RNG의 NaN·소수·과도한 반복량을 거부하고 순차 추첨을 잔여 pool 선택으로 바꿨습니다.
- 입력 draft·중복 해제 clamp·설정 변경 reset과 브라우저 단축키 보존을 보강했습니다.
- 한번에 추첨의 포인터를 마지막 표시 번호와 일치시켰습니다.
- 흰 canvas·solid UI·기기 글꼴과 reduced-motion을 적용하고 실제 룰렛 메커니즘을 유지했습니다.
- 외부 오류 보고와 자동 진단 저장을 제거했습니다. 기존 lint 규칙을 유지해 타입·config 경계를 정리했고 수정 전 실패와 build 경고를 기록합니다.

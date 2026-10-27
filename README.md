# 룰렛 추첨

번호 개수와 당첨자 수를 설정해 브라우저에서 실행하는 숫자 추첨 도구입니다. Canvas 룰렛·포인터·회전과 순차·한번에·자동 연속 추첨을 제공합니다. 계정, 서버 API, 참가자 이름 목록, 결제·지갑 기능은 없습니다.

## 실행과 검사

Node.js 22.12 이상이 필요합니다. 검증 환경은 Node.js 26.8.1과 npm 11.19.0입니다.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
npm run preview
```

개발·미리보기 서버는 loopback에 바인딩하고 정적 bundle은 `dist/`에 생성합니다. 포함된 정적 hosting 헤더는 실제 hosting 환경에서 별도로 적용·검증해야 합니다. 공개 배포나 원격 CI 실행을 이 문서만으로 주장하지 않습니다.

## 사용과 상태

- 추첨 번호는 1부터 지정 개수까지이며, 개수는 2–99입니다.
- 고급 설정에서 당첨자 수를 바꿉니다. 중복 비허용은 번호 개수까지, 중복 허용은 최대 100명입니다.
- 순차 추첨은 4초 회전 뒤 한 번호를 추가하고 다음 추첨으로 이어갑니다. 한번에 추첨은 한 회전 뒤 요청한 결과 전체를 표시합니다.
- 자동 연속 추첨은 순차 결과 사이에 1.5초 간격을 둡니다. 회전 중에는 설정과 reset을 잠급니다.
- 잘못된 입력은 그대로 보여 주고 한국어 오류와 함께 추첨을 막습니다. 설정을 바꾸면 이전 결과를 초기화하며, 중복을 끄면 당첨자 수를 가능한 범위로 줄입니다.
- `S`는 시작·다음 추첨, `R`은 완료된 결과 초기화입니다. 입력 중 또는 Ctrl/Meta/Alt 조합에서는 단축키를 가로채지 않습니다.
- 결과·설정은 메모리에만 있으며 새로고침하면 기본 상태로 돌아갑니다. 자동 로그 저장·외부 보고·clipboard·export 기능은 없습니다.

## 난수와 경계

`crypto.getRandomValues()`의 Uint32 값에 rejection sampling을 적용하여 modulo reduction의 나머지 구간을 제외합니다. 중복 비허용 순차 추첨은 남은 번호 pool에서 선택합니다. 이 구현 설명은 독립적인 공정성 인증이나 결과 감사 기능을 뜻하지 않습니다. 실행하는 브라우저의 변경을 외부에서 검증하는 서비스는 아닙니다.

낮은 수준의 난수 함수는 유한한 정수 상한 1–2³²만 받습니다. 선택 helper의 배열·반복량은 10,000으로 제한하며 제품 화면은 더 좁은 2–99/100 범위를 적용합니다. Web Crypto가 없거나 실패하면 오류를 알리고 결과를 만들지 않습니다. Canvas를 사용할 수 없으면 화면에 fallback을 표시합니다.

## 검증과 도구 한계

기존 난수·검증 테스트 66개를 포함한 85개 테스트, TypeScript, production build, npm audit를 실행했습니다. 일부 기존 난수 분포 테스트는 확률적 관찰이며, UI 전체나 공정성의 증명으로 사용하지 않습니다. 추가 회귀는 실제 입력·중복 전환·순차 잔여 pool·reset·다중 결과·포인터 정렬·키보드 경계를 검사합니다.

기존 엄격한 ESLint 규칙을 유지하면서 config의 TS project 범위와 실제 unknown·배열·문자열 타입을 정리했습니다. `npm run lint`도 필수 CI 검사로 실행합니다. 수정 전 lint 실패와 build 경고는 [검증 기록](docs/VERIFICATION.md)에 구분합니다.

자세한 경계: [보안과 데이터](docs/SECURITY.md), [개발](docs/DEVELOPMENT.md), [정적 호스팅](docs/DEPLOYMENT.md), [변경 기록](CHANGELOG.md).

자체 코드: [MIT](LICENSE). 외부 고지: [ATTRIBUTIONS.md](ATTRIBUTIONS.md), [shadcn MIT](SHADCN-LICENSE.txt).

공식 문서: [React](https://react.dev/) · [Vite](https://vite.dev/guide/) · [Web Crypto getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) · [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

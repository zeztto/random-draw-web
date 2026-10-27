# 정적 호스팅

`npm run build`의 `dist/`를 static host에 제공합니다. `npm run preview`는 local 검토용 서버입니다. public 배포나 원격 CI는 local build 성공과 별개의 단계입니다.

Vercel용 `vercel.json`과 Netlify용 `public/_headers`는 원본의 선택적 host 설정입니다. 실제 적용 여부와 iframe 허용 범위는 배포 후 HTTP header로 확인해야 합니다. 일반 static server가 이 파일을 자동 적용한다고 가정하지 않습니다.

외부 font 다운로드를 사용하지 않습니다. 외부 service credential이나 환경 변수 없이 앱을 실행합니다. Canvas와 Web Crypto를 지원하는 browser가 필요하며 실제 오류 상태를 확인해야 합니다.

# 교육 참석 확인

QR로 접속한 교육 대상자가 권역 → 본부 → 이름을 선택하고 참석 여부를 제출하는 모바일 우선 웹앱입니다.

## 기능

- 125명 명단 기반 단계별 선택
- Vercel Functions + Private Vercel Blob 공유 저장소
- 한 사람당 한 번만 제출(기존 기록 확인 및 중복 방지)
- 참석/불참 제출 완료 메시지
- `/admin`에서 관리자 암호로 현황, 검색, 필터, CSV 다운로드

## 배포 환경 변수

- `BLOB_READ_WRITE_TOKEN`: 연결된 Private Vercel Blob 저장소가 자동으로 제공합니다.
- `ADMIN_KEY`: 관리자 화면에 사용할 강한 암호입니다.

## 로컬 확인

```bash
npm install
npm run check
vercel dev
```

관리자 주소는 `/admin`입니다.

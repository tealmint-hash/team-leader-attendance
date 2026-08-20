# 교육 참석 확인

QR로 접속한 교육 대상자가 권역 → 본부 → 이름을 선택하고 참석을 확인하는 모바일 우선 웹앱입니다.

## 교육 회차

- `2026-07`: 124명 명단과 기존 참석 기록 보존
- `2026-08`: 118명 명단으로 신규 참석 확인 진행

참석 기록은 Private Vercel Blob의 `attendance/{eventId}/{attendeeId}.json` 경로에 회차별로 분리됩니다.

## 기능

- 현재 교육 회차의 단계별 명단 선택
- 명단에 없는 예비 팀장 이름 직접 입력
- 회차별 중복 제출 방지
- `/admin`에서 7월/8월 전환, 검색, 상태 필터, CSV 다운로드
- Vercel Functions + Private Vercel Blob 공유 저장소

## 배포 환경 변수

- `BLOB_READ_WRITE_TOKEN`: 연결된 Private Vercel Blob 저장소가 제공합니다.
- `ADMIN_KEY`: 관리자 페이지 암호입니다.

## 로컬 확인

```bash
pnpm install
pnpm run check
vercel dev
```

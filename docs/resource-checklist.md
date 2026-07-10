# 3.5단계 — 리소스 체크리스트 (승인 필요)

> 작성일: 2026-07-10. 코딩 착수 전 사용자 승인 대상. 거부된 항목은 대체 방식으로 재설계.

## 1. 패키지 (npm)

| 패키지 | 용도 | 비용 |
|---|---|---|
| `next` | 프레임워크 | 무료(OSS) |
| `react`, `react-dom` | UI 라이브러리 | 무료(OSS) |
| `typescript` | 타입 시스템 | 무료(OSS) |
| `tailwindcss`, `postcss`, `autoprefixer` | 스타일링 | 무료(OSS) |
| `eslint`, `eslint-config-next` | 린팅(Next.js 표준) | 무료(OSS) |
| (테스트) `vitest` 또는 `jest` + `@testing-library/react` | TDD(4단계 필수) | 무료(OSS) |

별도 유료 라이브러리(폼 라이브러리, 애니메이션 라이브러리 등) 없음. 문답 상태관리는 React 기본
`useState`/`useReducer`로 충분(전역 상태 라이브러리 불필요 규모).

## 2. 외부 서비스

| 서비스 | 용도 | 권한/설정 필요사항 | 비용 |
|---|---|---|---|
| **Vercel** | 배포 호스팅 | GitHub 저장소 연결(신규 repo 생성 필요 — 현재 git 미초기화 상태) | 무료(Hobby 티어로 충분, 서버 로직 없음) |
| **Google Fonts (Spoqa Han Sans Neo)** | 폰트 CDN | 없음(공개 CDN, `@import` 또는 `next/font` 사용) | 무료 |
| 외부 API 호출 | 없음 | — | — |

- 자격 판정 데이터(`docs/eligibility-criteria.md` 기반 JSON)는 **빌드 시점에 정적으로 포함**되며,
  런타임에 nhuf.molit.go.kr 등 외부 사이트를 호출하지 않음(자격 기준이 자주 안 바뀌고, 정부 사이트에
  공식 API가 없으므로 스크래핑도 하지 않음 — 수동 갱신 전제, SPEC.md 8장 참조).
- 분석/트래킹 도구(GA 등) **미사용** — SPEC.md 개인정보 비저장 원칙과 일치.

## 3. 권한

| 항목 | 필요 여부 |
|---|---|
| GitHub 신규 저장소 생성 | **필요** — 현재 `for_Release/loan-eligibility-service`는 git 미초기화 상태. Vercel 배포 위해 저장소 연결 필요. 조직 계정(예: 기존 NFmkt) 사용 여부 확인 필요 |
| Vercel 계정 연동 | 필요(기존 계정 있으면 재사용) |
| 커스텀 도메인 | 불필요(MVP는 `*.vercel.app` 기본 도메인 사용) — 추후 필요 시 별도 승인 |

## 4. 배포 비용

- **Vercel Hobby(무료) 티어로 충분**: 정적 사이트 + 클라이언트 계산만 하므로 서버리스 함수/DB 사용 없음.
  트래픽이 매우 커지지 않는 한 무료 한도 내 운영 가능.
- 예상 월 비용: **$0**

## 5. 승인 필요 사항 요약

1. npm 패키지 목록(무료 OSS만, 특이사항 없음)
2. GitHub 신규 저장소 생성 여부 및 계정(개인 vs 조직)
3. Vercel 무료 티어 배포
4. 폰트/분석도구 등 추가 외부 서비스 없음(현재 계획 그대로 진행 시 추가 승인 불필요)

---

**승인 완료 (2026-07-10)**: 전체 리소스 승인됨. GitHub 신규 저장소는 **NFmkt 조직 계정**에 생성 확정
(기존 `notice-report`, `gobang-linktree`와 동일 계정 — 관리 일관성).

# 정부지원 전세대출 자격진단 서비스 — 인수인계 문서

> **목적**: savehome.kr(집지켜)의 "정부지원 대출 자격 확인" 기능의 원리를 파악하고,
> 이를 참고해 자체 **자격진단 페이지 서비스**를 만든다.
> 이 문서는 **다른 계정/세션에서 작업을 그대로 이어받기 위한** 핸드오프 노트다.
>
> - 위치: `my-claude/for_Release/loan-eligibility-service/`
> - 작성일: 2026-07-09 (최종 갱신 2026-07-12)
> - 상태: **`docs/issues.md` #1~#6 구현 완료, master에 병합됨**. 다음 작업은 #7(배포 + 시작 bat 파일, 마지막 이슈).
> - 상위 `my-claude/CLAUDE.md` 4단계 파이프라인 준수 대상.

---

## 0-7. ✅ 이슈 #6 완료 (2026-07-12)

`superpowers:writing-plans` 계획서 → `EnterWorktree` 격리 워크트리 → `subagent-driven-development`로
Task 1~3(명도 대비 토큰 조정 → 터치 타겟 44px+aria-pressed → prefers-reduced-motion) 구현·리뷰 승인
→ Task 4(반응형 QA)는 코드 변경 없이 컨트롤러가 직접 375/768/1024/1440px 라이브 검증만 수행 →
최종 전체 브랜치 리뷰에서 명도 대비 토큰이 흰 배경(4.73:1)만 통과하고 실제 주 사용처인
`--color-bg`(#F5F6F7) 배경에서는 4.37:1로 미달함을 발견 → `#686D73`로 재조정(흰 배경 5.22:1 /
`#F5F6F7` 배경 4.82:1, 양쪽 다 4.5:1 이상)하는 추가 커밋 후 master fast-forward 병합(`7009a4e`)
→ `ExitWorktree` 정리.

- 커밋: `890cb3e`(명도 대비 1차 `#8D9399`→`#6E7479`) → `3f1460a`(터치 타겟 44px+aria-pressed)
  → `845983d`(prefers-reduced-motion) → `9836efb`(최종 리뷰 반영, 명도 대비 2차 `#6E7479`→`#686D73`)
  → `7009a4e`(issues.md #6 체크리스트 반영)
- `npm test` 76/76 통과, `npm run build` 성공
- 컨트롤러가 직접 브라우저로 375/768/1024/1440px 4개 breakpoint 전부 라이브 검증(문답+결과 화면
  모두 가로 스크롤 없음, pill 버튼 44px 확인, fieldset/legend 구조 유지, DOM 순서=시각 순서 확인)
- **최종 리뷰 Minor 지적(비블로킹, 수용)**: 상품 카드 출처 링크(`<a>`)가 인라인 텍스트 링크라
  44px 미만이지만 WCAG 2.5.5/2.5.8이 문장 내 인라인 링크를 예외로 인정 — 실제 결함 아님.
- **운영 메모**: 이 세션에서 브라우저 자동화의 `computer` 툴이 `resize_window` 직후 좌표/ref 기반
  클릭을 안정적으로 처리하지 못하는 현상 발견(클릭이 등록되지 않음) — JS `.click()` 직접 호출로
  우회해 검증 완료. 도구 이슈로 판단(앱 결함 아님). 또한 클릭과 상태 확인을 같은 스크립트 안에서
  연속 실행하면 React 리렌더 커밋 전에 읽어 stale 값을 보게 됨 — 클릭과 상태 확인은 항상 별도
  호출로 분리할 것(이번 세션의 여러 "이상 현상"이 실제로는 전부 이 타이밍 문제였음, 앱 버그 아님).

**다음 할 일**: `docs/issues.md` #7(배포 + 시작 bat 파일 — 마지막 이슈. Vercel 배포 및 GitHub
저장소 생성은 사용자 승인 필요한 배포 작업이므로 진행 전 반드시 확인).

---

## 0-6. ✅ 이슈 #5 완료 (2026-07-12)

`superpowers:writing-plans`로 계획서 작성 → `EnterWorktree` 격리 워크트리 → `subagent-driven-development`로
Task 1~4 구현·리뷰 승인(컬러 토큰 정합성 수정 → 선택 pill 인터랙션 → 법적 고지 2종 → 상품별 출처/확인일자)
→ 최종 전체 브랜치 리뷰 "Ready to merge: Yes" → master fast-forward 병합(`8a821c4`) → `ExitWorktree` 정리.

- 커밋: `40e6d9e`(컬러 토큰 `#8A9099`→`#8D9399`+globals.css 임의 값 정리) → `d367742`(active:scale+
  선택 시 그림자) → `9c46309`(정확성 면책+개인정보 비저장 고지) → `eff73bd`(상품 카드 출처+확인일자)
  → `8a821c4`(issues.md #5 체크리스트 반영)
- `npm test` 76/76 통과, `npm run build` 성공
- 컨트롤러가 직접 브라우저로 11단계 전체 플로우 라이브 검증: 개인정보 비저장 고지(상단)+정확성
  면책(하단) 문구 정확히 노출, 상품별로 다른 출처 URL/확인일자 정상 표시, 비대상 카드는 출처 없음
- **최종 리뷰 Minor 지적(비블로킹)**: (1) 7개 `check*` 함수의 return 객체 shape 중복이 이슈 #4·#5를
  거치며 계속 커짐(~10곳, 9필드) — 향후 `buildResult()` 헬퍼로 통합 고려. (2) 자격 배지가
  `rounded-full`인데 design-system.md는 "작은 배지 4px"로 표기 — 이 브랜치가 만든 회귀는 아니고
  문서 표현의 모호함.
- **운영 메모**: Task 1·2 구현 서브에이전트가 이번에도 Bash cd는 워크트리로 정확히 했음에도
  Edit/Write 툴 호출이 가끔 master 저장소에 동일 내용을 추가로 남김(uncommitted 상태로 발견,
  워크트리 커밋과 내용 동일해 `git restore`로 정리). 이슈 #4에서 발견한 것과 같은 계열의 문제 —
  [[feedback_subagent_worktree_cwd]] 메모리 참조. 브라우저 자동화 도구도 이 세션에서 `computer`
  스크린샷이 반복 타임아웃(도구 자체 이슈로 판단, 앱 결함 아님) — `get_page_text`/`read_page`
  기반 검증으로 대체해 진행.

**다음 할 일**: `docs/issues.md` #6(반응형/접근성 QA).

---

## 0-5. ✅ 이슈 #4 완료 (2026-07-12)

`superpowers:writing-plans`로 계획서 작성(`docs/superpowers/plans/2026-07-12-issue4-loan-limit-rate-range.md`)
→ `EnterWorktree`로 격리 워크트리 생성 → `superpowers:subagent-driven-development`로 Task 1~3 구현·
태스크별 리뷰 전부 승인(Task 1은 구현 서브에이전트가 실수로 master에 직접 커밋한 것을 발견해 워크트리
브랜치로 cherry-pick 이전 후 master를 되돌려 복구) → 최종 전체 브랜치 리뷰 "Ready to merge: Yes" →
master에 fast-forward 병합(`31d29f0`) → `ExitWorktree`로 워크트리 정리.

- 커밋: `09d5350`(코어4개 상품 필드) → `e46a3cf`(니치3개 상품 필드+공식미확인) → `22708e3`(결과카드 UI)
  → `31d29f0`(issues.md #4 체크리스트 반영)
- `npm test` 69/69 통과, `npm run build` 성공
- 컨트롤러가 직접 브라우저로 라이브 검증(전세피해 체크 시 5개 카드 모두 대출한도·금리 accent-blue
  박스 정상 렌더링, 갱신만료·주거취약계층은 비대상으로 박스 없이 정상 제외)
- 최종 리뷰 Minor 지적(비블로킹): 7개 `check*` 함수의 return 객체 shape 중복이 이번 브랜치로 더
  늘어남(~10곳) — 향후 `buildResult()` 팩토리 등으로 통합 고려 가능하나 지금은 불필요.
- **운영 메모**: 서브에이전트에게 워크트리 경로로 `cd` 후 작업하라고 프롬프트에 적었는데도 Task 1
  구현 서브에이전트가 실제로는 master 저장소에 커밋함(harness가 EnterWorktree로 바꾼 세션 cwd를
  서브에이전트가 상속하지 않는 것으로 보임). 이후 태스크부터는 프롬프트에 "커밋 직전 `git branch
  --show-current`로 브랜치명 재확인, 아니면 BLOCKED로 중단" 규칙을 추가해 재발 없이 진행함.

**다음 할 일**: `docs/issues.md` #5(디자인 시스템 전면 적용 + 법적 고지, `docs/design-system.md`·
`SPEC.md` 6장 참조).

---

## 0-4. ✅ 이슈 #3 완료 (2026-07-12 확인)

구현 자체는 이전 세션에서 master에 이미 커밋되어 있었으나(`bf9fe08`~`058f7a2`), HANDOFF/issues.md/
메모리 갱신이 누락된 상태였음. 2026-07-12 세션에서 발견 후 `npm test`(62/62 통과) + 브라우저 라이브
검증(전세피해만 체크 → 7개 상품 중 전세피해만 판정, 나머지 니치 2종은 "비대상"으로 정상 구분,
네트워크 요청 0건)으로 재확인하고 문서를 갱신함.

- 커밋: `bf9fe08`(계획서) → `82e3133`(applicable 필드) → `c9ccd5a`(자기신고 필드+전세피해)
  → `971fd86`(갱신만료) → `9b2759c`(주거취약계층) → `77fac64`(checkAllProducts 집계)
  → `f2d154f`(체크박스 UI) → `058f7a2`(비대상 렌더링+페이지 조립)
- 계획서: `docs/superpowers/plans/2026-07-11-issue3-niche-self-report.md`

**다음 할 일**: `docs/issues.md` #4(대출한도·금리 range 표시).

---

## 0-3. ✅ 이슈 #2 완료 (2026-07-11)

`superpowers:writing-plans`로 계획서 작성(`docs/superpowers/plans/2026-07-11-issue2-full-questionnaire.md`) →
`superpowers:subagent-driven-development`로 격리 워크트리에서 Task 1~7 전부 구현·리뷰 승인 완료,
최종 전체 브랜치 리뷰 "Ready to merge: Yes" 판정 후 master에 fast-forward 병합함.

- 커밋: `6142728`(Applicant확장+무주택게이트+버팀목일반 신혼기준) → `4a2010a`(청년전용) → `e55e635`(신혼부부전용)
  → `571ef22`(신생아특례) → `a2f3aed`(checkAllCoreProducts 집계) → `c124f5e`(11단계 위저드) → `9e712a8`(페이지조립, 이슈 #2 완성)
- `npm run build` 성공, `npm test` 37/37 통과
- 컨트롤러가 직접 브라우저로 11단계 전체 플로우 라이브 검증(4개 상품 모두 "자격 충족" 렌더링, 네트워크 호출 없음, "다시 하기" 정상)
- **알려진 스코프 단순화(결함 아님, 계획서 Global Constraints에 명시)**: "집 결정여부"·"보유 대출"·"연체이력"은 답변만 수집하고 판정 미사용(공식 판정축 밖). 청년전용 "25세 미만 단독세대주 60㎡" 예외는 나이만으로 판정(세대구성 문항 없음). 니치 3종은 이슈 #3 몫.
- **최종 리뷰 Important 지적(비블로킹, 추적 필요)**: `app/globals.css`의 Spoqa 폰트 외부 CDN(`spoqa.github.io`) `@import`가 페이지 로드마다 제3자 서버로 요청을 보냄(개인정보 전송은 아니지만 방문자 IP 노출) — 이슈 #1에서 이미 도입됨, **이슈 #5(디자인시스템)에서 자체 호스팅으로 교체 필요**.
- Minor 지적(선택): 4개 상품 함수 간 reasons 배열 순서 비일관(cosmetic), `formatManwon`의 `toLocaleString()`이 런타임 로케일에 의존(`'ko-KR'` 고정 권장), 청년전용 다자녀2+ elevated tier 및 경계값(정확히 한도) 테스트 미비.

**다음 할 일**: `docs/issues.md` #3(니치 3종 자기신고: 전세피해·갱신만료·주거취약계층 + 판정 통합).

---

## 0-2. ✅ 이슈 #1 완료 (2026-07-11)

`superpowers:subagent-driven-development`로 격리 워크트리에서 Task 1~4 전부 구현·리뷰 승인 완료,
최종 전체 브랜치 리뷰 "Ready to merge: Yes" 판정 후 master에 fast-forward 병합함.

- 커밋: `d0b72eb`(스캐폴딩) → `b4c970d`(자격판정 순수함수+JSON, 테스트 7개) → `d9493bd`(5단계 문답 위저드)
  → `a55174b`(결과화면 조립, 이슈 #1 완성)
- `npm run build` 성공, `npm test` 7/7 통과, 네트워크 호출 0건(개인정보 미전송) 확인됨
- 사소한 후속 메모(블로킹 아님): Spoqa 폰트가 외부 CDN(`spoqa.github.io`) `@import` — 이슈 #5(디자인 시스템)에서 자체 호스팅 고려. 경계값(정확히 한도 값) 테스트 미비 — 선택사항.
- Next.js 버전은 계획서의 15가 아닌 16.2.10로 스캐폴딩됨(create-next-app@latest 결과) — 이후 이슈 작업 시 참고.

**다음 할 일**: `docs/issues.md` #2(전체 11단계 문답 확장, 코어 4개 상품) 착수. 착수 전 별도 리서치(대출한도·금리 range,
HANDOFF 1장 5번)는 #2~#3 진행에는 불필요, #4에서 필요.

---

## 0-1. ✅ 스펙 충돌 해소 (2026-07-11)

2026-07-10 self-review에서 발견된 충돌(`docs/issues.md` #1의 "핵심 문항 4개" vs 승인기준의
"보증금·면적 상한 정확 판정")을 사용자에게 재질문하여 해소함.

**결정: (A) 보증금 질문을 추가해서 5개 문항으로 확장**(지역/전용면적/전세보증금/연소득/순자산).
승인기준을 완전히 만족시키는 방향.

반영 완료:
- `docs/issues.md` #1 — 문항 4개→5개, 결정 근거 각주 추가
- `docs/superpowers/plans/2026-07-10-e2e-tracer.md` — Task 2(`Applicant`에 `depositKrw` 추가,
  `checkBootmokGeneral`에 보증금 상한 판정 로직·테스트 2건 추가, 총 7개 테스트), Task 3(문답에
  보증금 입력 스텝 추가, 5단계 위저드로 확장), Task 4(수동 확인 절차 문구 갱신)

**다음 할 일**: `superpowers:subagent-driven-development`로 계획서 Task 1부터 순서대로 실행.

**현재 git 상태**: 로컬 저장소만 초기화됨(`git init` 완료, baseline 커밋 1개 — 문서 전체).
**GitHub 원격 저장소는 아직 생성 안 함**(3.5단계에서 NFmkt 조직 계정 사용 확정만 해둔 상태, 실제 repo 생성은 이슈 #7 배포 단계 또는 그 이전 편한 시점에).

---

## 0. 지금까지 결정된 것 (Decisions Log)

| 항목 | 결정 |
|---|---|
| 최종 목표 | 정부지원 전세대출 **자격진단 페이지** 서비스 구축 (for_Release) |
| 참고 레퍼런스 | https://savehome.kr/loans-gov/intro (집지켜) — 리버스 엔지니어링 완료(아래 2장) |
| 리서치 범위 | **주택도시기금 전세대출 전체 상품** |
| 정리 항목 | 각 상품별 **자격요건 전체** (대상/무주택/소득/자산/나이/대상주택/우대·특례) |
| 소스 제약 | **공신력 있는 공식 정부 도메인만** 사용 (아래 3장). 2차 출처 전면 배제 |

---

## 1. 다음 작업자가 할 일 (TODO — 이어서 진행)

### 1순위: 공식 자격요건 리서치 (**대부분 완료** → `docs/eligibility-criteria.md`)
2026-07-09 진행: 핵심 전세상품 **4개 완료**(버팀목 일반·청년전용 버팀목·신혼부부전용·신생아특례),
**중기청 전월세보증금대출은 부분**(원문 페이지 404로 재조회 필요), niche 상품 3종 미조회.
남은 항목은 `docs/eligibility-criteria.md`의 "미완료/추가 확인 대상" 섹션에 URL과 함께 정리됨.
아래 "리서치 프롬프트"는 재실행/보완용으로 유지.

**리서치 프롬프트 (그대로 사용):**
> 주택도시기금(nhuf.molit.go.kr / 기금e든든)에서 현재(2026년) 운영 중인 '전세자금대출' 정부지원
> 상품 전체의 자격요건을 상품별로 정리하라. 대상 상품 예: 일반 버팀목전세자금, 청년전용 버팀목전세자금,
> 중소기업취업청년 전월세보증금대출, 신혼부부전용 전세자금, 신생아 특례 전세자금대출 등 현재 운영 중인
> 기금 전세상품 전부. 각 상품마다: (1)대상자/무주택 요건, (2)연소득 한도(단독/부부 합산), (3)순자산 한도,
> (4)나이 조건, (5)대상주택 조건(보증금 상한, 전용면적 상한, 수도권/비수도권 구분),
> (6)신혼·자녀·다자녀 등 우대/특례 조건.
>
> **절대 제약**: 공식 정부 도메인만 소스로 사용 (3장 목록). 블로그·언론·부동산카페·은행 마케팅 페이지 배제.
> 모든 수치는 출처 URL 명시. 공식 소스 미확인 값은 추정 금지, '공식 미확인' 표기. 2026년 현행 기준인지 확인.

**산출물**: `docs/eligibility-criteria.md` — 상품별 자격요건 표 + 각 수치 옆에 출처 URL.

### 그 다음 (자격진단 서비스 개발 — CLAUDE.md 파이프라인 순서)
1. ~~**1단계 스펙 확정**~~ → **완료(2026-07-10)**: `@grill-me`로 확정. 결과물 → `docs/SPEC.md`
2. ~~**2단계 디자인**~~ → **완료(2026-07-10)**: 레퍼런스 youthissue.vercel.app 실제 CSS 추출 + 틸 컬러 확정. 결과물 → `docs/design-system.md`, `docs/design-reference-youthissue.md`
3. ~~**3단계 이슈 분할**~~ → **완료(2026-07-10)**: `@to-issues`로 7개 수직 슬라이스 등록. 결과물 → `docs/issues.md`
4. ~~**3.5단계 리소스 체크리스트**~~ → **승인 완료(2026-07-10)**: GitHub 신규 저장소는 NFmkt 조직 계정. 결과물 → `docs/resource-checklist.md`
5. **개발 착수 전 별도 리서치**: 상품별 대출한도·금리 range 확보 (`docs/SPEC.md` 8장, `docs/issues.md` #4 참조) — #1~#3은 이 리서치 없이 바로 진행 가능
6. **4단계 TDD + `@frontend-design`** 구현 (`@superpowers:subagent-driven-development`) — `docs/issues.md`의 #1부터 순서대로 ← **다음 작업**
7. 루트에 `시작 {포트}.bat` 생성 (기존 포트 중복 금지, `docs/issues.md` #7)

---

## 2. 레퍼런스 분석 — savehome.kr "자격 확인" 원리 (리버스 엔지니어링 완료)

### 2.1 아키텍처
- **프론트엔드**: Next.js (Turbopack). 자격 판정 로직은 프론트에 없음.
- **백엔드 API**: `https://api.savehome.kr` (자격 매칭은 **서버에서** 수행 → 코드 열람 불가, 입출력 역추론만 가능)
- 즉 프론트는 문답 답변만 수집해 API로 전송하고 결과만 렌더링.

### 2.2 화면 흐름 (라우트)
```
/loans-gov/intro                              (홍보 배너)
/loans-gov/recommends/steps/[step]            (문답 마법사 — 자격 입력)
/loans-gov/recommends/[id]/loading            (판정 중)
/loans-gov/recommends/[id]                    (추천 결과 목록)
/loans-gov/recommends/[id]/outputs/[index]    (개별 대출 상세)
```

### 2.3 API 계약 (`api.savehome.kr`)
```
POST /v1/jeonse-loans/recommends                       (집 결정한 경우)
POST /v1/jeonse-loans/recommends-without-subject       (집 미정인 경우)
GET  /v1/jeonse-loans/recommends/{recommendId}
POST /v1/jeonse-loans/recommends/{recommendId}/server-side-sort
GET  /v1/jeonse-loans/total-amount
GET  /v1/reports/{reportId}/insurance-loans-condition
```
payload 주요 필드: `incomeFamilyYearlyRange`, `assetLevel`, `deposit`, `area`, `region`,
`subject`, `loansPresence`, `children`, `age`

### 2.4 문답으로 수집하는 입력값 (= 자격 판정 변수) — **우리 서비스 폼 설계의 기준**

| 항목 | 선택지(버킷) |
|---|---|
| 이사할 집 결정 여부 | 결정했어요 / 나중에 결정 |
| 지역 | 수도권(서울·인천·경기) / 비수도권 |
| 집 크기(전용면적) | 60㎡ 이하 / 60~85㎡ / 85㎡ 이상 (평수: 18평↓ / 18~25평 / 25평↑) |
| 전세보증금 | 직접 입력 (예: 3억 3,700만 원 기준선 노출) |
| 주택 소유 | 무주택 / 1주택 / 2주택 이상 / 공공임대 거주 중 |
| 결혼·가구 | 미혼·외벌이 / 신혼부부(혼인 7년↓ 또는 3개월 내 예정) / 자녀 2명↑ / 대출기준일 2년 내 출산·입양 |
| 연소득 | 3,500만↓ / 5,000만↓ / 6,000만↓ / 7,000만↓ … (중위소득 이하/초과) |
| 순자산 | 1.3억↓ / 3.37억↓ 등 |
| 보유 대출 | 없음 / 주택담보·전세자금·주택도시기금·신용·기타 (상환 예정 여부 확인) |
| 특이사항 | 중소기업 재직·청년창업 / 혁신도시 이전기관 종사자·재개발 입주자 / 연체·부도 이력 |
| 나이 | 만 나이 직접 입력 |

> **핵심 인사이트**: savehome의 서버 알고리즘은 못 읽지만, 이 상품들은 전부 **주택도시기금 정부지원
> 전세자금대출**이고 그 자격 기준(소득/자산/보증금/면적 상한 등)은 **공식 사이트에 공개**돼 있다.
> 따라서 "원리"는 공식 기준표로 **재구성 가능**하다. → 1장 리서치가 그 재구성 작업.

---

## 3. 허용 소스 (공신력 있는 공식 도메인만)

| 도메인 | 기관/용도 |
|---|---|
| `nhuf.molit.go.kr` | 주택도시기금 포털 (상품별 자격·금리·한도 원본) |
| `enhuf.molit.go.kr` | 기금e든든 (온라인 신청·자격) |
| `molit.go.kr` | 국토교통부 |
| `khug.or.kr` | 주택도시보증공사(HUG) |
| `hf.go.kr` | 한국주택금융공사 |
| `gov.kr` | 정부24 |

**배제**: 블로그, 언론, 부동산 카페, 은행 마케팅 페이지 등 모든 2차/비공식 출처.
**규칙**: 모든 수치 옆에 출처 URL. 공식 미확인 값은 추정 금지 → '공식 미확인' 표기. 2026년 현행 기준 확인 필수.

---

## 4. 유의사항
- 자격 기준 금액은 **연도별로 바뀐다**. 반드시 현행(2026) 기준인지 확인하고, 문서에 기준 시점을 명시할 것.
- 이 서비스는 **참고용 자격진단**이며 확정 심사가 아님 — 최종 판단은 기금e든든/은행 심사라는 고지 문구 필요.
- savehome의 상표·문구·디자인을 그대로 베끼지 말 것 (원리·공개 기준만 참고).

---
name: update-game
description: PokéSurvivor 원본 게임 업데이트에 맞춰 한국어 번역과 확장 기능을 갱신한다. 이 저장소에서 게임 업데이트, 새 버전 대응, 미번역 조사, upstream 스냅샷 비교를 요청할 때 사용한다. 기준 스냅샷 비교부터 공식 용어 확인, 호환성 검증, 패키징과 기준 갱신까지 수행한다.
---

# PokéSurvivor 업데이트

저장소 루트에서 명령을 실행하라. 기존 스냅샷·검사 스크립트·번역 경로를 재사용하라.

## 1. 작업 상태 확인

- `AGENTS.md`, `git status --short`, 현재 브랜치와 원격 상태를 확인하라. 사용자 변경을 보존하고 최신 브랜치·push 지시를 적용하라.
- 필요한 원격 변경은 작업 상태를 확인한 뒤 fast-forward로 반영하라. 사용자가 `main` 직접 반영을 지시했다면 해당 브랜치에서 완료하라.
- 스냅샷 구조와 검사 설명이 필요하면 [개발 안내](../../../docs/development.md)를 읽어라.

## 2. 기준 스냅샷과 비교

```sh
npm run upstream:check
```

- `upstream/current/manifest.json`과 `_workspace/upstream-candidate/manifest.json`의 게임 버전·파일 SHA-256을 확인하라.
- `_workspace/upstream-candidate/diff.json`의 `sourceChanges`와 `changes`를 읽고 `locale`, `news`, `strings`, `catalogs`, `modules`의 변경을 추적하라.
- 원본 변경이 있으면 관련 함수 본문도 대조하라. `modules`는 공개 구조만 요약하므로 구조가 같아도 동작은 달라질 수 있다.
- `source/` 원본과 `extracted/` 데이터를 필요한 부분만 읽어라. 이전 버전은 Git 이력에서 찾아라.
- 추출 오류의 원인을 확인하라. 게임 구조 변화로 `scripts/upstream-extract.mjs`를 수정하면 `EXTRACTOR_VERSION`을 올려라. 재실행해 실제 변경과 추출 방식의 차이를 구분하라.
- 내려받은 원본 폴더를 다시 비교하려면 `npm run upstream:check -- --from <폴더>`를 사용하라.
- 원본과 추출 데이터가 모두 같으면 동일 버전임을 보고하고 패키징 검증으로 마무리하라.

## 3. 번역과 기능 갱신

- 신규·수정 문구는 `extension/translations/`의 기존 분야별 파일에 추가하라. 스페인어·영어 원문, 변수 개수·순서, 수치와 조건을 보존하라.
- 포켓몬·기술·도구·특성·성격은 기존 사전과 PokéAPI 한국어 명칭을 대조하라. `npm run check:names`를 활용하고 새 명칭도 공식 자료로 확인하라.
- `Psychic`은 타입에서 `에스퍼`, 기술에서 `사이코키네시스`로 구분하라. `translateMove`와 native `move` 범위를 재사용하라.
- native 사전 등록, fallback 번역, DOM·Canvas 표시, 반복 번역을 함께 확인하라. `translate="no"` 안의 사용자명·UID·방 코드는 원문 그대로 유지하라.
- 원본 카탈로그가 바뀐 항목은 관련 `tests/fixtures/official-game-*.json`과 기술 설명 데이터도 갱신하라. 원문을 전부 확인한 범위에 맞춰 fixture의 기준 URL을 기록하라.
- 동작 변경은 관련 기능에 한정해 확인하라.

| 기능 | 구현 |
| --- | --- |
| 번역·화면 배치 | `native-locale.js`, `translation-core.js`, `content.js`, `canvas.js`, `korean.css` |
| 전투 정보·기술 설명 | `hud.js`, `move-tooltips.js`, `move-tooltip-data.js` |
| 이펙트 투명도 | `effects.js` |
| 보유 목록·검색 | `collection.js`, `owned-pokemon.mjs`, `pokemon-search.mjs` |
| 멀티 플레이 설정 | `network.js`, `storage.js` |
| 임시 근접 조준 보정 | `temp-melee-target.js`, `docs/temporary-melee-fix.md` |

표의 JS·CSS 경로는 `extension/` 기준이다. 변경한 로직은 기존 테스트에서 검증하고 필요한 회귀 사례를 추가하라.

## 4. 검증

```sh
npm test
npm run test:browser
npm run test:live
npm run check:names
npm run audit:translations -- en
npm run audit:translations -- es
```

- 실제 사이트 검사는 저장소의 임시 브라우저 검증 경로를 사용하라. 사용자 Chrome과 진행 중인 판을 보존하고, 계정·점수·저장 요청은 기존 검사처럼 차단하라.
- `audit:translations`의 번들 hook이나 모듈 식별자가 바뀌면 `scripts/audit-live-translations.mjs`를 수정하고 두 언어를 다시 검사하라. 미번역·오류·잘못된 용어는 원인을 해결하라.
- 바뀐 화면은 작은 창과 데스크톱에서 확인하라. 기능 설정은 저장·새로고침·끄기·켜기까지 확인하라.
- 검사에 사용한 실제 번들의 버전·SHA와 candidate가 일치하는지 확인하라. 작업 도중 후보를 다시 내려받았다면 변경 범위를 재검증하라.
- Windows 전용 검사나 실계정·두 PC 검증처럼 실행하지 못한 범위는 결과에 명시하라.

## 5. 버전·기준 저장·패키징

- 배포할 확장 변경이 있으면 `package.json`, `package-lock.json`, `extension/manifest.json`의 버전을 함께 올려라.
- `THIRD_PARTY_NOTICES.md`의 검증 번들·날짜를 갱신하라.
- 검증을 마친 후보를 기준 스냅샷으로 저장하라.

```sh
npm run upstream:accept
git diff -- upstream/current
npm test
npm run package
```

- `accept`가 검사하는 파일 해시·추출 재현성에 더해 앞 단계의 번역·기능 검증 결과도 확인하라.
- 최신 ZIP의 버전과 내용이 현재 확장 소스와 일치하는지 확인하라. 원본 게임 스냅샷은 개발용 경로에 보관하라.
- 의미 있는 변경 단위로 로컬 커밋하라. 사용자가 승인한 범위에서 push하고, 배포를 요청했다면 Pages·스토어 CI의 실제 결과까지 확인하라. 스토어 심사 대기와 공개 완료를 구분하라.
- 최종 답변에 게임·확장 버전, 변경 요약, 검사 결과, 커밋·push 상태, 설치 ZIP 경로와 미검증 범위를 짧게 보고하라.

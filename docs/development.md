# 개발 안내

[README로 돌아가기](../README.md) · [기여 안내](../CONTRIBUTING.md)

Chrome extension은 `extension/` 안의 JavaScript와 CSS를 그대로 사용합니다. 테스트에는 Node.js 24 이상과 npm이 필요합니다. 압축 파일은 Windows에서는 기본 `tar.exe`, 다른 환경에서는 `zip`으로 생성합니다.

## 번역 처리와 권한

Manifest V3 확장 프로그램이며 런타임 의존성은 없습니다. 번역 데이터를 확장 프로그램에 포함해 기기 안에서 처리합니다. 외부 번역 서비스나 API key는 사용하지 않습니다.

`native-locale.js`는 게임 시작 전에 `PS_LOCALES`에 `ko`와 `ko-KR`을 추가하고 `PS_LANG_Q`에 한국어 사전을 등록합니다. 게임의 번역 함수가 문장을 조합하거나 Canvas 설명을 줄바꿈하기 전에 한국어를 반환합니다. 기술명과 타입이 겹치는 `Psychic`은 게임의 `move` 번역 범위로 구분합니다. 원본의 번역 제외 영역이나 직접 그리는 문구는 기존 DOM·Canvas 보완 처리를 함께 사용합니다.

게임의 언어는 시작할 때 결정되므로 언어 전환 시 새로고침합니다. 확장 프로그램의 설정을 읽기 전에는 초기 설정 이벤트를 보내지 않으며, 기기에 저장한 시작 설정과 다른 경우 한 번 새로고침해 맞춥니다. 게임의 언어 목록에서 선택한 언어와 팝업 설정을 함께 반영합니다.

`storage` 권한은 한국어 모드 설정과 티어 데이터를 저장하는 데 씁니다. `scripting` 권한으로 팝업을 열거나 새로고침할 때 공식 게임의 Firebase 로그인 계정 ID에 해당하는 `ps.cloud.*` 저장 데이터에서 보유 도감 번호만 읽습니다. 기존 로컬 계정은 `ps.session`을 따릅니다. 다른 계정의 저장 데이터와 인증 토큰은 읽지 않으며, 게임 계정·저장 데이터·점수는 수정하지 않습니다. 게임 페이지 접근 범위는 `https://pokesurvivor.com/*`, `https://www.pokesurvivor.com/*`와 그 안의 iframe입니다.

티어·순위와 도감 번호를 연결하기 위해 `https://pokesurvivor.net/tier-list/`, `https://pokesurvivor.net/pokedex/`를 내려받습니다. 받은 HTML에서 표만 읽고 코드를 실행하지 않으며, 결과를 하루 동안 저장합니다. 갱신 실패 시 마지막으로 저장한 목록임을 표시합니다. 티어 사이트에는 보유 목록을 전송하지 않습니다. 이미지는 PokéAPI sprites의 공개 GIF·PNG 주소에서 필요할 때 불러오므로 이미지 요청 URL에 해당 도감 번호가 포함되지만, 계정 정보나 게임 저장 데이터는 전송하지 않습니다. 동작 줄이기 설정이 켜져 있으면 PNG를 사용합니다. 게스트는 저장된 보유 목록이 없으므로 로그인 안내를 표시합니다.

기본 게임 문구 1,188개와 추가 메뉴·안내문을 번역합니다. 포켓몬 이름·별칭 1,041개와 기술명은 PokéAPI의 한국어 데이터를 기준으로 합니다.

Neo둥근모 폰트를 게임 페이지·전투 표시·팝업에 사용합니다. 폰트 파일은 확장 프로그램에 포함하며, 공식 게임 도메인에서 해당 파일만 불러올 수 있도록 `web_accessible_resources`로 허용합니다. 원본 폰트의 고지 파일은 `extension/fonts/neodgm/`에 보존합니다.

공식 사이트에 새로 추가된 기술 설명과 최신 업데이트 내역 등은 일부 원문으로 표시됩니다. `audit:translations`는 이런 미번역 문구도 보고하고 실패 상태로 종료합니다.

로그인·회원가입 전용 `/game-auth` 페이지는 언어별 경로를 포함해 패치 적용 범위에서 제외합니다. 이 페이지에는 번역 코드, Canvas 처리, 설정 전달 코드와 CSS를 주입하지 않습니다.

## 성능 표시와 측정 범위

팝업의 `debug`는 `chrome.storage.local`의 별도 불리언 설정이며 기본값은 `false`입니다. `debug.js`는 게임 문서의 isolated world에서 실행됩니다. 언어 전환 이벤트를 보내지 않으므로 체크 변경만으로 게임을 새로고침하지 않습니다.

켜져 있고 탭이 보일 때만 자체 `requestAnimationFrame` 콜백 하나와 `PerformanceObserver`의 `longtask` 관찰을 사용합니다. 프레임 카운터와 채널별 최근 30초(최대 31개)의 간격 요약만 유지하고 약 1초마다 Shadow DOM 안의 텍스트·SVG 그래프를 갱신합니다. 번역용 관찰자와 게임 스타일이 이 표시에 관여하지 않습니다. 끄기·탭 숨김·페이지 이탈 시 콜백과 관찰자를 해제하고, 다시 보일 때 측정 구간을 초기화합니다. 계측용 네트워크 요청, 성능 로그 저장, DevTools 녹화는 하지 않습니다.

FPS는 **자체 rAF 콜백 빈도**이며 실제 게임 렌더링 FPS나 디스플레이 표시 FPS가 아닙니다. 프레임 간격은 평균과 최댓값, 50ms 초과 간격은 횟수로 표시합니다. 긴 작업은 브라우저가 제공하는 50ms 이상 메인 스레드 작업이며 미지원 시 이를 표시합니다. `performance.memory.usedJSHeapSize`는 Chromium의 비표준 추정치로, 전체 프로세스·GPU 메모리나 메모리 누수 판정에 사용할 수 없습니다. 네트워크 지연도 측정하지 않습니다.

API 범위: [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [PerformanceLongTaskTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming), [performance.memory](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory).

### 2026-11-07 플레이 기록 검토

제공된 `Trace-20261107T135344.json.gz`를 브라우저에 재생하지 않고 분석했습니다. 아래 수치는 렌더러 메인 스레드 PID 20940 / TID 3688 기준입니다. CPU 프로파일은 서비스 워커와 노드 번호가 겹치므로 `(pid, profile id)`별로 분리했습니다.

| 항목 | 결과 |
| --- | --- |
| 메인 CPU 샘플 구간 | 56.193초 |
| 애니메이션 콜백 | 10,043회 / 56.139초, 약 179회/초 |
| 콜백 간격 중앙값 / 95백분위 / 최댓값 | 5.558 / 6.058 / 17.056ms |
| 50ms 이상 RunTask | 1회, 77.887ms; 녹화 시작의 CPU 프로파일러 초기화 포함 |
| RunTask 시간 합계 | 11.316초; CPU 사용률이나 GPU 사용률을 뜻하지 않음 |
| JS 힙 카운터 범위 | 약 15.9–44.9MiB |
| 확장 스크립트 CPU self 샘플 | 10.519ms |

게임 렌더 함수의 inclusive CPU 샘플은 3.125초이고, 그 안의 HUD draw가 1.260초, 월드 draw가 1.191초입니다. 부모·자식 시간은 겹치므로 합산하지 않습니다. HUD 소스는 매번 텍스트·그라데이션·상태 표시를 다시 그리고, 월드 소스는 표시 개체 목록을 생성·정렬한 뒤 그립니다. 확장을 껐다는 측정 조건과 별개로 `canvas.js` 래퍼가 실제 CPU 샘플에 있으므로, 확장 코드가 전혀 없는 비교군이라고 단정할 수 없습니다.

최적화 후보는 다음 순서로 비교할 수 있습니다. 이 버전은 아래 게임 최적화를 적용하지 않습니다.

1. **그리기 빈도 제한:** 기록에서는 약 180Hz로 게임 루프가 돕니다. 게임 상태 갱신·입력·멀티 동기화는 유지하고 그리기만 60/90Hz로 제한하는 비교가 우선입니다. 글로벌 rAF를 가로채면 다른 UI나 게임 시간 처리까지 바뀔 수 있으므로 피합니다. 그리기 횟수가 줄어도 전체 성능이 같은 비율로 개선된다고 보장할 수 없습니다.
2. **HUD 재사용:** 바뀐 수치만 갱신하고, 고정 배경·라벨·그라데이션은 캐시합니다. HUD 시간이 렌더 샘플의 약 40%인 것이 근거입니다. 이동·쿨다운 등 연속 표시와 입력 hitbox는 별도로 유지해야 합니다.
3. **월드 렌더링 비용 감소:** 정적 지형·장식 캐시와 매 프레임 생성·정렬하는 목록 재사용을 검토합니다. 겹침 순서·시야 판정을 유지하며 실제 병목 변화로 검증해야 합니다. 게임에 이미 있는 화질·피해 숫자·효과 설정도 같은 장면에서 비교할 수 있습니다.

이 기록은 반복적인 메인 스레드 장시간 정체를 보여주지 않습니다. 멀티플레이 상대 이동 지연은 FPS와 별개로 RTT·지터·동기화 수신 간격이 필요하며 이 기록만으로 원인을 확정하지 않습니다. 충돌 원인, 녹화하지 않은 실제 플레이 성능 및 위 후보들의 개선 효과도 이 자료만으로 검증되지 않았습니다.

### 참가자에게만 보이는 몬스터 위치 끊김

추가 제보는 다른 사람의 방에 참가했을 때 내 이동·스크롤은 부드럽지만 몬스터가 제자리에서 걷다가 위치를 건너뛰는 현상입니다. 제공된 trace에 포함된 `app.min.js?v=31fb6167ae`의 원격 몬스터 처리에는 다음 동작이 있습니다. 현재 접속 중인 게임의 코드나 연결 상태를 다시 측정한 결과는 아닙니다.

- `netUpdate`는 받은 좌표와 추정 속도로 최대 0.3초 앞까지 예측합니다. 그 뒤에는 예측 목표 좌표가 더 전진하지 않습니다. 현재 좌표와 목표 좌표의 거리가 160 게임 단위를 넘으면 보간 없이 목표로 이동합니다.
- 수신 처리는 직전 패킷과의 **수신 시각 차이**로 속도를 추정합니다. 간격이 20ms 초과·1초 미만일 때만 속도를 계산하고, 범위를 벗어나면 속도를 0으로 설정합니다. 지연된 패킷이 몰려 들어올 때 예측이 멈출 수 있는 구조입니다.
- 상태 전송 주기는 정상 `direct` 분기에서 약 67ms, 그 외 분기에서 약 333ms입니다. 후자는 실제 게임 상태 전송이 계속 성공한다는 보장이 없으며, 제보자의 연결이 이 분기라는 증거도 없습니다. WebRTC의 TURN 경유도 게임 내부에서는 `direct`일 수 있어 이 분기를 TURN과 동일시하면 안 됩니다.
- 빠른 데이터 채널은 순서 보장·재전송 없이 상태를 보냅니다. 전송 대기량이 4KiB를 넘으면 이번 상태 전송을 생략하고, 패킷이 16KiB를 넘으면 일반 전송 경로로 넘깁니다. 일반 채널은 순서를 보장합니다. 많은 몬스터가 실제로 이 한계를 넘겼는지는 전송량 측정이 필요합니다.

우선 확인할 지표는 참가자의 상태 수신 간격·마지막 수신 후 경과 시간, 방장의 상태 전송 간격·대기량, 연결 RTT입니다. 수신 지터가 확인되면 송신 시각 기반 속도 추정과 짧은 스냅샷 버퍼의 보간을, 방장 전송 지연이면 방장의 부하·전송량을 개선하는 순서입니다. 예측 시간을 무작정 늘리거나 순간 이동 보정을 제거하면 화면상 위치가 실제 판정과 더 멀어질 수 있습니다. 현재 debug는 채널별 송수신 간격과 송신 큐를 제공하지만 RTT 및 메시지 내용별 분류는 제공하지 않으며, 이 현상의 원인 확정이나 수정 완료를 뜻하지 않습니다.

### 송수신 간격 계측

게임에서 생성하거나 수신한 `RTCDataChannel` 중 `s`(빠른 상태)와 `g`(일반)를 WeakRef로 추적합니다. debug가 켜지고 탭이 보이며 채널이 열렸을 때만 개별 채널의 `send`를 Proxy로 감싸고 `message` 리스너를 붙입니다. 원본 호출의 인수·반환값·예외는 유지하며 성공한 호출만 셉니다. payload는 읽거나 저장하지 않습니다. 중단 시 원래 send 속성을 복구하고 리스너를 제거합니다. 닫힌 연결·채널은 요약에서 제외합니다.

`performance.now()`로 이벤트 간격을 누적하며, 약 1초마다 별도 `psko:network-timing` 이벤트로 숫자 요약을 전달합니다. 느린 getStats 응답이 그래프를 막지 않도록 경로 조회와 별도로 처리합니다. isolated world는 입력값을 검증하고 연결·채널별로 30초의 최대 간격을 저장합니다. 서로 다른 연결을 합치지 않습니다. 진행 중인 무소식 시간도 최대 간격에 포함해 완전한 수신 중단을 표시합니다. 평균은 해당 구간에 완료된 간격들의 평균이며, 누적 최댓값은 체크 변경·탭 숨김 후 초기화합니다.

송신 시각은 실제 패킷 출발이나 상대 수신 확인이 아닙니다. 수신 시각에는 네트워크뿐 아니라 로컬 이벤트 루프 지연도 섞입니다. 큰 상태 메시지는 g로 넘어갈 수 있으므로 s만으로 상태 전송 중단을 단정하면 안 됩니다. 게임 일시정지·메뉴·비활성 상태와 일반 채널의 드문 메시지도 공백을 만듭니다. 두 PC의 로컬 연결 번호는 서로 대응하지 않습니다.

API 기준: [send](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/send), [송신 큐](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/bufferedAmount).

### LAN 옵션과 실제 연결 경로

`network.js`는 MAIN world에서 게임 코드보다 먼저 `RTCPeerConnection` 생성자를 Proxy로 감쌉니다. 게임 문서에서 `lanDirect`가 켜져 있을 때만 새 연결 설정의 `iceTransportPolicy`를 `all`로 바꾸고, ICE 서버·인증·나머지 옵션은 보존합니다. 꺼져 있거나 게임이 아닌 문서는 원래 설정을 그대로 전달합니다. 기존 연결을 재설정하거나 종료하지 않습니다. 원본 생성자의 정적 메서드·프로토타입·서브클래스 동작을 유지합니다.

`storage.js`가 `lanDirect`와 `debug` 불리언을 전달하며, 언어 설정 이벤트와 분리합니다. 초기 저장 설정을 읽는 동안 발생한 네트워크 설정 변경은 오래된 초기값으로 덮지 않습니다. 페이지에서 받은 이벤트로 LAN 설정을 저장하지 않습니다.

연결은 WeakRef로 추적하고 닫힌 연결은 목록에서 제외합니다. debug가 켜져 있고 문서가 보일 때만 약 1초마다 `getStats()`를 요청하며, 이전 요청이 진행 중이면 중복 실행하지 않습니다. `transport.selectedCandidatePairId`에 해당하는 양 끝 후보 중 하나라도 `relay`면 TURN, 둘 다 `host`/`srflx`/`prflx`면 직결로 분류합니다. 단순히 TURN 후보가 존재하거나 `nominated`인 것만으로는 실제 사용 경로라고 판단하지 않습니다. 실패·미연결·조회 실패는 별도 상태로 표시합니다. 후보 IP·SDP·TURN 인증정보는 화면이나 로그에 남기거나 isolated world로 전달하지 않고 경로별 개수만 전달합니다.

`직결`은 TURN 미경유라는 뜻이며 LAN 주소 사용 여부를 확정하지 않습니다. `all`은 LAN 전용이나 직결 강제가 아니며 TURN도 사용될 수 있습니다. 실제 선택 경로의 RTT는 아직 표시하지 않습니다. 메시지 간격 그래프는 위의 별도 계측을 사용합니다.

검증: 네이티브 Chrome에서 중계 전용 설정을 전달한 두 테스트 연결이 LAN 옵션을 통해 직접 연결되고 debug에 반영되는 것을 확인합니다. TURN 경유·혼합 경로·조회 실패는 고정된 stats 자료로 검사하며, 실제 두 PC 사이의 LAN 및 외부 TURN 서버를 이용한 검증은 별도로 필요합니다.

API 기준: [선택된 후보 쌍](https://developer.mozilla.org/en-US/docs/Web/API/RTCTransportStats/selectedCandidatePairId), [후보 종류](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidateStats/candidateType).

## 개발 환경과 검사

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
npm run package
```

`npm test`는 번역 처리와 데이터 검증을 실행합니다. `npm run test:browser`는 Playwright로 extension의 브라우저 동작을 확인합니다. `npm run package`는 `extension/manifest.json`의 버전에 맞는 `dist/pokesurvivor-korean-<버전>.zip`을 만듭니다. ZIP 최상위에 `manifest.json`과 확장 프로그램 파일들이 들어 있으므로, 압축을 풀어 생긴 폴더 자체를 Chrome에 불러오면 됩니다.

실제 사이트에서 확인하려면 `npm run test:live`를 실행합니다. 임시 브라우저에서 공식 `.com`에 게스트로 접속해 설정과 플레이 화면을 확인하고 `test-results/live/`에 스크린샷을 남깁니다. 접속 전부터 서버에 저장하는 요청을 차단해 테스트 점수가 등록되지 않게 합니다.

명칭을 다시 대조하려면 `npm run check:names`를 실행합니다. 이 개발 명령은 최신 PokéAPI CSV를 내려받아 포켓몬 이름·별칭, 기존 번역과 현재 기술머신 목록의 기술 162개, 타입, 지방명, 도구명을 확인합니다. 현재 기술머신 103종의 이름과 설명은 `tests/fixtures/official-game-moves.json`을 기준으로 빠짐없이 검사합니다. 게임 내부 기술 ID가 표시 이름과 다른 경우가 있어 표시 이름을 기준으로 비교합니다. `Psychic`은 타입에서 `에스퍼`, 기술에서 `사이코키네시스`로 구분합니다.

전체 UI의 잔여 원문 검사는 다음 명령으로 실행합니다.

```sh
npm run audit:translations -- en
npm run audit:translations -- es
```

임시 Chrome에서 실제 게임의 화면 생성 함수를 이용해 언어별 화면·상태를 확인합니다. 성격 진단, 설정 전체 탭, 도감, 강화, 뽑기, 미션, 업데이트 내역, 모든 기본·진화 기술과 도구 카드, 연계, 결과 화면이 포함됩니다. 테스트 중 내려받은 코드에만 검사 진입점을 붙이며, 사용자 Chrome 프로필과 게임 계정은 사용하지 않습니다. 접속 전부터 서버에 저장하는 요청을 차단합니다. 결과는 `test-results/translation-audit-en.json`, `test-results/translation-audit-es.json`에 기록되며, 허용된 고유명사·단축키 이외의 원문이나 실행 오류가 발견되면 명령이 실패합니다. 로그인·연결 실패처럼 화면에서 임의로 발생시키지 않는 안내는 정적 문구와 회귀 테스트로 확인합니다.

주요 파일은 다음과 같습니다.

| 경로 | 역할 |
| --- | --- |
| `extension/manifest.json` | Manifest V3 설정과 적용할 사이트 |
| `extension/translations/` | 게임 문구와 포켓몬 이름 번역 |
| `extension/native-locale.js` | 게임 번역 등록 경로에 한국어 추가와 언어 전환 |
| `extension/translation-core.js` | 문구와 변수가 포함된 문장의 번역 처리 |
| `extension/content.js` | 메뉴 번역과 게임 안의 한국어 버튼 |
| `extension/canvas.js` | Canvas에 그리는 전투 텍스트 번역 |
| `extension/storage.js` | 언어 설정 저장과 전달 |
| `extension/debug.js` | 선택적으로 켜는 게임 성능 지표 |
| `extension/hud.js` | Canvas 전투 HUD의 이름·HP·버프 1.5배 확대 |
| `extension/network.js` | 새 WebRTC 연결의 직결 허용과 실제 사용 경로 판별 |
| `extension/popup.html`, `extension/popup.js` | 확장 프로그램 팝업 |
| `extension/owned-pokemon.mjs` | 현재 계정의 보유 목록 읽기, 티어 표 검증과 순위 연결 |
| `tests/` | 번역 처리 및 브라우저 검증 |

번역을 수정할 때는 스페인어·영어 원문을 유지하고 한국어 문구를 바꿉니다. `{x}`는 이름이나 숫자가 들어갈 자리이므로 개수와 순서를 보존하세요.


## 자동 배포

`tools/windows-lan/`은 사용자가 관리자 권한으로 직접 실행하는 선택적 Windows 방화벽 도구입니다. `npm run package`는 확장 ZIP의 `windows-lan/` 폴더와 별도 `dist/pokesurvivor-lan-helper.zip`에 동일한 도구를 넣습니다. 기기별 IP 설정 파일이나 `dist/`의 진단 자료는 포함하지 않습니다. PowerShell 소스는 Windows PowerShell 5.1에서 한글이 깨지지 않도록 UTF-8 BOM을 유지합니다.

`npm test`는 Windows에서 `tests/windows-lan.test.ps1`도 실행합니다. CIDR·포트 검증, 규칙 범위, 실패 시 되돌리기와 삭제 확인을 모의 방화벽으로 검사하며 실제 허용 규칙을 만들지 않습니다.

GitHub Actions는 `main` 변경 또는 수동 실행 시 확장 프로그램과 소개 페이지를 빌드하고 GitHub Pages에 바로 배포합니다. CI에서는 검사를 실행하지 않으며, 설치용 ZIP은 소개 페이지에서 내려받을 수 있습니다. 단위 테스트, 브라우저 테스트, 실제 사이트 검사와 PokéAPI 대조는 필요할 때 위 명령으로 로컬에서 실행합니다.

## 프로젝트 소개 페이지

`site/`에는 한국어·영어 소개 페이지가 있습니다. 문구와 스타일을 수정한 뒤 다음 명령으로 빌드합니다.

```sh
npm run package
npm run build:site
```

`dist/site/`에 HTML, 이미지, 설치 ZIP과 사이트맵을 모읍니다. 페이지에 표시하는 버전과 다운로드 파일명은 `extension/manifest.json`을 따릅니다. README의 다운로드 주소는 버전이 바뀌어도 유지되는 `downloads/pokesurvivor-korean.zip`입니다. `main`에 푸시하면 해당 commit으로 GitHub Pages에 바로 게시합니다.

각 언어의 제목·설명·대표 주소와 언어별 주소 연결은 `site/index.html`, `site/en/index.html`에 있습니다. 검색용 문구도 해당 언어의 본문과 맞춰 작성합니다. 사이트맵 주소는 `https://evan-choi.github.io/pokesurvivor-kor/sitemap.xml`입니다. 검색엔진의 수집·검색 노출 여부는 별도로 확인해야 합니다.

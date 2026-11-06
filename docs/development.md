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

## 개발 환경과 검사

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
npm run package
```

`npm test`는 번역 처리와 데이터 검증을 실행합니다. `npm run test:browser`는 Playwright로 extension의 브라우저 동작을 확인합니다. `npm run package`는 `dist/pokesurvivor-korean-0.2.3.zip`을 만듭니다. ZIP 최상위에 `manifest.json`과 확장 프로그램 파일들이 들어 있으므로, 압축을 풀어 생긴 `pokesurvivor-korean-0.2.3/` 폴더 자체를 Chrome에 불러오면 됩니다.

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
| `extension/popup.html`, `extension/popup.js` | 확장 프로그램 팝업 |
| `extension/owned-pokemon.mjs` | 현재 계정의 보유 목록 읽기, 티어 표 검증과 순위 연결 |
| `tests/` | 번역 처리 및 브라우저 검증 |

번역을 수정할 때는 스페인어·영어 원문을 유지하고 한국어 문구를 바꿉니다. `{x}`는 이름이나 숫자가 들어갈 자리이므로 개수와 순서를 보존하세요.


## 자동 검사

GitHub Actions는 `main` 변경, Pull Request, 수동 실행에서 의존성 취약점 검사, 단위 테스트, 브라우저 테스트와 패키징을 실행합니다. 성공한 실행의 Artifacts에서 설치용 ZIP을 내려받을 수 있습니다. 실제 사이트 검사와 PokéAPI 대조는 네트워크와 외부 서비스에 의존하므로 필요할 때 위 명령으로 실행합니다.

## 프로젝트 소개 페이지

`site/`에는 한국어·영어 소개 페이지가 있습니다. 문구와 스타일을 수정한 뒤 다음 명령으로 빌드합니다.

```sh
npm run package
npm run build:site
```

`dist/site/`에 HTML, 이미지, 설치 ZIP과 사이트맵을 모읍니다. 페이지에 표시하는 버전과 다운로드 파일명은 `extension/manifest.json`을 따릅니다. README의 다운로드 주소는 버전이 바뀌어도 유지되는 `downloads/pokesurvivor-korean.zip`입니다. `main`의 CI가 통과하면 검사한 commit으로 GitHub Pages에 게시합니다.

각 언어의 제목·설명·대표 주소와 언어별 주소 연결은 `site/index.html`, `site/en/index.html`에 있습니다. 검색용 문구도 해당 언어의 본문과 맞춰 작성합니다. 사이트맵 주소는 `https://evan-choi.github.io/pokesurvivor-kor/sitemap.xml`입니다. 검색엔진의 수집·검색 노출 여부는 별도로 확인해야 합니다.

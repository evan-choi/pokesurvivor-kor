# PokeSurvivor 한국어 모드

[PokeSurvivor](https://pokesurvivor.pro/)의 게임 메뉴, 포켓몬 이름, 기술 설명과 전투 표시를 한국어로 바꾸는 비공식 Chrome extension입니다. 게임 설정에 `한국어` 버튼을 추가하며, 번역은 기기 안에서 처리합니다.

## 설치

Chrome 119 이상이 필요합니다. 설치를 위한 빌드나 Node.js는 필요하지 않습니다.

1. 이 프로젝트를 내려받아 압축을 풉니다.
2. Chrome 주소창에 `chrome://extensions`를 입력합니다.
3. 오른쪽 위의 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다**를 누르고, 이 프로젝트 안의 `extension/` 폴더를 선택합니다. `manifest.json`이 있는 폴더입니다.
5. [게임 페이지](https://pokesurvivor.pro/play)를 열거나, 이미 열려 있다면 새로고침합니다.

처음 설치하면 한국어 모드가 켜져 있습니다. 프로젝트 파일을 갱신한 뒤에는 `chrome://extensions`에서 이 확장 프로그램의 새로고침 버튼을 누르고 게임 페이지도 새로고침하세요.

## 언어 바꾸기

- 게임 안의 **Settings → Graphics → Language**에서 **한국어**를 선택합니다. 한국어 모드에서는 **설정 → 그래픽 → 언어**로 표시됩니다.
- 같은 곳에서 **English** 또는 **Español**을 선택하면 한국어 모드를 끄고 게임의 원래 언어로 돌아갑니다. 원래 언어를 바꾸면 게임이 새로고침될 수 있습니다.
- Chrome 툴바에서 확장 프로그램 아이콘을 눌러 **한국어로 플레이**를 켜거나 끌 수도 있습니다. 자주 사용한다면 Chrome의 확장 프로그램 메뉴에서 아이콘을 고정하세요.

선택한 한국어 모드 설정은 저장되며, 다음에 게임을 열 때도 적용됩니다.

## 번역 범위

게임의 기본 문구 1,188개와 포켓몬 이름·별칭 1,041개를 포함합니다. 메뉴, 캐릭터 선택, 기술과 강화 설명, 퀘스트, 설정, 전투 중 표시되는 텍스트가 대상입니다. 게임에서 새로 나타나는 메뉴와 카드에도 번역을 적용합니다.

다음은 번역 대상에서 제외됩니다.

- 게임 바깥의 사이트 안내문과 외부 로그인 페이지
- 채팅·닉네임 등 사용자가 입력하는 내용
- 원래 게임이 번역하지 않도록 지정한 내용
- 일부 Arceus 등장 연출처럼 글자를 한 글자씩 그리는 애니메이션 제목

게임이 업데이트되어 문구나 화면 구조가 바뀌면 일부 텍스트가 원문으로 남을 수 있습니다. 확인되지 않은 문구를 추측해서 바꾸지 않습니다.

## 권한과 데이터

확장 프로그램은 `storage` 권한으로 한국어 모드의 켜짐·꺼짐 설정을 저장합니다. 페이지 접근 범위는 `https://pokesurvivor.pro/*`와 `https://www.pokesurvivor.pro/*`, 그리고 해당 페이지에서 여는 게임 iframe입니다.

번역 데이터는 확장 프로그램에 포함되어 있습니다. 외부 번역 서비스, API key, 별도 번역 서버를 사용하지 않습니다. 게임 계정, 저장 데이터, 점수는 수정하지 않습니다.

## 개발

Chrome extension은 `extension/` 안의 JavaScript와 CSS를 그대로 사용합니다. 테스트에는 Node.js와 npm이, 압축 파일 생성에는 `zip` 명령이 필요합니다.

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
npm run package
```

`npm test`는 번역 처리와 데이터 검증을 실행합니다. `npm run test:browser`는 Playwright로 extension의 브라우저 동작을 확인합니다. `npm run package`는 `dist/pokesurvivor-korean-0.1.0.zip`을 만듭니다. 압축을 풀고 그 안의 `extension/` 폴더를 Chrome에 불러오면 됩니다.

실제 사이트에서 확인하려면 `npm run test:live`를 실행합니다. 임시 브라우저에서 게스트로 접속해 설정과 플레이 화면을 확인하고 `test-results/live/`에 스크린샷을 남깁니다. 플레이 시작 전부터 서버에 저장하는 요청을 차단해 테스트 점수가 등록되지 않게 합니다.

주요 파일은 다음과 같습니다.

| 경로 | 역할 |
| --- | --- |
| `extension/manifest.json` | Manifest V3 설정과 적용할 사이트 |
| `extension/translations/` | 게임 문구와 포켓몬 이름 번역 |
| `extension/translation-core.js` | 문구와 변수가 포함된 문장의 번역 처리 |
| `extension/content.js` | 메뉴 번역과 게임 안의 한국어 버튼 |
| `extension/canvas.js` | Canvas에 그리는 전투 텍스트 번역 |
| `extension/storage.js` | 언어 설정 저장과 전달 |
| `extension/popup.html`, `extension/popup.js` | 확장 프로그램 팝업 |
| `tests/` | 번역 처리 및 브라우저 검증 |

번역을 수정할 때는 스페인어·영어 원문을 유지하고 한국어 문구를 바꿉니다. `{x}`는 이름이나 숫자가 들어갈 자리이므로 개수와 순서를 보존하세요.

## 출처

게임 문구는 PokeSurvivor의 공개 배포본 `c31715d-game-auth-popup-overlay-20261017`을 기준으로 작성했습니다. 원본 게임 제작자는 [JPTER78](https://github.com/JPTER78/pokesurvivor)이며, 해당 게임 코드의 라이선스는 [PolyForm Noncommercial 1.0.0](https://github.com/JPTER78/pokesurvivor/blob/main/LICENSE-NONCOMMERCIAL.md)입니다. 이 프로젝트에는 원본 게임의 실행 코드, 이미지, 음악을 포함하지 않습니다.

포켓몬 이름은 [PokeAPI 데이터](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv)를 사용하며, 해당 데이터의 BSD-3-Clause 라이선스 전문을 [pokemon.js](extension/translations/pokemon.js) 주석에 보존합니다. Pokémon 및 관련 명칭의 권리는 각 권리자에게 있습니다. 이 확장 프로그램은 원본 게임 제작사나 권리자가 제공하는 공식 한국어판이 아닙니다.

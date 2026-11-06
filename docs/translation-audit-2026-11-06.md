# 2026-11-06 번역 누락 조사

## 0.2.3 감수 결과 반영

0.2.2의 감수 결과에 따라 한국어 번역 38행을 수정했다. 스페인어·영어 원문과 변수 자리 수는 유지했다.

- 시리즈명은 ‘불가사의 던전’, 기존 도구 5종은 ‘잠들기구슬·둔화의구슬·날려버리기구슬·빛의구슬·발빠름구슬’로 맞췄다. 해당 명칭은 위키의 다국어 대응표를 기준으로 하며, 공지 속 언급도 함께 맞췄다. Focus Orb는 게임 고유 명칭으로 ‘집중의 구슬’을 사용한다.
- 같은 기능을 가리키는 표현을 ‘도감·영웅·기술 연계·도구’로 통일했다. Repertoire는 효과에 맞춰 ‘시작 기술 확장’으로 정리했다.
- 조이스틱은 ‘이동형·위치 고정형·터치 고정형’으로 구분하고, 설정·설명·공지에 같은 용어를 사용했다.
- 사람 확인 문구, 무적 상대에게 최대한 피해를 주라는 안내, 소수점 표기 2종을 보완했다.
- 짓궂은마음의 강화 기술 대기시간은 실제 코드에서 0.7을 곱하므로 ‘재사용 대기시간 30% 감소’로 명확히 했다. 역린은 ‘거세게 회전하며 주변 적을 연속으로 공격합니다’로 바꿔 즉사 효과처럼 읽히는 표현을 없앴다.
- 노가드는 현재 구현에서 확인되는 주는 피해·받는 피해 배율을 안내한다. 구현에서 확인되지 않은 명중 보장 효과는 문구에 추가하지 않았다.

명칭 검사도 manifest에 등록된 전체 번역 사전을 읽도록 보완했다. 이전에 빠졌던 gameplay 사전과 불가사의 던전 명칭을 함께 검사한다. 아래 87점 평가는 수정 전 0.2.2에 대한 기록이다.

적용 후 단위 테스트 31개와 브라우저 테스트 31개가 통과했다. 영어·스페인어 설정에서 각각 87개 화면·상태, 등록 문구 1,746개, 성격·특성 이름 296개를 재검사했고 실행 오류는 없었다. 탐지된 영문은 고유명사·버튼명·단위·테스트용 이름이었다.

## 2026-11-07 다국어 문체·명칭 감수

### 평가 대상과 방법

현재 0.2.2의 한국어 번역 2,270행을 대상으로 기존 스페인어·영어와 프랑스어·이탈리아어·브라질 포르투갈어·중국어 간체·번체 언어팩을 대조했다. 1,746개 공통 원문에 대한 언어별 대응표를 만들고, 전체 언어팩의 일반 사전 키 3,091개도 모아 비교했다. 외국어 언어팩마다 고유명사 수록 범위와 번역 범위가 달라 키 개수를 완성도 순위로 해석하지 않았다.

전체 사전의 수치·변수·표기·중복 대응을 검색하고, 조작·오류·상점·기술·특성·업데이트 설명의 후보 문장을 직접 비교했다. 모든 문장을 7개 언어 원어민이 감수한 결과는 아니다. 아래 점수는 검토자의 품질 평가이며, 오류가 없는 문장의 비율이나 완역률을 뜻하지 않는다. 이번 작업은 문구 변경 전 평가와 수정 후보 정리다.

### 품질 점수

| 항목 | 점수 | 비중 | 판단 |
| --- | --- | --- | --- |
| 의미·수치·조건 | 92/100 | 30% | 전투 수치와 조건은 대부분 보존되며 일부 안내에서 의미의 초점이 달라짐 |
| 고유명사 보존 | 92/100 | 20% | 본가 명칭 대조는 통과했으나 불가사의 던전의 시리즈명·구슬명에 차이가 있음 |
| 한국어 자연스러움 | 85/100 | 20% | 존댓말은 자연스러우나 일부 직역·어색한 술어가 남음 |
| 용어·표기 일관성 | 77/100 | 20% | 같은 UI 기능과 등급을 서로 다른 이름으로 부르는 사례가 주요 약점 |
| 원문의 말투·개성 | 88/100 | 10% | 친근한 권유는 대체로 보존했으나 설명 일부가 문서체로 굳거나 강조가 빠짐 |
| 가중 평가 | 약 87/100 | 100% | 감수 판단 점수 |

원본 스페인어와 영어·프랑스어·이탈리아어·포르투갈어는 플레이어에게 직접 말하는 짧은 지시와 일상적 설명을 주로 사용한다. 중국어는 같은 내용을 더 압축해 표현한다. 한국어는 버튼을 짧은 명사형으로, 조작 안내를 ‘-하세요’로, 효과를 수치 중심의 ‘-합니다’로 쓰는 방향이 어울린다. 성격 진단과 응원 문구에는 친근한 존댓말을 유지하는 편이 원문과 가깝다.

### 고유명사 대조

현재 배포 순서로 모든 한국어 사전을 읽고 PokéAPI의 한국어 명칭과 대조했다. 포켓몬 1,025종·별칭 1,041개, 특성 310종·별칭 617개, 성격 25종·별칭 50개에 직접 불일치가 없었다. 사전에 있는 기술 200종, 도구 33종, 타입 18종, 지방 9종도 대조했다. Psychic의 타입/기술 구분과 Strength·Upgrade의 일반 UI 사용은 문맥별 예외다.

다만 본가 사전 밖의 시리즈명은 별도로 확인해야 한다. 업데이트 설명 두 행의 ‘이상한 던전’은 포켓몬코리아가 사용하는 ‘불가사의 던전’과 다르고, 저장소의 다른 번역에도 이미 ‘불가사의 던전’이 쓰인다. [포켓몬코리아 시리즈 목록](https://new.pokemonkorea.co.kr/game/category/3)

다음 구슬은 영어·스페인어가 Bulbapedia의 같은 항목과 대응한다. 한국어 이름은 그 위키의 다국어 표를 기준으로 한 것이며, 각 항목의 한국어 공식 게임 원문까지 확보한 것은 아니다. [구슬 다국어 명칭표](https://bulbapedia.bulbagarden.net/wiki/Wonder_Orb#In_other_languages)

| 영어 | 현재 한국어 | 위키 대응 명칭 |
| --- | --- | --- |
| Slumber Orb | 수면의 구슬 | 잠들기구슬 |
| Slow Orb | 감속의 구슬 | 둔화의구슬 |
| Blowback Orb | 날려버리기 구슬 | 날려버리기구슬 |
| Luminous Orb | 빛의 구슬 | 빛의구슬 |
| Quick Orb | 가속의 구슬 | 발빠름구슬 |

Focus Orb/Focosfera는 해당 표에서 기존 도구의 일치 항목을 찾지 못했다. 다른 구슬 이름으로 치환하려면 추가 근거가 필요하다. 고유명사 수정 시 화면 이름뿐 아니라 공지·효과 설명·획득 알림의 언급도 함께 맞춰야 한다.

### 의미와 뉘앙스가 달라진 문구

| 원문/기능 | 현재 표현 | 감수 의견 |
| --- | --- | --- |
| Checking that you are not a robot… | 자동 접속 여부를 확인하고 있습니다… | 자동 로그인 여부처럼 읽힐 수 있다. ‘로봇이 아닌지 확인하고 있습니다…’가 원문 및 다른 5개 번역과 가깝다. |
| It is invincible: survive and deal as much damage to it as you can | 쓰러뜨릴 수 없습니다. 최대한 오래 살아남아 피해를 주세요 | 원문의 최대화 대상은 피해량이다. ‘쓰러뜨릴 수 없는 상대입니다. 버티면서 최대한 많은 피해를 주세요’가 정확하다. |
| Its boosting moves recharge 30% faster. | 능력치를 올리는 기술의 재사용 대기시간이 30% 더 빨리 찹니다. | 대기시간이 찬다는 표현이 어색하다. ‘능력치를 올리는 기술을 30% 더 빨리 다시 사용할 수 있습니다’로 정리 가능하다. 수치 계산을 확인하기 전 ‘대기시간 30% 감소’로 단정하지 않는다. |
| Repertoire | 기술 폭 | 원문의 뜻은 이해되지만 기능 이름으로 어색하다. 게임 고유 강화명이므로 ‘기술 레퍼토리’ 또는 효과가 드러나는 ‘시작 기술 확장’을 검토할 수 있다. |
| Everything hits: +15% damage dealt, but takes 10% more. | 주는 피해가 15% 증가하지만 받는 피해도 10% 증가합니다. | 도입부의 의미·개성이 빠졌다. 다른 언어는 도입부를 유지한다. 현재 확인한 게임 특성 정의는 주는/받는 피해 배율을 적용하므로, 명중 보장이라는 새로운 효과를 단정해 추가하면 안 된다. |

원문의 과장 표현도 주의가 필요하다. ‘leaves no one standing’을 ‘모든 적을 쓰러뜨립니다’로 옮기면 즉사 효과처럼 읽힐 수 있다. 해당 기술의 실제 효과와 함께 검토할 항목이다.

### 통일할 UI 용어

| 대상 | 현재 혼용 | 정리 방향 |
| --- | --- | --- |
| Epic | 영웅 / 에픽 | 실제 등급 버튼에 쓰는 ‘영웅’으로 안내문도 통일 |
| Collection | 컬렉션 / 포켓몬 목록 / 도감 | 실제 화면 이름을 기준으로 설명까지 통일 |
| Bond | 연계 / 기술 결합 | ‘연계’와 ‘기술 연계’로 연결 |
| Floating | 터치 위치 / 이동형 | 움직임을 설명하는 명칭 하나로 통일 |
| Fixed / Anchored | 고정 위치 / 고정형 | 서로 다른 동작임을 분명하게 구분. 예를 들어 위치 고정형 / 터치 고정형 |
| 도구 | 도구 / 아이템 | 일반 명사는 ‘도구’로 통일하되 공식 고유명사는 그대로 유지 |
| 소수 | 0,6% / 0,3%와 소수점 표기 혼용 | 한국어에서는 0.6% / 0.3%로 통일 |

정규화한 동일 원문 키 중 서로 다른 한국어 대응이 있는 항목은 22개였다. 여기에는 영어·스페인어 별칭의 중복, 공백 차이와 Save·Free처럼 문맥에 따라 다른 뜻이 맞는 항목도 포함되어 있어 22개 모두를 오류로 세지 않는다.

### 비교 자료

원본 언어 선택 목록은 게임의 [locales.js](https://pokesurvivor.com/js/core/locales.js)에 있고, 추가 언어팩은 [프랑스어](https://pokesurvivor.com/js/lang/fr.js), [이탈리아어](https://pokesurvivor.com/js/lang/it.js), [브라질 포르투갈어](https://pokesurvivor.com/js/lang/pt-BR.js), [중국어 간체](https://pokesurvivor.com/js/lang/zh-Hans.js), [중국어 번체](https://pokesurvivor.com/js/lang/zh-Hant.js)를 읽었다. 스페인어·영어 대응은 같은 공식 게임의 번역 등록 데이터를 사용했다. 본가 명칭은 [PokéAPI 원본 명칭 데이터](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv)를 대조했다.


## 0.2.2 강화 구매 버튼 배치 보완

일반 강화 카드에까지 두 줄 배치를 적용해 구매 버튼이 아래로 내려갔던 부분을 수정했다. 일반 가격·최대 버튼은 설명 오른쪽에 정렬하고, 시작 기술·두 번째 시작 기술·제외 선택 버튼이나 선행 조건 안내가 있는 카드만 두 줄을 사용한다. 실제 화면의 1400·1024·768·390·360px 너비에서 일반 가격 버튼과 긴 선택 버튼을 확인했다.

## 0.2.1 언어팩 잔여 누락 재조사

기존 화면별 검사에 실제 게임 번역 함수가 원문을 한국어로 반환하는지 확인하는 검사를 추가했다. 1,746개의 등록 문구에 숫자 값을 넣어 검사하고, 성격 25종·특성 271종의 이름도 대조한다.

### 발견해 수정한 항목

언어팩 등록에서 빠진 원문은 4종이었다. 한국어 문구는 기존 사전의 표현을 재사용했다. 기존 화면 보완 처리로 번역되던 경우에도 게임의 번역 함수가 직접 한국어를 반환하도록 원문 대응 관계를 보완했다.

| 원문 | 한국어 |
| --- | --- |
| Mando conectado | 컨트롤러 연결됨 |
| Mando conectado: | 컨트롤러 연결됨: |
| atrás / cerrar | 뒤로 / 닫기 |
| TIRADA ×100 | 뽑기 ×100 |

게임이 번역된 문장을 다시 처리할 때 고유명사와 외부 설정 경로를 바꾸는 오류도 4종 수정했다.

| 대상 | 이전 재번역 결과 |
| --- | --- |
| Switch | 교체 |
| The Pokémon Company | The 포켓몬 Company |
| CREDITS.md | 제작진 · 출처.md |
| Authentication > Settings > Authorized domains | Authentication > 설정 > Authorized domains |

### 강화 카드 배치 수정

시작 기술을 구매하면 긴 선택 버튼이 같은 행의 설명 폭을 줄여 한 글자씩 세로로 표시됐다. 강화 목록의 설명과 조작 버튼을 두 행으로 나누고 1400·1024·768·390px 화면에서 긴 기술명으로 확인했다. 기존 미구매 상태와 구매 후 시작 기술 선택 상태를 모두 검사한다.

### 확인 범위

화면·상태 검사는 77개에서 87개로 늘렸다. 연결된 컨트롤러, 터치 버튼 배치, 도구를 보유한 도감 상세 화면, 민트·일반 특성캡슐·숨겨진 특성캡슐 선택창, 100회 뽑기 결과, 공개 프로필, 도구·구슬·지속 효과를 보유한 일시 정지 화면을 추가했다. 시작 기술 구매 후 레이아웃도 검사한다. 테스트 데이터는 임시 게스트 브라우저에만 만들고 서버 변경 요청은 차단한다.

영어·스페인어 설정 각각에서 87개 화면과 상태를 재검사했고 실행 오류는 없었다. 단위 테스트 31개와 브라우저 테스트 31개도 통과했다.

검사기는 사람·제품 이름, 컨트롤러 버튼, 라이선스와 단위도 탐지하므로 탐지 수를 미번역 건수로 취급하지 않는다. 실제 회원 계정과 다른 플레이어와의 실시간 협동은 검사 범위에 포함되지 않았다.

## 0.2.0 한국어 언어팩 등록

게임의 외부 번역 등록 경로에 한국어를 추가했다. `PS_LOCALES`가 설정될 때 언어 목록에 한국어를 등록하고 `PS_LANG_Q`로 기존 사전을 전달한다. 실제 게임의 번역 함수가 구슬의 전체 설명과 강화 목록을 한국어로 반환하는지 검사에 추가했다. 기술명 ‘사이코키네시스’와 에스퍼타입도 게임의 번역 범위로 구분한다.

공식 게임에서 언어를 한국어에서 영어로 바꾼 뒤 다시 한국어로 바꾸는 과정과, 새로고침 후 언어가 유지되는 과정을 확인했다. 구슬 6종은 게임의 실제 그리기 함수가 번역된 설명을 줄바꿈해 출력하는 것을 검사했다. 회원 전용 화면과 실시간 협동 플레이는 이번 확인에 포함되지 않았다.

## 0.1.1 재검사

영어와 스페인어에서 각각 77개 화면·상태를 검사했다. 뽑기 메뉴를 여는 단계에 더해 실제 결과 카드 10장을 게스트 테스트 데이터로 표시했다. 신규 카드 9장의 성격·특성과 중복 카드의 보상 표시를 확인했다. 레벨 업 카드에는 쉐이미의 기술 위력 91%와 90%를 넣어 특수·물리 안내가 모두 번역되는지 확인했다.

공식 게임에서 영어와 스페인어의 대응 관계가 등록된 문구 1,746개를 대조했다. 추가로 업데이트 소식의 누락 157개를 반영했다. 구슬 툴팁은 별도로 공식 게임의 그리기 함수를 실행해 6종의 제목과 줄바꿈된 설명을 두 언어에서 확인했다. 단위 테스트 26개와 브라우저 테스트 31개가 통과했다.

이 검사는 게스트 계정과 별도의 테스트 데이터로 진행했다. 검사기가 잡은 라틴 문자에는 사람·제품 이름, 라이선스, 버튼 표기, 단위도 포함된다. 실제 회원의 저장 데이터, 결제, 다른 사람과의 실시간 협동, 향후 추가될 영상 제목까지 검사한 것은 아니다.

## 이전 버전의 검사 기록

영어·스페인어 원문에서 각각 74개 화면·상태를 검사했다. 최신 재검사에서 실행 오류는 없었으나, 업데이트 소식의 미번역 때문에 전체 번역 검사는 여전히 실패한다.

## 반영한 수정

- 컨트롤러·수동 조준 설정, 시작 기술 선택과 선행 조건, 진화 효과 설명, 도구 선택 안내, 결과 화면, 검색 결과 없음, 툴팁 등 번역 항목 66개를 추가했다.
- 도감 필터 10종, 정렬 5종, 검색 결과 없음, 타입 필터, 보유 포켓몬 4마리의 상세·즐겨찾기 상태를 검사에 추가했다.
- 마지막 재검사에서 발견한 전체 기술 피해 증가, 햇살에서 속도 증가, 도구 끌어당기기, Discord 소개 문구도 추가 반영했다. 이 네 문구는 사전 테스트로 재검증했다.
- 단위 테스트 23개와 브라우저 테스트 28개를 통과했다.

## 후속 보완

순위 초기화 알림과 팀별 전투 결과 요약이 기존 검사에서 빠져 있었다. 알림은 기존 회원에게만 표시되는 조건을 별도 테스트 데이터로 재현하고, 결과 화면에는 실제 `team[].sum` 구조를 넣도록 검사를 수정했다. 고정 안내문의 번역 제외 처리, 보상 계산, 총 피해량·초당 피해량·도구 없음 문구를 보완했다. 확장된 전체 검사 범위는 언어별 75개 화면·상태다.

## 아직 남은 항목

- 업데이트 소식의 제목·날짜·본문 157종이 미번역 상태다. 아래 목록은 영어 재검사에서 중복을 제거한 결과다.
- 외부 YouTube 영상 제목은 원문으로 표시된다.
- Xbox, USB, Bluetooth, Firebase, 라이선스명과 LB·RB·A·B·Y·Start 같은 실제 컨트롤러 버튼명도 검사기에 탐지되지만 번역 누락으로 분류하지 않았다. 검사기의 허용 목록을 늘려 오류를 숨기지는 않았다.

## 확인 범위와 한계

새 브라우저의 게스트 계정과 메모리에 만든 보유 목록을 사용했다. 저장·구매·계정 변경 요청은 차단했다. 실제 회원 계정 전용 화면, 다른 사람과의 실시간 협동, 모든 포켓몬의 특성 조합, 실제 결제·구매 성공 이후 상태는 전수 확인하지 않았다. 이 보고서는 게임 전체에 누락이 없다는 보장이 아니다.

재현 명령은 `node scripts/audit-live-translations.mjs en`과 `node scripts/audit-live-translations.mjs es`다. 원본 검사 결과는 `test-results/translation-audit-{en,es}.json`에 생성된다. 공지와 일부 고유명사 탐지로 종료 코드는 현재 1이다.

## 미번역 업데이트 소식 목록

- Automatic saving
- 5 November 2026
- The Save button is gone: your progress now saves by itself.
- Your progress now saves by itself after each run and when you upgrade or buy. If you play on several devices, they catch up when you come back to the game.
- Gacha needs a connection
- 4 November 2026
- an account, gacha pulls need an internet connection. As a guest, and for playing and shopping, nothing changes. 사용
- Your progress, safe
- 2 November 2026
- Some players lost what they had played in the last few days after an update: if the browser opened an older version of the game again (from its cache or an old tab), that version didn't recognize the copy of the save kept by the browser and went back to the last one in the cloud. That no longer happens. And if the game ever can't read that copy, it no longer deletes it: it keeps it aside and recovers it by itself after updating.
- Offline, the game installed as an app opens the last version you used, not the one from when you installed it.
- News on mobile too
- 31 October 2026
- The menu news banner (Discord, latest video...) now also shows on phones in landscape: at the top left, above the title and your partner.
- Official Discord and against cheating
- 30 October 2026
- News banner at the top left of the menu: it cycles through the important news (there's an official Discord now!) and the channel's latest video (tap it to open it on YouTube).
- The new video notice no longer plays the video inside the game: "Watch on YouTube" (or tapping the thumbnail) opens it on YouTube.
- The Discord link in the menu banner said "invalid invite". It now takes you to the server.
- Anything changed by hand in the copy of your save kept by the browser (with cheat extensions or from the console) no longer counts: the cloud save is used, and Pokémon and shinies added with those extensions are removed. What you earn by playing is not touched.
- Halloween, one more day
- 28 October 2026
- The Halloween event lasts one more day: from October 30 to November 2 (Spain time).
- During Halloween, a few seconds after opening the game (and when the event starts or ends), the shop, the gacha or another menu screen closed by itself and sent you back to the menu. Not anymore.
- Steadier co-op
- 27 October 2026
- Mobile and tablet: new "Anchored" joystick (Settings → Controls → Place the buttons). It appears where you put your finger and stays in that spot while you hold it, even if you move your finger away; lift it and touch somewhere else, and it appears there. The usual "Floating" one follows your finger and is still the default.
- Weak Armor, Steadfast and Rattled no longer remove your Agility charges (or any better speed boost) when you get hit: they used to drop them to one.
- The Assault Vest no longer counts toward the 70% cap of the Armor cards: with the cards maxed, the vest adds on top. And if you take it off, you keep what the cards gave you.
- In very elongated windows (very wide and short), enemies no longer keep looping off screen without coming closer: it looked as if none were spawning.
- Starting quiz: your personality traits ("Patient", "Tenacious"…) were shown in Spanish in every language. They are translated now.
- Arceus damage leaderboard: "Friends only" also shows friends outside the top 50 (in All-time); All-time keeps your best damage even if that run does not beat your time; and if a run cannot enter the leaderboard, it now tells you.
- Leaderboard: since the night of October 26, many runs did not make it into the leaderboard (they did show in your profile). The game now tries harder when preparing them for the leaderboard and they get in as usual.
- Mobile: tapping "Change options" on the level-up cards sometimes picked one of the new cards by itself; and in a bond, after choosing the first move, whichever move ended up under your finger was joined instead of the one you tapped. Now only the card you tap is chosen.
- Co-op: on some networks you could only play when one particular person was the host; with someone else hosting, the others kept "reconnecting" forever. Now, if the direct connection does not work, the server connection of either player is tried (not just the host's), and it is prepared as soon as you join the room so no time is lost.
- Co-op: with a slow connection, a player could see the run minutes late (more than 4 minutes behind the others), and Arceus's Judgment turned into chaos. Now, if the connection cannot keep up, the game waits for it to catch up instead of piling up what has yet to arrive: at worst the run pauses for a moment ("waiting for the host"), but it is always up to date.
- Halloween is coming
- 26 October 2026
- Halloween event from October 30 to November 2 (Spain time). What it brings, you will find out by playing.
- On the main screen, a countdown: from two weeks before, how long until Halloween; during the event, how long is left.
- Mobile: when you log in with your username, the keyboard no longer autocorrects it or adds capitals on its own (with an unusual name, autocorrect changed it and you got "Wrong username or password").
- Mobile: the joystick no longer gets stuck when you level up. If you tapped a card with one finger while holding the joystick with the other, the card was not chosen and everything stayed frozen with the cards open. Now it is chosen when you lift your finger on it, whether or not another finger is on the screen (item and bond cards too). And if the phone misses that you lifted your finger, the joystick lets go by itself as soon as no finger is left on the screen.
- The top bar (coins, tickets, candy, your name and the buttons) fits on any screen. Before, with everything showing, on many screens (tablets too) the coins and tickets went off the left edge and the buttons split into two lines. Now, when space is short, the buttons keep only their icon, your name is shortened and very large amounts are shown short (10M).
- Mobile: the "back" button (or the back gesture) no longer takes you out of the game. During a run it pauses, on a menu screen it goes back to the menu, and only on the main menu does it leave the site. And if you pull down the notification shade or another app opens on top, the run also pauses (when playing solo).
- Mobile: the messages in the middle of the screen (the orb ones, for example) went off both sides and could not be read. Now they wrap and fit.
- Mobile: the notices at the bottom (achievements and messages) no longer catch your taps. While they were showing, they covered your moves and you could not switch moves.
- In the pause screen, Defense and Special Defense of Pokémon with a nature showed extra decimals (55.00000000000001).
- Mobile: the level-up and item cards no longer end with a stray "·" (it belonged to the keyboard keys, which are not shown on mobile). In landscape, the title tagline no longer covers the Play button, and in the collection page the Mint, Capsule and TM buttons are back to their size.
- The same tickets and Pokémon on all your devices
- 25 October 2026
- When a run ends, solo or in a group, you get the summary: each move with the damage it dealt and its damage per second, your total damage and your item. In a group, also each teammate’s, with one tab per player.
- Mobile: "Manual aim" is back (Settings → Accessibility), now with a second joystick: your finger on the right half of the screen aims your moves and the one on the left moves you. When you lift it, they aim on their own again.
- Per-Pokémon ranking: runs now count from 10 minutes (it was 5). The other rankings still count from 2 minutes.
- Public profile: your records and medals reach other players at most every 6 hours (it was every 2). You always see them right away.
- Mobile: with the level-up, item or bond cards open you can now grab the joystick by touching outside the box, and when they close you walk off without lifting your finger, like with a keyboard or controller.
- Mobile in portrait: the top bar did not show your coins, tickets or name (with so many buttons it did not fit and went off the left edge). Now it uses two lines and everything is visible.
- Gacha with a controller: skipping the animations by pressing A repeatedly pulled again by accident (after "Continue" the pull button was selected) and tickets were spent in bulk. Now the pull buttons are never selected on their own: you have to move to them.
- Gacha with a controller: you can now select "Skip" and "Continue" during a pull (B also continues).
- Orbs with a controller: each slot now shows X (use the selected one) or Y (switch) instead of the keyboard keys 5-8.
- Co-op: Pokémon with Drought, Drizzle, Sand Stream or Snow Warning now set their weather even if they are not the host (before, only the room creator’s worked).
- Co-op: the run no longer freezes for everyone if the message that someone finished choosing a card, item or bond gets lost (it happened with a momentary connection drop): it is now checked in every message.
- Cloud save: if you pressed Save shortly after another Save, the game said "Saving to the cloud in X s" and, if you left before that, it was never uploaded (your tickets were missing on the other device). Now the wait is much shorter and, if you leave the game with a pending Save, it is uploaded as you leave.
- Mobile: when you minimized the game, the music kept playing, and distorted. Now it stops and comes back when you return to the game.
- Cloud save: if you got tickets, coins or Pokémon on one device and saved on another one in the meantime, back on the first one the game thought everything was already saved ("Everything is already saved in the cloud") and did not upload it, so it never showed up on the other device. Now it checks what is really missing and Save uploads it.
- Cloud save: after spending on one device tickets or coins that had already been spent on another, your tickets could keep growing on their own every time you saved, and then suddenly drop on the other device. Now the balance is the same everywhere, and nothing you earn afterwards is taken away.
- Cloud save: if there was no connection yet when the game opened (it sometimes happens on phones), you played with the copy stored on that device, which could be old, until you pressed Save: what you got on other devices was missing. Now, as soon as the connection is back, the cloud copy is brought in and merged with yours.
- Arceus's Judgment: going very fast you could get out of the arena, where neither Arceus nor the legendaries could reach you, so you survived forever. Now nobody leaves the arena.
- Co-op: if a teammate lost connection or their phone switched off, their Pokémon stood still on the map and enemies and Arceus kept chasing it without hurting it, so nobody else got hit. Now, after 3 seconds without hearing from them, they go after the players still in the game.
- Ranking: the best runs (more than 12 defeated per second) were never uploaded, without any warning: the server rejected them entirely. Now they are always uploaded.
- Ranking: weekly, monthly and all-time now match each other. Each one was loaded separately and all-time could still be missing a time already shown in weekly.
- Friends ranking: daily, weekly and monthly only show friends who are in the top 50; it now says so instead of "No records here yet". All-time shows everyone.
- All-time ranking: if your time did not make the top 50, the ranking kept showing your old one for hours, and checking your rank could let a worse run replace the better one that had not been uploaded yet. Now your best time shows up right away and is never lost.
- the game open in two tabs of the same browser, what you get or spend in one is no longer lost when you use the other: both share their changes right away. 사용
- Moves in the collection and menu windows
- 24 October 2026
- Collection: the icons of the moves each Pokémon can learn are twice as big and, when you hover over them (or tap them on mobile), they show their type, whether they are physical or special, and what they do.
- The menu windows, Settings, What's new and Support can be closed by clicking outside them, as well as with Back or Close.
- The Kecleon Shop and What's new windows no longer slide under the top bar: they now start below it, like the other windows.
- Arceus damage ranking and Plates
- 23 October 2026
- YouTube button at the top, next to What's new: it takes you to the game's channel and, when there is a live stream, it turns red with "LIVE" and takes you to watch it.
- The ranking is now split in two: on the left, the damage you dealt to Arceus; on the right, the time survived, as always. Both halves load at once. Every board starts from zero.
- Arceus's Judgment: you can now hit it. It is invincible and only takes a small part of the damage (less and less over time), and your attacks aim at it when no legendary is left.
- Plates: in every run Arceus holds a random one, which gives it its type (you are told when you enter the arena). No move type is always the best anymore.
- At minute 35, Arceus breaks everyone's item (Focus Sash included).
- The Judgment legendaries are no longer twice as strong as the previous one: each one has 25% more HP and 15% more damage, so they can be taken down. There is no 45-minute limit in the ranking anymore.
- Evolved moves no longer change their name: they keep it with a "+" (Meteor Mash becomes Meteor Mash +). They work just like before and still stand out with their golden border.
- Meteor Mash hits softer: 24 damage instead of 34 and a slightly smaller area. Maxed and evolved it dealt almost twice as much as Rock Slide; now they are on par.
- In Arceus's Judgment, poison and burns deal a small, fixed amount to the legendaries (poison used to take a % of their HP): poisoning them and running away no longer works, you have to hit them.
- Mystery Dungeon orbs, Shiny Charms and ×100 gacha
- 22 October 2026
- Mystery Dungeon orbs: single-use items you find during the run (chests, bosses and sometimes when you defeat a Pokémon). Slumber Orb, Slow Orb and Blowback Orb put enemies to sleep, slow them down or blow them away; Focus Orb, Luminous Orb and Quick Orb give critical hits, a wider view or speed to you and nearby teammates. You carry up to 4 different ones (3 of each) and use them with keys 5-8, by tapping their slot above your moves, or with X / Y on a controller. Bosses and legendaries are less affected.
- Shiny Charms: one per region (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar and Paldea). Complete a region's Pokédex (legendaries included) to get its Shiny Charm, and shinies become twice as likely in its gacha banner: from 1% to 2%. You can find them in your Bag, along with how many you still need for each one. If you had already completed a region, its charm is already yours.
- Gacha: new ×100 pull, with 100 normal tickets or with 10 ×10 tickets (ten ×10 pulls in a row, each with its guaranteed Epic). The slot machine spins 10 times showing the best of each ×10, and at the end you get a summary (new, shiny and PokéCoins) with the cards sorted from best to worst. To make room, the ×1 pull is gone: you pull 10 or 100 at a time.
- Gacha: Skip button (or Esc) during the animation: the slot machine ends and all the cards show up at once.
- Co-op: guests no longer get "The room has been closed" in the middle of a run (sometimes after a few minutes or when entering a rift) while the others kept playing. It happened when their connection to the rooms server dropped for a moment; now the run goes on and the room recovers on its own.
- Co-op: if the connection with the host drops for a moment (a Wi-Fi or mobile data hiccup), the guest no longer loses the run: it pauses for up to 45 seconds while reconnecting and then keeps playing.
- Co-op: if you drop out of a run while the others keep playing, you no longer get "The room has been closed": you wait in the room and, when they finish, you play together again.
- The big update: Kecleon Shop
- 21 October 2026
- New: the Kecleon Shop (button in the menu) with Mints, Ability Capsules and 8 new TMs every day. Every Pokémon now has its own nature (±10% to two stats) and ability, with an effect in the run; you can see and change them on its page in the collection. TMs permanently teach moves outside its types, but only if it learns them in the games (Mewtwo can learn Shadow Ball; Psyduck cannot learn Flamethrower). Thanks to TheAdro7 for the idea and the groundwork.
- New upgrade, Second starting move: with Repertoire, buy it once per Pokémon and then choose for free the second move you start with (or leave it random).
- Co-op: if your networks cannot connect to each other directly (it sometimes happens on mobile data and with some routers), the match now goes through our server and you can still play together. If you can connect directly, nothing changes. You need to be signed in with an account.
- Co-op: if you go down, you can watch a teammate who is still standing while you wait to be revived. Press the button under the message (or Q / E, or LB / RB on a controller) to switch between them and back to yourself. Only the camera changes: it uses no extra connection.
- Cloud save: if you played and saved on one device, another device that still had the game open could upload its old copy over it (when saving or when the game updated), and your new tickets and Pokémon did not show up on the other one. Now, if the cloud has something newer, it is merged with yours before saving and nothing is lost.
- Safer co-op and move fixes
- 20 October 2026
- On mobile the "Manual aim" option is gone (it did not work with the touch screen): moves always aim on their own.
- Per-Pokémon leaderboard: runs now count from 5 minutes on (the other leaderboards still from 2 minutes).
- Friends: you no longer see who is online, and you can invite any friend to a room (if they do not join, the invite expires on its own after 3 minutes).
- Cloud save: your game is now only uploaded to the cloud when you press the Save button at the top (and before a game update). Everything is still saved instantly in this browser. If you play on another device or are about to clear your browser data, press Save first.
- New friend requests show up when you open Friends.
- Co-op: a player with a tampered game can no longer freeze the others by sending impossible numbers (infinite experience froze the host and a giant effect froze the guests).
- Upgrades: after changing your partner, the upgrades screen now opens on the new one instead of the last one you had looked at.
- Co-op: a guest's Ominous Wind, Sand Tomb and Whirlpool now pull enemies in (only the host's did).
- Co-op: a guest's Hex now deals its extra damage to burned, poisoned or slowed enemies.
- Acid Spray, Electro Ball, Seed Bomb, Signal Beam, Power Gem, Mist Ball, Energy Ball, Ice Shard, Shadow Sneak and Draining Kiss: once evolved, the shots flew off to the sides and hit nothing. Now they go forward, and the "+1 projectile" upgrade really adds one (it added none before).
- Co-op: if someone's level-up cards closed before they had picked (it could happen when picking very fast), they now open again and the others are no longer left waiting for them.
- 38 new moves
- 19 October 2026
- 38 new moves: every type now has 5 or more (Rock, Fighting, Dragon and Fairy had only 2). Among them Hyper Beam, Solar Beam, Magnitude, Whirlpool, Thunder Wave, Outrage, Play Rough, Sucker Punch... each with its evolution.
- New ways to attack: shots that chase enemies or bounce between them, beams you charge up, spins that hit everything around you, shockwaves that travel along the ground, vortexes that pull enemies in, waves that push them away and zones that stun them.
- New upgrade, Starting move: buy it once per Pokémon and then choose for free which move it starts the run with.
- New languages: French, Italian, Brazilian Portuguese, Simplified Chinese and Traditional Chinese, in Settings > Graphics > Language. Thanks to everyone who translated them.
- A joke line on the main menu title, like the ones in Minecraft.
- Single-type Pokémon deal 20% more damage with moves of their type, to make up for having less variety.
- Learning a new move no longer switches to it on its own: you keep the one you were using and switch whenever you want.
- The game can only be played on its official website, pokesurvivor.com: if another site embeds it in its own page (for example, to put ads around it), a notice appears with a button to go to the official one.
- Starting move: you can now go back to the default move even if it is not of its type (for example Confusion on Psyduck).
- Co-op: the boss due when coming back from a rift could appear thousands of metres away, where nobody could find it, and the run got no more rifts. Now it appears nearby, and if a boss ends up very far from everyone, it shows up close again after a few seconds.
- When reloading, the new page sometimes got mixed with the old styles saved in the browser (for example, the title line showed up big and stuck to "PokéSurvivor"). That no longer happens.
- Physical and special, controller, Save button and fresh leaderboards
- 18 October 2026
- Physical and special moves, like in the games: every Pokémon has its Attack, Special Attack, Defense and Special Defense. Physical moves use its Attack and special moves its Special Attack: Machamp hits hard with Karate Chop and weakly with Shadow Ball. With moves on its strong side it hits as hard as before. When leveling up, each card says whether the move is physical or special and how well it works with your Pokémon, and the collection shows all its stats.
- Swords Dance and Dragon Dance now raise only (physical) Attack, like in the games, and Nasty Plot arrives, raising Special Attack, learnable by any Pokémon. When leveling up, moves on your Pokémon’s strong side show up twice as often.
- Run summary in the pause screen: each move with its category, the damage it has dealt and its damage per second; your stats with everything you have raised; and your item and the upgrade cards you have.
- Defenses count too (a little): enemies resist your physical moves with their Defense and special moves with their Special Defense, and each enemy hits you with its strong side, which you block with your Defense or Special Defense.
- You can now play with a controller (Xbox, PlayStation, Switch and most USB or Bluetooth controllers): move, switch attacks, pause, pick cards and use every menu, with vibration when you take damage. Set it up in Settings > Controls.
- Collection: search by name or number, a tab with every generation, filters that combine (owned / missing, several rarities at once, shiny, favorites and type) and sorting by number, name, rarity, recently caught or most played. Plus favorites: mark them on each Pokémon’s page; they go with your account, on all your devices.
- New Accessibility tab in Settings with “Manual aim”: your attacks go towards the mouse or wherever you push the controller’s right stick, instead of the nearest enemy. It is off by default.
- Save button at the top right: it uploads your game to the cloud right away. Use it before closing the game or switching devices.
- Level-up, bond and item cards can’t be picked for a moment after they appear (they look dimmed): pressing 1-4 or tapping to switch attacks mid-fight no longer picks a card by accident.
- a controller you can now select the Pokémon you don’t have yet in the collection, and on mobile the Settings tabs fit in one row that scrolls sideways. 사용
- Your game is saved to the cloud automatically every 10 minutes.
- All-time leaderboard: if you are below rank 1,000, it shows “#1000+” instead of the exact number.
- Big Pokémon (Onix, Gyarados, Wailord, Eternatus, the legendaries...) are now properly playable: they look a bit smaller, while still being among the biggest, and collide like a normal one, so they fit through every corridor and don’t take extra hits because of their size.
- There are at most 3 healers, 3 shielders and 3 summoners at a time.
- Healers and shielders no longer make a boss unkillable: their healing and shields scale with the damage you are dealing to it, and it only gets one shield every 6 seconds.
- Judgment of Arceus: speed has a soft cap (anything above a certain point counts much less) and legendaries run almost as fast as you. After 5 minutes of Judgment, Arceus keeps speeding up, and after 7 its touch takes more and more HP, until it knocks you out in one hit around minute 40.
- Poison still takes a percentage of HP, but against enemies with huge HP (the Judgment legendaries) that percentage is smaller.
- All leaderboards start from scratch (daily, weekly, monthly, yearly and all-time): records from running away from Arceus could no longer be reached.
- Security: we closed a hole that let someone put code in their leaderboard row or profile and make it run in the browser of whoever opened them (some people were sent to a video). Now everything coming from other players is cleaned, the server only accepts what it should, and the browser runs nothing that isn’t part of the game.
- The leaderboard now shows Pokémon in shiny form for players who played with their shiny.
- Required updates
- 15 October 2026
- When an update is required (for example, to fix an important bug), your current run ends after a 10 s notice and the game reloads. You lose nothing: that run’s coins, tickets, records and leaderboard entry are saved as if you had quit.
- Playing on two devices (PC and phone) no longer loses coins or tickets: before, if one had the game open with old data and saved, it erased what you earned on the other. Now both are added up. And when you come back to the game after a while away, it brings in what you got on the other device (Pokémon, shinies...) without reloading.

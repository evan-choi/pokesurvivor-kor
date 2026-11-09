# PokéSurvivor 한국어 모드

한국어 번역부터 전투 HUD, 기술·도구 설명과 이펙트 조절까지 담은 Chrome 확장 프로그램입니다.

[**Chrome 웹 스토어에서 설치**](https://chromewebstore.google.com/detail/onfhhekmpdnbgpklcghiejdmgnbmjhci) · [설치 안내](https://evan-choi.github.io/pokesurvivor-kor/#install) · [게임 열기](https://pokesurvivor.com/) · [English](README.en.md)

![한국어 도감 — 포켓몬 이름, 성격, 특성과 기술 설명](docs/assets/pokedex-korean.jpg)

## 설치

1. [Chrome 웹 스토어](https://chromewebstore.google.com/detail/onfhhekmpdnbgpklcghiejdmgnbmjhci)에서 **Chrome에 추가**를 누릅니다.
2. [게임](https://pokesurvivor.com/)을 열거나 새로고침합니다.
3. 게임의 **설정 → 그래픽 → 언어**에서 **한국어**를 선택합니다.

스토어 설치본은 Chrome이 승인된 업데이트를 자동으로 설치합니다. ZIP 직접 설치도 지원합니다.

<details>
<summary>ZIP으로 직접 설치하기</summary>

1. [설치 ZIP](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-korean.zip)을 내려받아 압축을 풉니다.
2. Chrome 주소창에 `chrome://extensions`를 입력하고 **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다** 버튼을 눌러 `manifest.json`이 바로 들어 있는 `pokesurvivor-korean` 폴더를 선택합니다.
4. [게임](https://pokesurvivor.com/)을 열거나 새로고침합니다. 처음 설치하면 한국어가 켜집니다.

설치한 폴더는 옮기거나 삭제하지 마세요.

</details>

ZIP 설치본에서 스토어 설치본으로 옮길 때는 기존 확장을 끄세요. 두 설치본을 동시에 켜지 마세요.

## 주요 기능

| 기능 | 사용 위치 |
| --- | --- |
| 도감·상점·가방·미션 등 한국어 번역과 공식 포켓몬 명칭 | 게임 설정 → 그래픽 → 언어 |
| 1.5배 전투 HUD, 기술·도구 툴팁 | 게임 전투 화면 |
| 내 이펙트·파티원 이펙트 투명도 | 게임 설정 → 그래픽 |
| 근접 자동 조준 임시 보정 | 게임 설정 → 조작 |
| 보유 포켓몬 티어 | 확장 프로그램 팝업 |
| P2P 직접 연결 | 게임 설정 → 네트워크 |

## 언어 바꾸기

게임의 **설정 → 그래픽 → 언어**에서 언어를 선택하세요. 언어를 바꾸면 게임이 새로고침됩니다.

## 기술 설명

전투 화면 아래의 기술 슬롯에 커서를 올리면 설명이 표시됩니다. 연계된 기술은 첫 기술부터 아래→위 순서로 쌓이고, 진화한 기술은 추가 효과도 보여 줍니다.

장착 도구 슬롯에 커서를 올리면 도구 이름과 효과도 표시됩니다.

## 이펙트 표시

게임 **설정 → 그래픽**에서 **내 이펙트**와 **파티원 이펙트**를 각각 기본·약간 투명·매우 투명·숨김으로 조절합니다. 선택은 이 브라우저에 저장됩니다. 적의 공격·경고, 피해 숫자와 소유자를 식별할 수 없는 효과는 유지하며 피해 판정은 바꾸지 않습니다.

| 변경 전 — 기본 | 변경 후 — 매우 투명 |
| --- | --- |
| ![내 이펙트가 기본 밝기로 표시된 전투](docs/assets/effects-default.png) | ![내 이펙트만 20% 불투명도로 표시된 같은 전투](docs/assets/effects-transparent.png) |

실제 게임 렌더링을 사용한 비교용 장면입니다. 같은 전투 시점에서 **내 이펙트**만 기본(100%)에서 매우 투명(20%)으로 바꿨습니다. 이미지를 누르면 크게 볼 수 있습니다.

## 근접 자동 조준 임시 보정

먼 보스를 조준하느라 가까운 적에게 근접 공격을 하지 않는 문제를 보정합니다. **설정 → 조작 → 근접 자동 조준 보정 (임시)**에서 끄면 즉시 원래 동작으로 돌아갑니다. 수동 조준은 보정하지 않습니다. [공식 수정 후 제거 방법](docs/temporary-melee-fix.md)

## 보유 포켓몬 티어

게임 계정에 로그인한 뒤 확장 프로그램 아이콘을 누르면 최근 사용한 게임 탭의 보유 포켓몬을 **티어·전체 순위순**으로 볼 수 있습니다. 한국어 이름과 함께 GIF를 표시하며, GIF가 없으면 정지 이미지로 표시합니다.

게임 탭이 열려 있으면 보유 목록을 표시하고, 열려 있지 않으면 헤더와 **게임 열기** 버튼을 표시합니다.

순위는 [PokéSurvivor Guide](https://pokesurvivor.net/tier-list/)의 능력치 기준 평가입니다. 티어는 하루 동안 저장해 사용하고, **새로고침**을 누르면 보유 목록과 티어를 다시 가져옵니다. 갱신에 실패하면 마지막으로 저장한 티어와 안내를 표시합니다. 게임 저장 데이터는 외부로 전송하지 않으며, 게스트 플레이는 지원하지 않습니다.

<details>
<summary>상점과 그래픽 설정 화면 보기</summary>

한국어로 표시된 도구와 기술머신 설명입니다.

![켈리몬 상점의 도구와 기술머신](docs/assets/shop-korean.jpg)

언어와 내 이펙트·파티원 이펙트는 게임의 그래픽 설정에서 조절합니다.

<img src="docs/assets/settings-korean.png" width="640" alt="한국어 선택과 내 이펙트·파티원 이펙트 조절이 있는 그래픽 설정">

</details>

## P2P 직접 연결

게임 **설정 → 네트워크 → P2P 직접 연결**에서 켜고 끌 수 있습니다. 기본값은 꺼짐이며, 켜면 다른 플레이어와 직접 연결을 시도합니다.

<img src="docs/assets/network-korean.png" width="640" alt="설정의 네트워크 탭과 P2P 직접 연결 스위치">

게임이 제공하는 중계 연결(TURN)도 사용될 수 있으므로 직결이나 지연 시간 감소를 보장하지는 않습니다. VPN·방화벽·공유기 설정에 따라 직접 연결이 제한될 수 있습니다.

같은 LAN에서 멀티플레이가 TURN으로 연결된다면 선택적으로 [Windows LAN 도구](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-lan-helper.zip)를 사용할 수 있습니다. 신뢰하는 CIDR을 입력하고 범위를 확인한 뒤 Chrome UDP 수신을 허용합니다. [사용법과 되돌리기](tools/windows-lan/README.md)를 먼저 확인하세요.

## 업데이트

스토어 설치본은 심사 승인 후 자동 업데이트됩니다. 웹사이트의 ZIP은 별도로 배포되므로 스토어 버전보다 최신일 수 있습니다.

ZIP 설치본은 새 ZIP으로 기존 폴더의 파일을 교체한 뒤, `chrome://extensions`에서 확장 프로그램을 새로고침하세요. 열려 있는 게임도 새로고침하면 적용됩니다.

개발자는 버전을 올려 `main`에 푸시하면 CI에서 스토어 심사에 제출할 수 있습니다. 다른 버전의 심사가 진행 중이면 제출이 중단되므로, 기존 심사가 끝난 뒤 제출 작업을 다시 실행해야 합니다. 웹사이트는 스토어 심사와 별개로 `main` 변경 시 배포됩니다. [최초 등록과 CI 연결](docs/store-publishing.md) · [개발 안내](docs/development.md)

[설치 도움말](docs/install.md) · [번역 제보](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml)

[라이선스](LICENSE) · [출처](THIRD_PARTY_NOTICES.md)

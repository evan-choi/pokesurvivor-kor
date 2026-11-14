# PokéSurvivor 한국어 모드

PokéSurvivor를 한국어로 플레이할 수 있는 Chrome 확장 프로그램입니다.

[**Chrome 웹 스토어에서 설치**](https://chromewebstore.google.com/detail/onfhhekmpdnbgpklcghiejdmgnbmjhci) · [게임 열기](https://pokesurvivor.com/) · [English](README.en.md)

## 시작하기

처음 설치하고 게임을 열면 한국어가 자동으로 적용됩니다. 게임을 이미 열어뒀다면 새로고침하세요.

스토어 설치본은 Chrome이 자동 업데이트합니다.

## 한국어 번역

도감, 상점, 미션과 기술 설명을 한국어로 표시합니다.

<img src="docs/assets/pokedex-korean.jpg" width="720" alt="포켓몬 이름과 기술·특성 설명이 한국어로 표시된 도감">

<img src="docs/assets/shop-korean.jpg" width="720" alt="한국어로 표시된 상점">

## 전투 정보

왼쪽 위의 포켓몬 이름·레벨·HP·버프를 1.5배로 표시합니다.

| 기본 크기 | 적용 후 · 1.5배 |
| --- | --- |
| [![기본 크기의 HUD](docs/assets/battle-hud-before.png)](docs/assets/battle-info-before.png) | [![1.5배로 확대된 HUD](docs/assets/battle-hud-after.png)](docs/assets/battle-info-after.png) |

같은 전투 장면의 왼쪽 위 표시를 비교했습니다.

아래쪽 기술·도구 슬롯에 마우스를 올리면 설명을 볼 수 있습니다. 연계 기술은 위로 쌓아 보여줍니다.

<img src="docs/assets/battle-info-after.png" width="720" alt="전투 중 전기쇼크 슬롯에 마우스를 올려 표시한 기술 설명">

## 이펙트 투명도

**설정 → 그래픽**에서 **내 이펙트**와 **파티원 이펙트**를 따로 조절합니다. 아래는 같은 장면에서 내 이펙트만 바꾼 모습입니다.

| 기본 · 100% | 매우 투명 · 20% |
| --- | --- |
| ![기본 이펙트](docs/assets/effects-default.png) | ![매우 투명한 내 이펙트](docs/assets/effects-transparent.png) |

## 보유 포켓몬 티어와 검색

게임에서 플레이를 시작한 뒤 Chrome 확장 아이콘을 누르면 보유 포켓몬의 티어와 전체 순위를 볼 수 있습니다. 이름·도감 번호·초성(`ㅍㅋㅊ`)으로 검색하고, 일치하는 결과가 없으면 `피카추` 같은 오타도 찾아줍니다.

순위는 능력치를 기준으로 평가한 PokéSurvivor Guide 자료를 따릅니다. [티어 평가 기준](https://pokesurvivor.net/tier-list/)

<img src="docs/assets/collection-search.png" width="380" alt="보유 포켓몬 검색 결과와 티어·전체 순위">

예시 보유 목록에서 초성 `ㄹ`로 검색한 화면입니다.

## P2P 직접 연결

멀티플레이에서 **설정 → 네트워크 → P2P 직접 연결**을 켜면 직접 연결을 허용합니다. 기본값은 꺼짐이며, 사용하려면 양쪽 PC에서 옵션을 켠 뒤 방에 다시 참가합니다.

<img src="docs/assets/network-korean.png" width="640" alt="P2P 직접 연결 설정">

---

[기능별 사용법·ZIP 설치·업데이트](docs/install.md) · [오류 제보](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml) · [개인정보 안내](https://evan-choi.github.io/pokesurvivor-kor/privacy.html)

[개발 안내](docs/development.md) · [라이선스](LICENSE) · [출처](THIRD_PARTY_NOTICES.md)

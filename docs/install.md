# PokéSurvivor 한국어 모드 설치 안내

스토어·ZIP 설치는 [설치 페이지](https://evan-choi.github.io/pokesurvivor-kor/#install)에 있습니다.

## ZIP 설치

1. ZIP을 풀고 Chrome에서 `chrome://extensions`를 엽니다.
2. **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
3. `manifest.json`이 바로 들어 있는 폴더를 선택합니다. GitHub ZIP은 `extension/` 폴더입니다.
4. [게임](https://pokesurvivor.com/)을 열거나 새로고침합니다.

한국어는 자동 적용되며, 게임 **설정 → 그래픽 → 언어**에서 바꿀 수 있습니다. 스토어 설치본으로 옮길 때는 기존 확장을 끄세요.

<a id="p2p-직접-연결"></a>

## 연결 가이드

<a id="windows-방화벽에서-lan-대역-허용"></a>
<a id="같은-공유기에서-연결하기"></a>
<a id="radmin-vpn으로-연결하기-windows"></a>

[같은 공유기 연결](same-router-connection.md) · [Radmin VPN 연결](radmin-vpn-connection.md)

## 업데이트와 설치 오류

스토어 설치본은 자동 업데이트됩니다. ZIP은 같은 폴더에 새 파일을 덮어쓰고 `chrome://extensions`에서 확장을 새로고침한 뒤 게임도 새로고침합니다. 설치 폴더는 계속 보관하세요.

설치 오류는 `manifest.json`의 위치와 Chrome 업데이트 여부를 확인하세요. 한국어가 적용되지 않으면 게임을 새로고침하고 언어 설정을 확인하세요.

[오류 제보](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml)

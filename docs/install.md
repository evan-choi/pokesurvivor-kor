# PokéSurvivor 한국어 모드 설치·연결 안내

스토어·ZIP 설치는 [설치 페이지](https://evan-choi.github.io/pokesurvivor-kor/#install)에 있습니다.

## ZIP 설치

1. ZIP을 풀고 Chrome에서 `chrome://extensions`를 엽니다.
2. **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
3. `manifest.json`이 바로 들어 있는 폴더를 선택합니다. GitHub ZIP은 `extension/` 폴더입니다.
4. [게임](https://pokesurvivor.com/)을 열거나 새로고침합니다.

한국어는 자동 적용되며, 게임 **설정 → 그래픽 → 언어**에서 바꿀 수 있습니다. 스토어 설치본으로 옮길 때는 기존 확장을 끄세요.

<a id="p2p-직접-연결"></a>

## 멀티 플레이

모든 PC에 확장을 설치하고 게임을 엽니다. Windows PC마다 [방화벽 도구 ZIP](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-lan-helper.zip)을 받아 압축을 풉니다.

<a id="windows-방화벽에서-lan-대역-허용"></a>

### 같은 공유기에서 연결하기

1. 모든 PC를 같은 공유기의 Wi-Fi나 랜선에 연결합니다.
2. 각 Windows PC에서 `run-as-administrator.cmd`를 우클릭해 **관리자 권한으로 실행**합니다.
3. `1` → Wi-Fi·이더넷 추천 범위가 맞으면 Enter, 다르면 목록의 해당 범위 입력 → Chrome 경로·범위 확인 → `YES`를 입력합니다.

### Radmin VPN으로 연결하기 (Windows)

1. 모든 PC에 [Radmin VPN](https://www.radmin-vpn.com/kr/)을 설치합니다. 한 명이 **네트워크 생성**, 나머지는 같은 이름·암호로 **네트워크에 추가**합니다.
2. 각 PC에서 `run-as-administrator.cmd`를 우클릭해 **관리자 권한으로 실행**합니다.
3. `1` → 상대의 Radmin IP에 `/32`를 붙여 입력 → Chrome 경로·주소 확인 → `YES`를 입력합니다. 상대가 여러 명이면 상대마다 도구를 다시 실행합니다.

상대 IP가 `26.120.3.5`이면 `26.120.3.5/32`를 입력합니다. `/32`는 PC 한 대를 허용합니다.

이후 모든 PC에서 **게임 설정 → 네트워크 → P2P 직접 연결**을 **예**로 바꾸고 친구를 초대합니다. 이미 방에 있다면 재입장하세요.

<details>
<summary>연결이 느리거나 안 될 때</summary>

- 게스트 Wi-Fi의 기기 간 통신 차단을 확인하세요.
- Radmin은 상대가 목록에 보이는지 확인하세요. `Relay/TCP`는 Radmin의 중계 연결입니다.
- 직접 연결이 성립하지 않으면 게임은 중계 서버를 사용할 수 있습니다. Radmin 실제 게임 연결은 아직 검증하지 않았습니다.

</details>

되돌리려면 도구에서 `2` → 목록 확인 → `DELETE`를 입력합니다. [허용 범위와 상세 안내](https://github.com/evan-choi/pokesurvivor-kor/blob/main/tools/windows-lan/README.md)

## 업데이트와 설치 오류

스토어 설치본은 자동 업데이트됩니다. ZIP은 같은 폴더에 새 파일을 덮어쓰고 `chrome://extensions`에서 확장을 새로고침한 뒤 게임도 새로고침합니다. 설치 폴더는 계속 보관하세요.

설치 오류는 `manifest.json`의 위치와 Chrome 업데이트 여부를 확인하세요. 한국어가 적용되지 않으면 게임을 새로고침하고 언어 설정을 확인하세요.

[오류 제보](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml)

# PokéSurvivor 한국어 모드 설치·연결 안내

[설치 페이지](https://evan-choi.github.io/pokesurvivor-kor/#install)에서 현재 제공되는 설치 방법을 확인하세요. 스토어 설치본은 Chrome이 자동 업데이트하며, 아래는 ZIP 직접 설치 방법입니다. 스토어 설치본으로 옮길 때는 기존 확장을 꺼서 중복 실행을 피하세요.

1. 설치 ZIP의 압축을 풉니다.
2. Chrome 주소창에 `chrome://extensions`를 입력합니다.
3. 오른쪽 위의 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다** 버튼을 누릅니다.
5. `manifest.json`이 바로 들어 있는 폴더를 선택합니다.
6. [게임 페이지](https://pokesurvivor.com/)를 열거나 새로고침합니다.

설치 ZIP은 압축을 풀어 생긴 폴더 자체를 선택합니다. GitHub의 **Code → Download ZIP**으로 저장소를 받았다면 그 안의 `extension/` 폴더를 선택합니다.

처음 설치하고 게임을 열거나 새로고침하면 한국어가 자동으로 적용됩니다. 다른 언어로 바꾸려면 게임의 **설정 → 그래픽 → 언어**에서 선택하세요.

<a id="p2p-직접-연결"></a>

## 멀티 플레이

함께 플레이할 모든 PC에 확장 프로그램을 설치한 뒤 아래에서 연결 방법을 고르세요.

<a id="windows-방화벽에서-lan-대역-허용"></a>

### 같은 공유기에서 연결하기

1. 모든 PC를 **같은 공유기**의 Wi-Fi나 랜선에 연결하고 Chrome에서 게임을 엽니다.
2. Windows PC마다 [방화벽 도구 ZIP](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-lan-helper.zip)을 받아 압축을 풀고, `run-as-administrator.cmd`를 우클릭 → **관리자 권한으로 실행**합니다.
3. `1` 입력 → 현재 Wi-Fi·이더넷의 추천 범위가 맞으면 Enter, 다르면 위 목록에서 해당 범위를 입력 → 표시된 Chrome 경로와 범위를 확인하고 `YES`를 입력합니다.
4. 모든 PC에서 게임 **설정 → 네트워크 → P2P 직접 연결**을 **예**로 바꾸고, 친구를 초대해 방에 입장합니다. 이미 같은 방에 있다면 나갔다 다시 참가하세요.

### Radmin VPN으로 연결하기 (Windows)

1. 모든 PC에 [Radmin VPN](https://www.radmin-vpn.com/kr/)을 설치합니다.
2. 한 명이 **네트워크 생성(Create network)**으로 이름·암호를 정하고, 나머지는 **네트워크에 추가(Join network)**에서 같은 이름·암호를 입력합니다.
3. 각 PC에서 Chrome으로 게임을 열고, [방화벽 도구 ZIP](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-lan-helper.zip)을 받아 압축을 풉니다. `run-as-administrator.cmd`를 우클릭 → **관리자 권한으로 실행**합니다.
4. `1` 입력 → Radmin 목록에 표시된 **상대 PC의 주소 뒤에 `/32`를 붙여 입력** → 표시된 Chrome 경로와 주소를 확인하고 `YES`를 입력합니다. 상대가 여러 명이면 상대마다 도구를 다시 실행하세요.
5. 모든 PC에서 게임 **설정 → 네트워크 → P2P 직접 연결**을 **예**로 바꾸고, 친구를 초대해 방에 입장합니다. 이미 같은 방에 있다면 나갔다 다시 참가하세요.

상대의 Radmin 주소가 `26.120.3.5`라면 `26.120.3.5/32`를 입력합니다. `/32`는 그 PC 한 대만 허용한다는 뜻입니다. [Radmin 공식 연결 안내](https://www.radmin-vpn.com/kr/help/)

<details>
<summary>연결이 느리거나 안 될 때</summary>

- 같은 공유기에서는 게스트 Wi-Fi의 기기 간 통신 차단 여부를 확인하세요.
- Radmin 목록에서 상대 PC가 보이는지 확인하세요. `Relay/TCP`로 표시되면 Radmin 자체도 중계 연결을 사용하고 있습니다.
- 직접 연결이 성립하지 않으면 게임은 중계 서버를 사용할 수 있습니다. 방장 PC의 처리 지연도 영향을 줍니다.

Radmin 환경에서의 실제 게임 연결은 아직 검증하지 않았습니다.

</details>

<details>
<summary>방화벽 허용 범위와 되돌리기</summary>

도구는 지정한 상대 주소에서 Chrome으로 들어오는 UDP 연결을 허용합니다. 규칙은 모든 Windows 네트워크 프로필에 남으며, 게임 사이트나 Wi-Fi 이름에 한정되지 않습니다. Radmin에서는 함께 플레이할 상대의 주소만 `/32`로 허용하세요. IPv6는 지원하지 않습니다.

되돌리려면 도구를 다시 실행해 `2` → 규칙 목록 확인 → `DELETE`를 입력합니다. 자세한 범위는 [방화벽 도구 안내](https://github.com/evan-choi/pokesurvivor-kor/blob/main/tools/windows-lan/README.md)를 참고하세요.

</details>

## 업데이트와 문제 해결

스토어 설치본은 심사 승인 후 자동으로 업데이트됩니다. 웹사이트의 ZIP은 별도로 배포되므로 스토어 버전보다 최신일 수 있습니다.

설치한 폴더는 이동하거나 삭제하지 마세요. 새 버전은 같은 위치의 확장 프로그램 파일을 교체한 뒤 `chrome://extensions`에서 확장 프로그램 새로고침 버튼을 누르고 게임도 새로고침합니다.

`Manifest file is missing or unreadable` 오류가 나오면 선택한 폴더 안에 `manifest.json`이 바로 있는지 확인하세요. 한국어가 적용되지 않으면 설정에서 한국어가 켜져 있는지 확인하고 게임을 새로고침하세요.

Chrome 버전이 낮아 설치할 수 없다는 안내가 나오면 Chrome을 업데이트하세요.

게임 바깥의 사이트, 닉네임과 일부 보스 등장 연출은 원문으로 남습니다. 그 외에 번역이 빠졌거나 어색하다면 [번역 오류를 제보해 주세요](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml).

자세한 설명, 소스 코드와 문제 제보는 [GitHub 저장소](https://github.com/evan-choi/pokesurvivor-kor)에서 확인할 수 있습니다. 라이선스와 제3자 고지는 함께 제공된 `LICENSE`와 `THIRD_PARTY_NOTICES.md`를 참고하세요.

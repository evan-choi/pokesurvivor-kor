# Radmin VPN으로 연결하기 (Windows)

모든 PC에 확장을 설치하고 Chrome에서 게임을 엽니다. 각 PC에서 [방화벽 도구 ZIP](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-lan-helper.zip)을 받아 압축을 풉니다.

1. 모든 PC에 [Radmin VPN](https://www.radmin-vpn.com/kr/)을 설치합니다.
2. 한 명이 **네트워크 생성**으로 이름·암호를 정하고, 나머지는 **네트워크에 추가**에서 같은 이름·암호를 입력합니다.
3. 각 PC에서 `run-as-administrator.cmd`를 우클릭해 **관리자 권한으로 실행**합니다.
4. `1`을 입력하고, 상대의 Radmin IP에 `/32`를 붙여 입력합니다. 상대 IP가 `26.120.3.5`이면 `26.120.3.5/32`입니다. `/32`는 그 PC 한 대를 허용합니다. Chrome 경로와 주소를 확인하고 `YES`를 입력합니다. 상대가 여러 명이면 상대마다 도구를 다시 실행합니다.
5. 모든 PC에서 게임 **설정 → 네트워크 → P2P 직접 연결**을 **예**로 바꾸고 친구를 초대합니다. 이미 방에 있다면 나갔다 다시 참가합니다.

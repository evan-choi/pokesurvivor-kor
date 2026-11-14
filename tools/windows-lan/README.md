# Windows LAN 직접 연결 도구

같은 공유기나 Radmin VPN으로 연결한 PC 사이에서 Chrome의 UDP 수신을 허용하는 Windows 방화벽 도구입니다. 받은 ZIP의 파일을 사용하며, 실행 중 추가 프로그램을 내려받지 않습니다.

## 사용

1. ZIP을 모두 압축 해제합니다. 양쪽 PC에서 Chrome을 실행합니다.
2. `run-as-administrator.cmd`를 우클릭 → **관리자 권한으로 실행**합니다.
3. `1`을 입력합니다. 현재 연결에서 찾은 IP 대역을 확인합니다.
4. 같은 공유기라면 현재 Wi-Fi·이더넷 대역과 추천값이 맞으면 Enter, 다르면 목록의 해당 대역을 입력합니다. Radmin이라면 **상대 PC의 주소 뒤에 `/32`를 붙여 입력**합니다. 예를 들어 상대 주소가 `26.120.3.5`이면 `26.120.3.5/32`입니다. 상대가 여러 명이면 한 명씩 도구를 다시 실행합니다.
5. Chrome 경로, 허용 주소 범위, UDP 포트를 확인하고 **`YES`**를 입력합니다. 다른 입력은 취소합니다.
6. 모든 PC의 게임에서 **설정 → 네트워크 → P2P 직접 연결**을 **예**로 바꾼 뒤 친구를 초대해 방에 입장합니다. 이미 같은 방에 있다면 나갔다 다시 참가합니다.

## 변경 범위

- Google 서명을 확인한 Chrome 프로그램의 **인바운드 UDP**, Windows의 현재 동적 UDP 포트 범위(일반적으로 `49152–65535`), 입력한 상대 주소 범위만 허용합니다.
- 공용·개인·도메인 **모든 Windows 네트워크 프로필**에 적용되는 지속 규칙입니다. Wi-Fi 이름에 묶이지 않아 다른 장소에서 같은 IP 대역을 쓰면 그곳에도 적용됩니다.
- 게임 사이트만 구분하는 규칙이 아닙니다. 해당 범위의 다른 기기도 Chrome의 해당 UDP 포트에 접근할 수 있으므로 신뢰하는 작은 대역을 선택하세요. 방화벽 전체를 끄거나 공유기 포트포워딩을 변경하지 않습니다.
- 입력은 사설 IPv4 범위(`10/8`, `172.16/12`, `192.168/16`)와 Radmin의 `26/8` 내부만 받습니다. IPv6는 지원하지 않습니다.
- Radmin 네트워크 그룹과 CIDR은 다릅니다. `26.0.0.0/8`은 특정 그룹에 한정되지 않는 매우 넓은 범위입니다. 가능하면 상대 Radmin 주소에 `/32`를 붙여 각각 허용하세요. Radmin 경로의 실제 직결은 별도 확인해야 합니다.
- 이미 같은 이름의 규칙이 있으면 덮어쓰지 않고 범위를 검증합니다. 포트나 Chrome 경로가 달라졌다면 삭제 후 다시 추가하세요. 조직 정책이나 명시적 차단 규칙은 이 도구로 우회하지 않습니다.

## 되돌리기

다시 관리자 권한으로 실행하고 `2`를 입력합니다. 삭제할 규칙 목록을 확인한 뒤 **`DELETE`**를 입력하면 이 도구가 만든 CIDR 규칙만 제거합니다. 이전의 PC 한 대 전용 규칙과 다른 프로그램 규칙은 유지합니다. 이전 규칙이 남아 있으면 그 허용도 계속 적용됩니다.

## English

Windows firewall helper for PCs on the same router or Radmin VPN. Extract all files, right-click `run-as-administrator.cmd` and run as administrator. Choose `1`. For the same router, verify the suggested Wi-Fi/Ethernet range and press Enter. For Radmin, enter the other PC's Radmin address followed by `/32`, such as `26.120.3.5/32`, and repeat for each peer. Review the Chrome path, address range and UDP ports, then type `YES`. On every PC enable **Settings → Network → Direct P2P connection** in the game and join or rejoin the room.

The persistent inbound rule allows signed Google Chrome, the system's dynamic UDP port range, and the entered source CIDR on **all network profiles**. It applies to Chrome, not just the game, and is not tied to a Wi-Fi name. Prefer a small trusted range. Radmin `26.0.0.0/8` is not restricted to your Radmin group; use individual peer addresses with `/32` where possible. IPv6 is unsupported. No router forwarding or global firewall setting is changed. Direct connectivity still depends on both peers and the network.

To undo, choose `2`, review the list, and type `DELETE`. Only this tool's CIDR rules are removed; older single-peer rules are preserved. See `LICENSE` for the license.

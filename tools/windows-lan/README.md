# Windows LAN 직접 연결 도구

같은 공유기의 PC끼리 플레이하는데 Windows 방화벽이 Chrome의 UDP 수신을 막아 TURN을 사용하는 경우에 쓰는 선택 도구입니다. 확장 프로그램이 자동 실행하지 않습니다. 별도 다운로드나 설치는 하지 않습니다.

## 사용

1. ZIP을 모두 압축 해제합니다. 양쪽 PC에서 Chrome을 실행합니다.
2. `run-as-administrator.cmd`를 우클릭 → **관리자 권한으로 실행**합니다.
3. `1`을 입력합니다. 현재 연결에서 찾은 IP 대역을 확인합니다.
4. 추천 대역이 맞으면 Enter, 다르면 `192.168.0.0/24`처럼 **허용할 CIDR**을 입력합니다. 예시는 자신의 대역으로 바꾸세요. `192.168.0.123/24`를 입력해도 `192.168.0.0/24`로 정리됩니다. 한 PC만 허용하려면 `/32`를 사용합니다.
5. Chrome 경로, 허용 주소 범위, UDP 포트를 확인하고 **`YES`**를 입력합니다. 다른 입력은 취소합니다.
6. 양쪽 PC에서 필요한 설정을 완료한 뒤, 확장 팝업의 **LAN 직접 연결**을 켜고 방에 재접속합니다. **debug → 통신**에서 실제로 `직결`인지 확인합니다.

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

Optional Windows firewall helper; the extension never runs it automatically. Extract all files, right-click `run-as-administrator.cmd` and run as administrator. Choose `1`, enter a trusted LAN IPv4 CIDR (Enter accepts the suggested range), review the Chrome path, address range and UDP ports, then type `YES`. On both PCs enable **LAN 직접 연결** in the extension and rejoin the room; check **debug** for `직결` (direct).

The persistent inbound rule allows signed Google Chrome, the system's dynamic UDP port range, and the entered source CIDR on **all network profiles**. It applies to Chrome, not just the game, and is not tied to a Wi-Fi name. Prefer a small trusted range. Radmin `26.0.0.0/8` is not restricted to your Radmin group; use individual peer addresses with `/32` where possible. IPv6 is unsupported. No router forwarding or global firewall setting is changed. Direct connectivity still depends on both peers and the network.

To undo, choose `2`, review the list, and type `DELETE`. Only this tool's CIDR rules are removed; older single-peer rules are preserved. See `LICENSE` for the license.

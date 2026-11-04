# PokeSurvivor 한국어 모드 설치

1. 설치 ZIP의 압축을 풉니다.
2. Chrome 주소창에 `chrome://extensions`를 입력합니다.
3. 오른쪽 위의 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다** 버튼을 누릅니다.
5. `manifest.json`이 바로 들어 있는 폴더를 선택합니다.
6. [게임 페이지](https://pokesurvivor.pro/play)를 열거나 새로고침합니다.

`pokesurvivor-korean-0.1.0.zip`은 압축을 풀어 생긴 폴더 자체를 선택합니다. GitHub의 **Code → Download ZIP**으로 저장소를 받았다면 그 안의 `extension/` 폴더를 선택합니다.

처음 설치하면 한국어 모드가 켜집니다. 게임의 **Settings → Graphics → Language**에서 **한국어**를 선택하거나, Chrome 툴바의 확장 프로그램 아이콘에서 켜고 끌 수 있습니다.

## 업데이트와 문제 해결

설치한 폴더는 이동하거나 삭제하지 마세요. 새 버전은 같은 위치의 확장 프로그램 파일을 교체한 뒤 `chrome://extensions`에서 확장 프로그램 새로고침 버튼을 누르고 게임도 새로고침합니다.

`Manifest file is missing or unreadable` 오류가 나오면 선택한 폴더 안에 `manifest.json`이 바로 있는지 확인하세요. 한국어가 적용되지 않으면 설정에서 한국어가 켜져 있는지 확인하고 게임을 새로고침하세요.

Chrome 버전이 낮아 설치할 수 없다는 안내가 나오면 Chrome을 업데이트하세요. 설치에 필요한 최소 버전은 Chrome 119입니다.

자세한 설명, 소스 코드와 문제 제보는 [GitHub 저장소](https://github.com/evan-choi/pokesurvivor-kor)에서 확인할 수 있습니다. 라이선스와 제3자 고지는 함께 제공된 `LICENSE`와 `THIRD_PARTY_NOTICES.md`를 참고하세요.

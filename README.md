<div align="center">

<img src="extension/icons/128.png" width="80" height="80" alt="PokeSurvivor 한국어 모드 아이콘">

# PokeSurvivor 한국어 모드

[PokeSurvivor](https://pokesurvivor.pro/play)의 메뉴, 포켓몬 이름, 기술 설명을 한국어로 바꾸는 비공식 Chrome 확장 프로그램입니다.

[![CI](https://github.com/evan-choi/pokesurvivor-kor/actions/workflows/ci.yml/badge.svg)](https://github.com/evan-choi/pokesurvivor-kor/actions/workflows/ci.yml)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm_Noncommercial-6F42C1)](LICENSE)

[**다운로드**](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-korean.zip) · [프로젝트 소개](https://evan-choi.github.io/pokesurvivor-kor/) · [설치 방법](#설치) · [번역 제보](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml) · [개발 안내](docs/development.md)

</div>

**한국어** · [English](README.en.md)

<p align="center">
  <img src="docs/assets/settings-korean.png" width="640" alt="한국어로 표시된 PokeSurvivor 설정 화면">
</p>

## 번역 범위

설정, 도감, 강화, 미션, 업데이트 내역과 안내문을 번역합니다. 레벨업 선택지와 전투 중 문구에도 적용됩니다.

글꼴과 줄 간격, 버튼·카드 정렬을 한글에 맞게 조정했습니다.

## 설치

1. [한글패치 ZIP](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-korean.zip)을 내려받아 압축을 풉니다.
2. Chrome 주소창에 `chrome://extensions`를 입력합니다.
3. 오른쪽 위의 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다** 버튼을 누릅니다.
5. 압축을 풀어 생긴 `pokesurvivor-korean` 폴더를 선택합니다. **`manifest.json`이 바로 들어 있는 폴더**입니다.
6. [게임 페이지](https://pokesurvivor.pro/play)를 열거나 새로고침합니다.

설치한 폴더는 이동하거나 삭제하지 마세요.

업데이트할 때는 새 ZIP으로 기존 폴더의 파일을 교체합니다. `chrome://extensions`에서 확장 프로그램을 새로고침한 뒤 게임도 새로고침하세요.

폴더 선택 오류나 적용 문제가 있다면 [설치 도움말](docs/install.md)을 참고하세요.

<details>
<summary>GitHub 소스로 설치할 때</summary>

[저장소 ZIP](https://github.com/evan-choi/pokesurvivor-kor/archive/refs/heads/main.zip)을 받거나 Git으로 clone했다면 프로젝트 안의 **`extension/` 폴더**를 선택하세요.

</details>

## 언어 전환

처음 설치하면 한국어 모드가 켜집니다.

- 게임의 **Settings → Graphics → Language → 한국어**를 선택합니다. 한국어 모드에서는 **설정 → 그래픽 → 언어**로 표시됩니다.
- **English** 또는 **Español**을 선택하면 한국어 모드가 꺼지고 게임의 원래 언어로 돌아갑니다.
- Chrome 툴바의 확장 프로그램 아이콘에서도 **한국어로 플레이**를 켜거나 끌 수 있습니다.

선택한 설정은 다음에 접속할 때도 유지됩니다. 원래 게임 언어를 바꾸면 게임이 새로고침될 수 있습니다.

## 번역되지 않는 부분

게임 바깥의 사이트 안내, 외부 로그인 페이지, 채팅·닉네임은 번역하지 않습니다. 제품명·제작자명·단축키와 일부 보스 등장 연출도 원래 표기로 남습니다.

게임 업데이트 후 새 문구가 원문으로 보이거나 번역이 어색하다면 [번역 제보](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml)에 화면과 문구를 남겨 주세요.

게임 계정·저장 데이터·점수는 바꾸지 않습니다.

## 개발 및 기여

번역 수정이나 개발에 참여하려면 [개발 안내](docs/development.md)와 [기여 안내](CONTRIBUTING.md)를 참고하세요.

## 라이선스와 출처

이 프로젝트는 [PolyForm Noncommercial 1.0.0](LICENSE)으로 배포합니다. 상업적 이용은 허용하지 않으며, 제3자 자료에는 각각의 원래 라이선스가 적용됩니다.

원본 게임 제작자는 **JPTER78**이며, 포켓몬·기술 명칭은 [PokéAPI](https://github.com/PokeAPI/pokeapi) 데이터를 사용합니다. 자세한 출처와 저작권 고지는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 있습니다. Pokémon 및 관련 명칭의 권리는 각 권리자에게 있습니다.

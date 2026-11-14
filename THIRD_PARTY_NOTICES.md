# 제3자 자료와 라이선스

프로젝트 기본 라이선스는 `LICENSE`에 있습니다. 아래 자료의 원래 라이선스와 저작권 고지는 그대로 적용되며, 프로젝트 기본 라이선스가 이를 대체하지 않습니다.

## PokéSurvivor

- 원저작권 표시: **Copyright 2026 JPTER78**
- 게임: [공식 웹사이트](https://pokesurvivor.com/), [제작자 배포 페이지](https://jpter78.itch.io/pokesurvivor)
- 번역 기준: 초기 문구는 공개 배포본 `c31715d-game-auth-popup-overlay-20261017`, 기술 설명 및 공식 사이트 호환 확인은 `app.min.js?v=c042c25b58` (2026-11-14)
- 포함 자료: 영어·스페인어 게임 문구와 이를 바탕으로 작성한 한국어 번역, 설정·메뉴·강화·전투 화면 예시, 게임 아이콘을 바탕으로 만든 Kor 아이콘
- 배포본에 표시된 라이선스: [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)
- 변경 사항: 한국어 번역 추가, 포켓몬·기술 명칭 대조, 한국어 표시를 위한 화면 조정

원본 게임의 실행 코드와 음악 파일은 포함하지 않습니다. 아이콘 원본은 [게임의 512px 아이콘](https://pokesurvivor.com/assets/icons/icon-512.png)이며, Neo둥근모 폰트로 Kor 표시를 추가했습니다. 라이선스 전문은 `LICENSE`에도 포함되어 있습니다. 게임의 원본 GitHub 라이선스 링크는 확인 시점에 열리지 않아, 공개 배포본의 저작권·라이선스 표시와 PolyForm 공식 전문을 기준으로 고지합니다.

## PokéAPI

PokéAPI에서 제공하는 한국어 포켓몬·기술·타입·지방·도구 명칭을 사용하거나 대조했습니다. `extension/translations/pokemon.js`는 해당 데이터를 포함하며, `scripts/check-pokemon-names.mjs`는 아래 CSV를 내려받아 명칭을 확인합니다.

- [프로젝트 및 라이선스](https://github.com/PokeAPI/pokeapi/blob/master/LICENSE.md)
- [포켓몬 명칭](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_species_names.csv)
- [기술 명칭](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/move_names.csv)
- [명칭 CSV 모음](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv)

스페인어 별칭과 문장 부호가 다른 이름을 추가했습니다. 게임 고유 기술 `Swarm`은 같은 이름의 특성인 `벌레의알림`으로 표기합니다.

보유 목록의 이미지는 [PokéAPI sprites](https://github.com/PokeAPI/sprites)의 Showdown GIF와 PNG를 실행 중에 불러옵니다. 이미지 파일은 확장 프로그램에 포함하지 않습니다.

## Pokemon DPPt

이전 버전에서 사용한 **Pokemon DPPt** 폰트는 [aztecwarrior28의 FontStruction](https://fontstruct.com/fontstructions/show/1951915)이며, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)으로 제공됩니다.

사용자가 제공한 WOFF2 파일을 변경 없이 포함했습니다. 원본의 `license.txt`와 `readme.txt`는 `extension/fonts/pokemon-dppt/`에 함께 보존합니다.

## PokéSurvivor Guide

보유 목록의 티어와 전체 순위는 [PokéSurvivor Guide의 티어표](https://pokesurvivor.net/tier-list/)를, 도감 번호 연결은 [도감](https://pokesurvivor.net/pokedex/)을 실행 중에 읽어 사용합니다. 사이트의 HTML·스크립트는 확장 프로그램에 포함하지 않습니다. 사이트 자체의 능력치 기준 평가이며, 원본 게임의 공식 순위가 아닙니다.

## PokéAPI BSD-3-Clause 고지 전문

Copyright (c) © 2013–2023 Paul Hallett and PokéAPI contributors (https://github.com/PokeAPI/pokeapi#contributing). Pokémon and Pokémon character names are trademarks of Nintendo.

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

* Neither the name of PokéAPI nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## 명칭과 상표

Pokémon 및 관련 명칭·캐릭터의 권리는 Nintendo, Creatures Inc., GAME FREAK inc. 등 각 권리자에게 있습니다. 이 프로젝트는 해당 권리자 또는 원본 게임 제작자가 제공하거나 보증하는 제품이 아닙니다.

## Neo둥근모

게임과 팝업에 사용하는 Neo둥근모는 Eunbin Jeong (Dalgona.)의 폰트이며 [SIL Open Font License 1.1](https://github.com/neodgm/neodgm/blob/main/LICENSE.txt)로 제공됩니다. 사용자가 제공한 `neodgm.woff2`를 변경 없이 포함했으며, 라이선스 전문은 `extension/fonts/neodgm/LICENSE.txt`에 보관합니다.

## 검색 라이브러리

보유 포켓몬 검색에 [es-hangul 2.4.0](https://github.com/toss/es-hangul)과 [Fuse.js 7.5.0](https://github.com/krisk/Fuse)을 사용합니다. npm 배포본의 ESM 파일을 변경 없이 `extension/vendor/`에 포함하며, `npm ci` 후 `npm run vendor:search`로 다시 복사할 수 있습니다.

- es-hangul은 Viva Republica, Inc.의 MIT 라이선스로 제공됩니다. 전문은 `extension/vendor/es-hangul.LICENSE`에 있습니다.
- Fuse.js는 Kiro Risk의 Apache License 2.0으로 제공됩니다. 전문은 `extension/vendor/fuse.LICENSE`에 있습니다.

# 웹 스토어 그래픽

| 파일 | 규격 | 용도 |
| --- | --- | --- |
| `store-icon-128.png` | 128×128 PNG, 투명 | 스토어 아이콘 |
| `screenshot-1-1280x800.png` | 1280×800 PNG, 불투명 | 한국어 메뉴 |
| `screenshot-2-1280x800.png` | 1280×800 PNG, 불투명 | 강화 화면 |
| `promo-small-440x280.png` | 440×280 PNG, 불투명 | 작은 프로모션 타일 |
| `promo-marquee-1400x560.png` | 1400×560 PNG, 불투명 | 마키 프로모션 타일 |

실제 캡처의 원래 닉네임은 공개본에서 제외했습니다. 메뉴 화면은 닉네임 영역만 Kor Player로 교체하고, 강화 화면은 해당 영역이 포함되지 않게 잘랐습니다. 게임 UI는 원본 캡처를 유지했습니다.

`game-icon-source.png`는 https://pokesurvivor.com/assets/icons/icon-512.png 원본입니다. `promo-background.png`는 이 아이콘과 사용자가 제공한 게임 화면을 참고해 내장 이미지 생성 도구로 만든 배경입니다. 아이콘 Kor 표기와 프로모션 제목은 확장에 포함된 Neo둥근모 폰트로 직접 렌더링했습니다.

아이콘과 프로모션 타일 재생성: `node scripts/build-store-assets.mjs`. Playwright Chromium 설치가 필요합니다. 캡처는 원본 메뉴·닉네임 편집본·원본 강화 화면 경로를 순서대로 인수로 추가하면 생성합니다. 닉네임이 있는 원본 캡처는 저장소에 포함하지 않습니다.

배경 생성 프롬프트: “Wide 2.5:1 pixel-art Chrome extension promo background. Deep navy empty left 60%, dark green grass on the right. Red-white capture ball matching the supplied game icon with yellow pixel sparkles on the right 30%. Flat retro pixels, no UI, no text, no claims, no frame.”

닉네임 편집 프롬프트: “Replace only the original username in the top-right name pill with Kor Player. Match the existing white pixel font and dark pill background; preserve all other screenshot content.” 최종 결과에는 편집본의 닉네임 영역만 사용했습니다.

출처와 권리 고지는 [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md)를 참고하세요.

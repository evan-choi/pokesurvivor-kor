# PokéSurvivor Korean Patch

A Chrome extension for playing PokéSurvivor in Korean.

[**Install from the Chrome Web Store**](https://chromewebstore.google.com/detail/onfhhekmpdnbgpklcghiejdmgnbmjhci) · [Open game](https://pokesurvivor.com/) · [한국어](README.md)

## Getting started

1. Install the extension, then reload the game.
2. Choose **Settings → Graphics → Language → 한국어** in the game.

Chrome updates the store version automatically.

## Korean translation

Read the Pokédex, shop, missions, and move descriptions in Korean.

<img src="docs/assets/pokedex-korean.jpg" width="720" alt="Pokédex with Korean Pokémon names, move descriptions, and abilities">

<img src="docs/assets/shop-korean.jpg" width="720" alt="Shop displayed in Korean">

## Battle information

The Pokémon name, level, HP, and buffs in the top-left corner appear at 1.5× size.

| Default size | Enlarged · 1.5× |
| --- | --- |
| [![Default-sized HUD](docs/assets/battle-hud-before.png)](docs/assets/battle-info-before.png) | [![HUD enlarged to 1.5×](docs/assets/battle-hud-after.png)](docs/assets/battle-info-after.png) |

The comparison shows the top-left display from the same battle scene.

Hover over a move or item slot at the bottom to read its description. Linked moves stack upward.

<img src="docs/assets/battle-info-after.png" width="720" alt="Thunder Shock description shown by hovering over its slot during battle">

## Effect opacity

Adjust **My effects** and **Party effects** separately under **Settings → Graphics**. The images show the same scene with different player effect opacity settings.

| Default · 100% | Very transparent · 20% |
| --- | --- |
| ![Default effects](docs/assets/effects-default.png) | ![Very transparent player effects](docs/assets/effects-transparent.png) |

## Collection tiers and search

After starting the game, click the Chrome extension icon to see your Pokémon's tiers and overall rankings. Search by name, Pokédex number, or Korean initials (`ㅍㅋㅊ`). If the search finds no matches, it also checks misspellings such as `피카추`.

Rankings follow PokéSurvivor Guide's stat-based assessment. [Tier rating criteria](https://pokesurvivor.net/tier-list/)

<img src="docs/assets/collection-search.png" width="380" alt="Pokémon collection search results, with tiers and overall rankings">

An example collection filtered by the Korean initial consonant `ㄹ`.

## Direct P2P connection

Enable **Settings → Network → Direct P2P connection** to allow direct connections in multiplayer. It is off by default. Enable it on both PCs, then rejoin the room.

<img src="docs/assets/network-korean.png" width="640" alt="Direct P2P connection settings">

---

[Usage, ZIP installation, and updates (Korean)](docs/install.md) · [Report an issue](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml) · [Privacy](https://evan-choi.github.io/pokesurvivor-kor/privacy.html)

[Development (Korean)](docs/development.md) · [License](LICENSE) · [Credits](THIRD_PARTY_NOTICES.md)

# PokéSurvivor Korean Patch

A Chrome extension for playing PokéSurvivor in Korean.

[**Install from the Chrome Web Store**](https://chromewebstore.google.com/detail/onfhhekmpdnbgpklcghiejdmgnbmjhci) · [Open game](https://pokesurvivor.com/) · [한국어](README.md)

## Getting started

Korean is applied automatically when you first install the extension and open the game. Reload the game if it is already open.

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

## Multiplayer

Multiplayer traffic routed from Korea through a server in France can have high latency. The **P2P connection option** lets PCs communicate directly. Choose a guide for step-by-step Windows firewall setup and joining the game.

[Connect through the same router (Korean)](docs/install.md#같은-공유기에서-연결하기) · [Connect with Radmin VPN on Windows (Korean)](docs/install.md#radmin-vpn으로-연결하기-windows)

<img src="docs/assets/network-korean.png" width="640" alt="Direct P2P connection settings">

---

[Usage, ZIP installation, and updates (Korean)](docs/install.md) · [Report an issue](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml) · [Privacy](https://evan-choi.github.io/pokesurvivor-kor/privacy.html)

[Development (Korean)](docs/development.md) · [License](LICENSE) · [Credits](THIRD_PARTY_NOTICES.md)

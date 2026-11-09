# PokéSurvivor Korean Patch

A Chrome extension with Korean translations, a larger battle HUD, move and item tooltips, and effect visibility controls.

[**Install from Chrome Web Store**](https://chromewebstore.google.com/detail/onfhhekmpdnbgpklcghiejdmgnbmjhci) · [Installation guide](https://evan-choi.github.io/pokesurvivor-kor/en/#install) · [Open game](https://pokesurvivor.com/) · [한국어](README.md)

![Korean Pokédex with Pokémon names, natures, abilities, and move descriptions](docs/assets/pokedex-korean.jpg)

## Install

1. Open the [Chrome Web Store listing](https://chromewebstore.google.com/detail/onfhhekmpdnbgpklcghiejdmgnbmjhci) and click **Add to Chrome**.
2. Open or reload [the game](https://pokesurvivor.com/).
3. Select **한국어** under **Settings → Graphics → Language**.

Chrome automatically delivers approved updates to store installations. Manual ZIP installation is also supported.

<details>
<summary>Install manually from ZIP</summary>

1. Download the [installation ZIP](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-korean.zip) and extract it.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Click **Load unpacked** and select the extracted `pokesurvivor-korean` folder with `manifest.json` directly inside it.
4. Open or reload [the game](https://pokesurvivor.com/). Korean is enabled on first installation.

Keep the installed folder in place. Do not move or delete it.

</details>

When moving to the store version, disable the old unpacked extension. Do not run both installations together.

## Features

| Feature | Where to find it |
| --- | --- |
| Korean Pokédex, shop, bag, missions, and official Korean Pokémon names | Settings → Graphics → Language |
| 1.5× battle HUD and move/item tooltips | Battle screen |
| Separate player and party effect opacity | Settings → Graphics |
| Temporary melee targeting fix | Settings → Controls |
| Owned Pokémon tiers | Extension popup |
| P2P direct connection | Settings → Network |

## Change language

Choose a language under **설정 → 그래픽 → 언어** (Settings → Graphics → Language). Changing the language reloads the game.

## Move tooltips

Hover over a move slot at the bottom of the battle screen to see its description. Linked moves stack upward, starting with the first move at the bottom. Evolved moves also show their additional effects.

Hover over the held-item slot to see the item's name and effect.

## Effect visibility

Under **Settings → Graphics**, adjust **My effects** and **Party effects** independently: Default, Slightly transparent, Very transparent, or Hidden. Choices are saved in this browser. Enemy attacks and warnings, damage numbers, and effects without an identifiable owner remain visible. Damage calculations are unchanged.

| Before — Default | After — Very transparent |
| --- | --- |
| ![Player effects at default opacity](docs/assets/effects-default.png) | ![The same battle with player effects at 20% opacity](docs/assets/effects-transparent.png) |

A demonstration scene rendered by the actual game. Both images show the same battle frame; only **My effects** changes from Default (100%) to Very transparent (20%). Click an image to view it full size.

## Temporary melee targeting fix

Corrects melee attacks that stall while targeting a distant boss despite a nearby enemy. Disable **Settings → Controls → Melee targeting fix (temporary)** to immediately restore the original behavior. Manual aiming is unchanged. [Removal after an official fix](docs/temporary-melee-fix.md)

## Owned Pokémon tiers

Start playing the game, then open the extension to see the most recently used game tab’s owned Pokémon in **global rank order**, with tier badges, Korean names, and animated GIFs. Static images are used when a GIF is unavailable.

When a game tab is open, the popup shows your collection. Otherwise it shows the header and **Open game**.

Ranks come from the stat-based [PokéSurvivor Guide tier list](https://pokesurvivor.net/tier-list/). Rankings are cached for one day; **새로고침** (Refresh) reloads both your collection and the rankings. If an update fails, the last saved rankings are shown with a notice. Only owned species numbers currently loaded by the game are read; account IDs and login information are not queried. Guests can also view their current collection. Your game save is not sent to an external service.

<details>
<summary>View the shop and graphics settings</summary>

Items and Technical Machines with Korean descriptions.

![Kecleon Shop items and Technical Machines in Korean](docs/assets/shop-korean.jpg)

Choose the language and adjust player and party effects in the game's graphics settings.

<img src="docs/assets/settings-korean.png" width="640" alt="Graphics settings with Korean language selection and separate player and party effect controls">

</details>

## P2P direct connection

Turn it on or off under **Settings → Network → Direct P2P connection** in the game. It is off by default. Enabling it allows direct connections to other players in multiplayer.

<img src="docs/assets/network-korean.png" width="640" alt="Network settings with the P2P direct connection switch">

The game may still use its relay connections (TURN), so this does not guarantee a direct connection or lower latency. VPNs, firewalls, and router settings can prevent direct connections.

If LAN multiplayer uses TURN because Windows blocks inbound Chrome UDP, an optional [Windows LAN helper](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-lan-helper.zip) can allow a trusted CIDR after confirmation. Read the [scope and undo instructions](tools/windows-lan/README.md) first.

## Update

Store installations update automatically after review approval. Website ZIPs are deployed separately and may be newer than the store version.

For ZIP installations, replace the installed files with the latest ZIP and reload the extension at `chrome://extensions`. Reload any open game tab afterwards.

For maintainers, a version bump pushed to `main` can submit an update for store review through CI. If another version is still under review, submission stops; rerun the publishing workflow after that review finishes. The website deploys on every `main` push independently of store review. [Store and CI setup (Korean)](docs/store-publishing.md) · [Development guide (Korean)](docs/development.md)

[Installation help (Korean)](docs/install.md) · [Report a translation](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml)

[License](LICENSE) · [Credits](THIRD_PARTY_NOTICES.md)

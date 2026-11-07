# PokéSurvivor Korean Patch

An unofficial Chrome extension that translates menus, Pokémon names, and move descriptions into Korean.

[**Download**](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-korean.zip) · [Open game](https://pokesurvivor.com/) · [한국어](README.md)

## Install

1. Download the ZIP above and extract it.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Click **Load unpacked** and select the extracted `pokesurvivor-korean` folder with `manifest.json` directly inside it.
4. Open or reload [the game](https://pokesurvivor.com/). Korean is enabled on first installation.

Keep the installed folder in place. Do not move or delete it.

## Change language

Choose a language under **설정 → 그래픽 → 언어** (Settings → Graphics → Language). You can also turn **한국어로 플레이** on or off from the extension icon in Chrome. Changing the language reloads the game.

## Owned Pokémon tiers

Sign in to your game account, then open the extension from the game tab to see your owned Pokémon in **global rank order**, with tier badges, Korean names, and animated GIFs. Static images are used when a GIF is unavailable.

Ranks come from the stat-based [PokéSurvivor Guide tier list](https://pokesurvivor.net/tier-list/). Rankings are cached for one day; **새로고침** (Refresh) reloads both your collection and the rankings. If an update fails, the last saved rankings are shown with a notice. Your game save is not sent to an external service. Guest play is not supported.

<details>
<summary>View the Korean interface</summary>

<img src="docs/assets/settings-korean.png" width="480" alt="PokéSurvivor settings in Korean">

</details>

## LAN direct connection

If LAN multiplayer uses TURN because Windows blocks inbound Chrome UDP, an optional [Windows LAN helper](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-lan-helper.zip) can allow a trusted CIDR after confirmation. Read the [scope and undo instructions](tools/windows-lan/README.md) first.

## Update

Replace the files in the installed folder with the new ZIP's contents. Reload the extension at `chrome://extensions`, then reload the game.

[Installation help (Korean)](docs/install.md) · [Report a translation](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml)

[License](LICENSE) · [Credits](THIRD_PARTY_NOTICES.md)

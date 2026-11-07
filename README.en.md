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

Choose a language under **설정 → 그래픽 → 언어** (Settings → Graphics → Language). Changing the language reloads the game.

## Move tooltips

Hover over a move slot at the bottom of the battle screen to see its description. Linked moves stack upward, starting with the first move at the bottom. Evolved moves also show their additional effects.

Hover over the held-item slot to see the item's name and effect.

## Effect visibility

Under **Settings → Graphics**, adjust **My effects** and **Party effects** independently: Default, Slightly transparent, Very transparent, or Hidden. Choices are saved in this browser. Enemy attacks and warnings, damage numbers, and effects without an identifiable owner remain visible. Damage calculations are unchanged.

## Temporary melee targeting fix

Corrects melee attacks that stall while targeting a distant boss despite a nearby enemy. Disable **Settings → Controls → Melee targeting fix (temporary)** to immediately restore the original behavior. Manual aiming is unchanged. [Removal after an official fix](docs/temporary-melee-fix.md)

## Owned Pokémon tiers

Sign in to your game account, then open the extension to see the most recently used game tab’s owned Pokémon in **global rank order**, with tier badges, Korean names, and animated GIFs. Static images are used when a GIF is unavailable.

When a game tab is open, the popup shows settings and your collection. Otherwise it shows the header and **Open game**.

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

<div align="center">

<img src="extension/icons/128.png" width="80" height="80" alt="PokeSurvivor Korean language patch icon">

# PokeSurvivor Korean Language Patch

An unofficial Chrome extension that translates [PokeSurvivor](https://pokesurvivor.pro/play) menus, Pokémon names, and move descriptions into Korean.

[![CI](https://github.com/evan-choi/pokesurvivor-kor/actions/workflows/ci.yml/badge.svg)](https://github.com/evan-choi/pokesurvivor-kor/actions/workflows/ci.yml)
![Chrome 119+](https://img.shields.io/badge/Chrome-119%2B-4285F4?logo=googlechrome&logoColor=white)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm_Noncommercial-6F42C1)](LICENSE)

[**Download**](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-korean.zip) · [Project website](https://evan-choi.github.io/pokesurvivor-kor/en/) · [Install](#install) · [Report a translation](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml)

</div>

[한국어](README.md) · **English**

<p align="center">
  <img src="docs/assets/settings-korean.png" width="640" alt="PokeSurvivor settings in Korean">
</p>

## Translation coverage

The patch translates settings, the Pokédex, upgrades, missions, update notes, and notices. It also covers level-up choices and battle text.

Fonts, spacing, buttons, and cards are adjusted for Korean text.

## Install

Requires **Chrome 119 or later**.

1. [Download the extension ZIP](https://evan-choi.github.io/pokesurvivor-kor/downloads/pokesurvivor-korean.zip) and extract it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `pokesurvivor-korean` folder. It must contain **`manifest.json` directly inside it**.
6. Open or reload [PokeSurvivor](https://pokesurvivor.pro/play).

Keep the installed folder in place. To update, replace its extension files with the new version, reload the extension at `chrome://extensions`, and reload the game.

<details>
<summary>Installing from the repository source code</summary>

If you [download the repository ZIP](https://github.com/evan-choi/pokesurvivor-kor/archive/refs/heads/main.zip) or clone the repository, select the **`extension/` folder inside the project** instead.

</details>

## Switch languages

Korean mode is enabled on first installation. In the game, select **Settings → Graphics → Language → 한국어**. Selecting **English** or **Español** turns Korean mode off and restores the game's original language.

You can also toggle **한국어로 플레이** in the extension popup. Your choice is saved for the next visit. Changing the game's original language may reload the game.

## Translation limits

The surrounding website, external login pages, chat messages, and player names are not translated. Product names, creator names, keyboard shortcuts, and some boss encounter text also keep their original form.

If a game update introduces untranslated text or a translation seems wrong, [report it](https://github.com/evan-choi/pokesurvivor-kor/issues/new?template=translation.yml) with the text and a screenshot.

The extension does not change game accounts, save data, or scores.

## Development and contributions

To contribute translations or code, see the [development guide](docs/development.md) and [contribution guide](CONTRIBUTING.md), both in Korean. Report bugs or suggest translations through [GitHub Issues](https://github.com/evan-choi/pokesurvivor-kor/issues).

## License and credits

Distributed under [PolyForm Noncommercial 1.0.0](LICENSE). Commercial use is not permitted. Third-party materials retain their original licenses.

The original game was created by **JPTER78**. Pokémon and move names use data from [PokéAPI](https://github.com/PokeAPI/pokeapi). Full credits and copyright notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Pokémon and related names belong to their respective rights holders.

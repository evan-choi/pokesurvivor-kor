# Temporary melee targeting workaround

The original game can select a distant boss while an ordinary enemy is within melee range. The shared target then prevents a melee move from firing, including melee moves linked after a ranged move.

`extension/temp-melee-target.js` wraps the original combat tick. For an automatic, local melee or crossed-slash move whose cooldown is ready and current target is outside its actual radius, it temporarily selects an eligible nearby enemy from the game's spatial query. The target and aim are restored after that move. Ranged moves keep their original target; manual aim, remote players and inactive/cooling moves are untouched. Original damage, cooldowns, animations and multiplayer cast messages still run. It neither expands attack range nor increases the attack rate.

The option is enabled initially under **Settings → Controls → 근접 자동 조준 보정 (임시)**. Turn it off to immediately use the original behavior. The choice persists in `psko.temp-melee-target` in this browser, independently of account saves.

## Remove after the official fix

1. Delete the `temp-melee-target.js` entry from `extension/manifest.json` and delete that file.
2. Delete the single `PSKO_INSTALL_TEMP_MELEE_FIX` call in `extension/effects.js`. This is the only integration point; it reuses the existing one-shot module observer.
3. Remove its dedicated tests and this document, update the README note, then package and update the local installation. The unused localStorage key is harmless.

No upstream source is rewritten or bundled. If the game changes its combat module interfaces, reassess this workaround rather than extending it blindly. The 2026-11-14 bundle still gives a distant boss priority when a ranged move leads a linked group. `kind: melee` and `kind: scissor` attacks apply their aim synchronously and are covered. `kind: punch` attacks read the player's current aim again during later field updates, so they retain the original targeting behavior.

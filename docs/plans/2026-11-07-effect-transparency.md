# Effect transparency

Add two independent four-step controls to Settings → Graphics: own effects and party effects (1, 0.5, 0.2, 0). Persist locally; default to unchanged rendering.

Capture the game's module registry during its initial script execution, restore the temporary observer immediately, and validate module interfaces before installing rendering adapters. Do not publish the registry or modify the downloaded game. Track explicitly owned cast effects, projectiles and fields. Unknown ownership, enemy attacks, damage text, HUD and player sprites remain visible. Only paint opacity changes; simulation, RNG and networking continue normally.

1. Test ownership separation, original alpha, hidden effects, unaffected simulation/enemies and restoration after exceptions.
2. Add renderer adapter and native graphics controls; verify against the current game in an isolated browser.
3. Run regression tests, package, overlay D:\pokesurvivor-korean, verify every ZIP file hash.

Compatibility boundary: internal module interfaces and array-based effect renderer are upstream internals. If registry validation fails, leave rendering untouched and disable these controls. Unattributed effects remain visible rather than guessing an owner.

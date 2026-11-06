# 2026-11-06 번역 누락 조사

영어·스페인어 원문에서 각각 74개 화면·상태를 검사했다. 최신 재검사에서 실행 오류는 없었으나, 업데이트 소식의 미번역 때문에 전체 번역 검사는 여전히 실패한다.

## 반영한 수정

- 컨트롤러·수동 조준 설정, 시작 기술 선택과 선행 조건, 진화 효과 설명, 도구 선택 안내, 결과 화면, 검색 결과 없음, 툴팁 등 번역 항목 66개를 추가했다.
- 도감 필터 10종, 정렬 5종, 검색 결과 없음, 타입 필터, 보유 포켓몬 4마리의 상세·즐겨찾기 상태를 검사에 추가했다.
- 마지막 재검사에서 발견한 전체 기술 피해 증가, 햇살에서 속도 증가, 도구 끌어당기기, Discord 소개 문구도 추가 반영했다. 이 네 문구는 사전 테스트로 재검증했다.
- 단위 테스트 23개와 브라우저 테스트 28개를 통과했다.

## 후속 보완

순위 초기화 알림과 팀별 전투 결과 요약이 기존 검사에서 빠져 있었다. 알림은 기존 회원에게만 표시되는 조건을 별도 테스트 데이터로 재현하고, 결과 화면에는 실제 `team[].sum` 구조를 넣도록 검사를 수정했다. 고정 안내문의 번역 제외 처리, 보상 계산, 총 피해량·초당 피해량·도구 없음 문구를 보완했다. 확장된 전체 검사 범위는 언어별 75개 화면·상태다.

## 아직 남은 항목

- 업데이트 소식의 제목·날짜·본문 157종이 미번역 상태다. 아래 목록은 영어 재검사에서 중복을 제거한 결과다.
- 외부 YouTube 영상 제목은 원문으로 표시된다.
- Xbox, USB, Bluetooth, Firebase, 라이선스명과 LB·RB·A·B·Y·Start 같은 실제 컨트롤러 버튼명도 검사기에 탐지되지만 번역 누락으로 분류하지 않았다. 검사기의 허용 목록을 늘려 오류를 숨기지는 않았다.

## 확인 범위와 한계

새 브라우저의 게스트 계정과 메모리에 만든 보유 목록을 사용했다. 저장·구매·계정 변경 요청은 차단했다. 실제 회원 계정 전용 화면, 다른 사람과의 실시간 협동, 모든 포켓몬의 특성 조합, 실제 결제·구매 성공 이후 상태는 전수 확인하지 않았다. 이 보고서는 게임 전체에 누락이 없다는 보장이 아니다.

재현 명령은 `node scripts/audit-live-translations.mjs en`과 `node scripts/audit-live-translations.mjs es`다. 원본 검사 결과는 `test-results/translation-audit-{en,es}.json`에 생성된다. 공지와 일부 고유명사 탐지로 종료 코드는 현재 1이다.

## 미번역 업데이트 소식 목록

- Automatic saving
- 5 November 2026
- The Save button is gone: your progress now saves by itself.
- Your progress now saves by itself after each run and when you upgrade or buy. If you play on several devices, they catch up when you come back to the game.
- Gacha needs a connection
- 4 November 2026
- an account, gacha pulls need an internet connection. As a guest, and for playing and shopping, nothing changes. 사용
- Your progress, safe
- 2 November 2026
- Some players lost what they had played in the last few days after an update: if the browser opened an older version of the game again (from its cache or an old tab), that version didn't recognize the copy of the save kept by the browser and went back to the last one in the cloud. That no longer happens. And if the game ever can't read that copy, it no longer deletes it: it keeps it aside and recovers it by itself after updating.
- Offline, the game installed as an app opens the last version you used, not the one from when you installed it.
- News on mobile too
- 31 October 2026
- The menu news banner (Discord, latest video...) now also shows on phones in landscape: at the top left, above the title and your partner.
- Official Discord and against cheating
- 30 October 2026
- News banner at the top left of the menu: it cycles through the important news (there's an official Discord now!) and the channel's latest video (tap it to open it on YouTube).
- The new video notice no longer plays the video inside the game: "Watch on YouTube" (or tapping the thumbnail) opens it on YouTube.
- The Discord link in the menu banner said "invalid invite". It now takes you to the server.
- Anything changed by hand in the copy of your save kept by the browser (with cheat extensions or from the console) no longer counts: the cloud save is used, and Pokémon and shinies added with those extensions are removed. What you earn by playing is not touched.
- Halloween, one more day
- 28 October 2026
- The Halloween event lasts one more day: from October 30 to November 2 (Spain time).
- During Halloween, a few seconds after opening the game (and when the event starts or ends), the shop, the gacha or another menu screen closed by itself and sent you back to the menu. Not anymore.
- Steadier co-op
- 27 October 2026
- Mobile and tablet: new "Anchored" joystick (Settings → Controls → Place the buttons). It appears where you put your finger and stays in that spot while you hold it, even if you move your finger away; lift it and touch somewhere else, and it appears there. The usual "Floating" one follows your finger and is still the default.
- Weak Armor, Steadfast and Rattled no longer remove your Agility charges (or any better speed boost) when you get hit: they used to drop them to one.
- The Assault Vest no longer counts toward the 70% cap of the Armor cards: with the cards maxed, the vest adds on top. And if you take it off, you keep what the cards gave you.
- In very elongated windows (very wide and short), enemies no longer keep looping off screen without coming closer: it looked as if none were spawning.
- Starting quiz: your personality traits ("Patient", "Tenacious"…) were shown in Spanish in every language. They are translated now.
- Arceus damage leaderboard: "Friends only" also shows friends outside the top 50 (in All-time); All-time keeps your best damage even if that run does not beat your time; and if a run cannot enter the leaderboard, it now tells you.
- Leaderboard: since the night of October 26, many runs did not make it into the leaderboard (they did show in your profile). The game now tries harder when preparing them for the leaderboard and they get in as usual.
- Mobile: tapping "Change options" on the level-up cards sometimes picked one of the new cards by itself; and in a bond, after choosing the first move, whichever move ended up under your finger was joined instead of the one you tapped. Now only the card you tap is chosen.
- Co-op: on some networks you could only play when one particular person was the host; with someone else hosting, the others kept "reconnecting" forever. Now, if the direct connection does not work, the server connection of either player is tried (not just the host's), and it is prepared as soon as you join the room so no time is lost.
- Co-op: with a slow connection, a player could see the run minutes late (more than 4 minutes behind the others), and Arceus's Judgment turned into chaos. Now, if the connection cannot keep up, the game waits for it to catch up instead of piling up what has yet to arrive: at worst the run pauses for a moment ("waiting for the host"), but it is always up to date.
- Halloween is coming
- 26 October 2026
- Halloween event from October 30 to November 2 (Spain time). What it brings, you will find out by playing.
- On the main screen, a countdown: from two weeks before, how long until Halloween; during the event, how long is left.
- Mobile: when you log in with your username, the keyboard no longer autocorrects it or adds capitals on its own (with an unusual name, autocorrect changed it and you got "Wrong username or password").
- Mobile: the joystick no longer gets stuck when you level up. If you tapped a card with one finger while holding the joystick with the other, the card was not chosen and everything stayed frozen with the cards open. Now it is chosen when you lift your finger on it, whether or not another finger is on the screen (item and bond cards too). And if the phone misses that you lifted your finger, the joystick lets go by itself as soon as no finger is left on the screen.
- The top bar (coins, tickets, candy, your name and the buttons) fits on any screen. Before, with everything showing, on many screens (tablets too) the coins and tickets went off the left edge and the buttons split into two lines. Now, when space is short, the buttons keep only their icon, your name is shortened and very large amounts are shown short (10M).
- Mobile: the "back" button (or the back gesture) no longer takes you out of the game. During a run it pauses, on a menu screen it goes back to the menu, and only on the main menu does it leave the site. And if you pull down the notification shade or another app opens on top, the run also pauses (when playing solo).
- Mobile: the messages in the middle of the screen (the orb ones, for example) went off both sides and could not be read. Now they wrap and fit.
- Mobile: the notices at the bottom (achievements and messages) no longer catch your taps. While they were showing, they covered your moves and you could not switch moves.
- In the pause screen, Defense and Special Defense of Pokémon with a nature showed extra decimals (55.00000000000001).
- Mobile: the level-up and item cards no longer end with a stray "·" (it belonged to the keyboard keys, which are not shown on mobile). In landscape, the title tagline no longer covers the Play button, and in the collection page the Mint, Capsule and TM buttons are back to their size.
- The same tickets and Pokémon on all your devices
- 25 October 2026
- When a run ends, solo or in a group, you get the summary: each move with the damage it dealt and its damage per second, your total damage and your item. In a group, also each teammate’s, with one tab per player.
- Mobile: "Manual aim" is back (Settings → Accessibility), now with a second joystick: your finger on the right half of the screen aims your moves and the one on the left moves you. When you lift it, they aim on their own again.
- Per-Pokémon ranking: runs now count from 10 minutes (it was 5). The other rankings still count from 2 minutes.
- Public profile: your records and medals reach other players at most every 6 hours (it was every 2). You always see them right away.
- Mobile: with the level-up, item or bond cards open you can now grab the joystick by touching outside the box, and when they close you walk off without lifting your finger, like with a keyboard or controller.
- Mobile in portrait: the top bar did not show your coins, tickets or name (with so many buttons it did not fit and went off the left edge). Now it uses two lines and everything is visible.
- Gacha with a controller: skipping the animations by pressing A repeatedly pulled again by accident (after "Continue" the pull button was selected) and tickets were spent in bulk. Now the pull buttons are never selected on their own: you have to move to them.
- Gacha with a controller: you can now select "Skip" and "Continue" during a pull (B also continues).
- Orbs with a controller: each slot now shows X (use the selected one) or Y (switch) instead of the keyboard keys 5-8.
- Co-op: Pokémon with Drought, Drizzle, Sand Stream or Snow Warning now set their weather even if they are not the host (before, only the room creator’s worked).
- Co-op: the run no longer freezes for everyone if the message that someone finished choosing a card, item or bond gets lost (it happened with a momentary connection drop): it is now checked in every message.
- Cloud save: if you pressed Save shortly after another Save, the game said "Saving to the cloud in X s" and, if you left before that, it was never uploaded (your tickets were missing on the other device). Now the wait is much shorter and, if you leave the game with a pending Save, it is uploaded as you leave.
- Mobile: when you minimized the game, the music kept playing, and distorted. Now it stops and comes back when you return to the game.
- Cloud save: if you got tickets, coins or Pokémon on one device and saved on another one in the meantime, back on the first one the game thought everything was already saved ("Everything is already saved in the cloud") and did not upload it, so it never showed up on the other device. Now it checks what is really missing and Save uploads it.
- Cloud save: after spending on one device tickets or coins that had already been spent on another, your tickets could keep growing on their own every time you saved, and then suddenly drop on the other device. Now the balance is the same everywhere, and nothing you earn afterwards is taken away.
- Cloud save: if there was no connection yet when the game opened (it sometimes happens on phones), you played with the copy stored on that device, which could be old, until you pressed Save: what you got on other devices was missing. Now, as soon as the connection is back, the cloud copy is brought in and merged with yours.
- Arceus's Judgment: going very fast you could get out of the arena, where neither Arceus nor the legendaries could reach you, so you survived forever. Now nobody leaves the arena.
- Co-op: if a teammate lost connection or their phone switched off, their Pokémon stood still on the map and enemies and Arceus kept chasing it without hurting it, so nobody else got hit. Now, after 3 seconds without hearing from them, they go after the players still in the game.
- Ranking: the best runs (more than 12 defeated per second) were never uploaded, without any warning: the server rejected them entirely. Now they are always uploaded.
- Ranking: weekly, monthly and all-time now match each other. Each one was loaded separately and all-time could still be missing a time already shown in weekly.
- Friends ranking: daily, weekly and monthly only show friends who are in the top 50; it now says so instead of "No records here yet". All-time shows everyone.
- All-time ranking: if your time did not make the top 50, the ranking kept showing your old one for hours, and checking your rank could let a worse run replace the better one that had not been uploaded yet. Now your best time shows up right away and is never lost.
- the game open in two tabs of the same browser, what you get or spend in one is no longer lost when you use the other: both share their changes right away. 사용
- Moves in the collection and menu windows
- 24 October 2026
- Collection: the icons of the moves each Pokémon can learn are twice as big and, when you hover over them (or tap them on mobile), they show their type, whether they are physical or special, and what they do.
- The menu windows, Settings, What's new and Support can be closed by clicking outside them, as well as with Back or Close.
- The Kecleon Shop and What's new windows no longer slide under the top bar: they now start below it, like the other windows.
- Arceus damage ranking and Plates
- 23 October 2026
- YouTube button at the top, next to What's new: it takes you to the game's channel and, when there is a live stream, it turns red with "LIVE" and takes you to watch it.
- The ranking is now split in two: on the left, the damage you dealt to Arceus; on the right, the time survived, as always. Both halves load at once. Every board starts from zero.
- Arceus's Judgment: you can now hit it. It is invincible and only takes a small part of the damage (less and less over time), and your attacks aim at it when no legendary is left.
- Plates: in every run Arceus holds a random one, which gives it its type (you are told when you enter the arena). No move type is always the best anymore.
- At minute 35, Arceus breaks everyone's item (Focus Sash included).
- The Judgment legendaries are no longer twice as strong as the previous one: each one has 25% more HP and 15% more damage, so they can be taken down. There is no 45-minute limit in the ranking anymore.
- Evolved moves no longer change their name: they keep it with a "+" (Meteor Mash becomes Meteor Mash +). They work just like before and still stand out with their golden border.
- Meteor Mash hits softer: 24 damage instead of 34 and a slightly smaller area. Maxed and evolved it dealt almost twice as much as Rock Slide; now they are on par.
- In Arceus's Judgment, poison and burns deal a small, fixed amount to the legendaries (poison used to take a % of their HP): poisoning them and running away no longer works, you have to hit them.
- Mystery Dungeon orbs, Shiny Charms and ×100 gacha
- 22 October 2026
- Mystery Dungeon orbs: single-use items you find during the run (chests, bosses and sometimes when you defeat a Pokémon). Slumber Orb, Slow Orb and Blowback Orb put enemies to sleep, slow them down or blow them away; Focus Orb, Luminous Orb and Quick Orb give critical hits, a wider view or speed to you and nearby teammates. You carry up to 4 different ones (3 of each) and use them with keys 5-8, by tapping their slot above your moves, or with X / Y on a controller. Bosses and legendaries are less affected.
- Shiny Charms: one per region (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar and Paldea). Complete a region's Pokédex (legendaries included) to get its Shiny Charm, and shinies become twice as likely in its gacha banner: from 1% to 2%. You can find them in your Bag, along with how many you still need for each one. If you had already completed a region, its charm is already yours.
- Gacha: new ×100 pull, with 100 normal tickets or with 10 ×10 tickets (ten ×10 pulls in a row, each with its guaranteed Epic). The slot machine spins 10 times showing the best of each ×10, and at the end you get a summary (new, shiny and PokéCoins) with the cards sorted from best to worst. To make room, the ×1 pull is gone: you pull 10 or 100 at a time.
- Gacha: Skip button (or Esc) during the animation: the slot machine ends and all the cards show up at once.
- Co-op: guests no longer get "The room has been closed" in the middle of a run (sometimes after a few minutes or when entering a rift) while the others kept playing. It happened when their connection to the rooms server dropped for a moment; now the run goes on and the room recovers on its own.
- Co-op: if the connection with the host drops for a moment (a Wi-Fi or mobile data hiccup), the guest no longer loses the run: it pauses for up to 45 seconds while reconnecting and then keeps playing.
- Co-op: if you drop out of a run while the others keep playing, you no longer get "The room has been closed": you wait in the room and, when they finish, you play together again.
- The big update: Kecleon Shop
- 21 October 2026
- New: the Kecleon Shop (button in the menu) with Mints, Ability Capsules and 8 new TMs every day. Every Pokémon now has its own nature (±10% to two stats) and ability, with an effect in the run; you can see and change them on its page in the collection. TMs permanently teach moves outside its types, but only if it learns them in the games (Mewtwo can learn Shadow Ball; Psyduck cannot learn Flamethrower). Thanks to TheAdro7 for the idea and the groundwork.
- New upgrade, Second starting move: with Repertoire, buy it once per Pokémon and then choose for free the second move you start with (or leave it random).
- Co-op: if your networks cannot connect to each other directly (it sometimes happens on mobile data and with some routers), the match now goes through our server and you can still play together. If you can connect directly, nothing changes. You need to be signed in with an account.
- Co-op: if you go down, you can watch a teammate who is still standing while you wait to be revived. Press the button under the message (or Q / E, or LB / RB on a controller) to switch between them and back to yourself. Only the camera changes: it uses no extra connection.
- Cloud save: if you played and saved on one device, another device that still had the game open could upload its old copy over it (when saving or when the game updated), and your new tickets and Pokémon did not show up on the other one. Now, if the cloud has something newer, it is merged with yours before saving and nothing is lost.
- Safer co-op and move fixes
- 20 October 2026
- On mobile the "Manual aim" option is gone (it did not work with the touch screen): moves always aim on their own.
- Per-Pokémon leaderboard: runs now count from 5 minutes on (the other leaderboards still from 2 minutes).
- Friends: you no longer see who is online, and you can invite any friend to a room (if they do not join, the invite expires on its own after 3 minutes).
- Cloud save: your game is now only uploaded to the cloud when you press the Save button at the top (and before a game update). Everything is still saved instantly in this browser. If you play on another device or are about to clear your browser data, press Save first.
- New friend requests show up when you open Friends.
- Co-op: a player with a tampered game can no longer freeze the others by sending impossible numbers (infinite experience froze the host and a giant effect froze the guests).
- Upgrades: after changing your partner, the upgrades screen now opens on the new one instead of the last one you had looked at.
- Co-op: a guest's Ominous Wind, Sand Tomb and Whirlpool now pull enemies in (only the host's did).
- Co-op: a guest's Hex now deals its extra damage to burned, poisoned or slowed enemies.
- Acid Spray, Electro Ball, Seed Bomb, Signal Beam, Power Gem, Mist Ball, Energy Ball, Ice Shard, Shadow Sneak and Draining Kiss: once evolved, the shots flew off to the sides and hit nothing. Now they go forward, and the "+1 projectile" upgrade really adds one (it added none before).
- Co-op: if someone's level-up cards closed before they had picked (it could happen when picking very fast), they now open again and the others are no longer left waiting for them.
- 38 new moves
- 19 October 2026
- 38 new moves: every type now has 5 or more (Rock, Fighting, Dragon and Fairy had only 2). Among them Hyper Beam, Solar Beam, Magnitude, Whirlpool, Thunder Wave, Outrage, Play Rough, Sucker Punch... each with its evolution.
- New ways to attack: shots that chase enemies or bounce between them, beams you charge up, spins that hit everything around you, shockwaves that travel along the ground, vortexes that pull enemies in, waves that push them away and zones that stun them.
- New upgrade, Starting move: buy it once per Pokémon and then choose for free which move it starts the run with.
- New languages: French, Italian, Brazilian Portuguese, Simplified Chinese and Traditional Chinese, in Settings > Graphics > Language. Thanks to everyone who translated them.
- A joke line on the main menu title, like the ones in Minecraft.
- Single-type Pokémon deal 20% more damage with moves of their type, to make up for having less variety.
- Learning a new move no longer switches to it on its own: you keep the one you were using and switch whenever you want.
- The game can only be played on its official website, pokesurvivor.com: if another site embeds it in its own page (for example, to put ads around it), a notice appears with a button to go to the official one.
- Starting move: you can now go back to the default move even if it is not of its type (for example Confusion on Psyduck).
- Co-op: the boss due when coming back from a rift could appear thousands of metres away, where nobody could find it, and the run got no more rifts. Now it appears nearby, and if a boss ends up very far from everyone, it shows up close again after a few seconds.
- When reloading, the new page sometimes got mixed with the old styles saved in the browser (for example, the title line showed up big and stuck to "PokéSurvivor"). That no longer happens.
- Physical and special, controller, Save button and fresh leaderboards
- 18 October 2026
- Physical and special moves, like in the games: every Pokémon has its Attack, Special Attack, Defense and Special Defense. Physical moves use its Attack and special moves its Special Attack: Machamp hits hard with Karate Chop and weakly with Shadow Ball. With moves on its strong side it hits as hard as before. When leveling up, each card says whether the move is physical or special and how well it works with your Pokémon, and the collection shows all its stats.
- Swords Dance and Dragon Dance now raise only (physical) Attack, like in the games, and Nasty Plot arrives, raising Special Attack, learnable by any Pokémon. When leveling up, moves on your Pokémon’s strong side show up twice as often.
- Run summary in the pause screen: each move with its category, the damage it has dealt and its damage per second; your stats with everything you have raised; and your item and the upgrade cards you have.
- Defenses count too (a little): enemies resist your physical moves with their Defense and special moves with their Special Defense, and each enemy hits you with its strong side, which you block with your Defense or Special Defense.
- You can now play with a controller (Xbox, PlayStation, Switch and most USB or Bluetooth controllers): move, switch attacks, pause, pick cards and use every menu, with vibration when you take damage. Set it up in Settings > Controls.
- Collection: search by name or number, a tab with every generation, filters that combine (owned / missing, several rarities at once, shiny, favorites and type) and sorting by number, name, rarity, recently caught or most played. Plus favorites: mark them on each Pokémon’s page; they go with your account, on all your devices.
- New Accessibility tab in Settings with “Manual aim”: your attacks go towards the mouse or wherever you push the controller’s right stick, instead of the nearest enemy. It is off by default.
- Save button at the top right: it uploads your game to the cloud right away. Use it before closing the game or switching devices.
- Level-up, bond and item cards can’t be picked for a moment after they appear (they look dimmed): pressing 1-4 or tapping to switch attacks mid-fight no longer picks a card by accident.
- a controller you can now select the Pokémon you don’t have yet in the collection, and on mobile the Settings tabs fit in one row that scrolls sideways. 사용
- Your game is saved to the cloud automatically every 10 minutes.
- All-time leaderboard: if you are below rank 1,000, it shows “#1000+” instead of the exact number.
- Big Pokémon (Onix, Gyarados, Wailord, Eternatus, the legendaries...) are now properly playable: they look a bit smaller, while still being among the biggest, and collide like a normal one, so they fit through every corridor and don’t take extra hits because of their size.
- There are at most 3 healers, 3 shielders and 3 summoners at a time.
- Healers and shielders no longer make a boss unkillable: their healing and shields scale with the damage you are dealing to it, and it only gets one shield every 6 seconds.
- Judgment of Arceus: speed has a soft cap (anything above a certain point counts much less) and legendaries run almost as fast as you. After 5 minutes of Judgment, Arceus keeps speeding up, and after 7 its touch takes more and more HP, until it knocks you out in one hit around minute 40.
- Poison still takes a percentage of HP, but against enemies with huge HP (the Judgment legendaries) that percentage is smaller.
- All leaderboards start from scratch (daily, weekly, monthly, yearly and all-time): records from running away from Arceus could no longer be reached.
- Security: we closed a hole that let someone put code in their leaderboard row or profile and make it run in the browser of whoever opened them (some people were sent to a video). Now everything coming from other players is cleaned, the server only accepts what it should, and the browser runs nothing that isn’t part of the game.
- The leaderboard now shows Pokémon in shiny form for players who played with their shiny.
- Required updates
- 15 October 2026
- When an update is required (for example, to fix an important bug), your current run ends after a 10 s notice and the game reloads. You lose nothing: that run’s coins, tickets, records and leaderboard entry are saved as if you had quit.
- Playing on two devices (PC and phone) no longer loses coins or tickets: before, if one had the game open with old data and saved, it erased what you earned on the other. Now both are added up. And when you come back to the game after a while away, it brings in what you got on the other device (Pokémon, shinies...) without reloading.

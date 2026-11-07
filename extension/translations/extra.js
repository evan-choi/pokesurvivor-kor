// Hosted build additions that are not part of the game's Spanish/English dictionary.
globalThis.PSKO_MESSAGES = (globalThis.PSKO_MESSAGES || []).concat([
  ['Infortunio +', 'Hex +', '병상첨병 +'],
  // The normal partner button has no suffix; the {x} variant requires one.
  ['Elegir de compañero', 'Choose as partner', '파트너로 선택'],
  // The game's own translator can partially translate this before our observer runs.
  ['Choose de partner', 'Choose de partner', '파트너로 선택'],
  ['Choose de partner{x}', 'Choose de partner{x}', '파트너로 선택{x}'],
  // Region names from PokéAPI region_names.csv (Korean language ID 3).
  ['Kanto', 'Kanto', '관동'],
  ['Johto', 'Johto', '성도'],
  ['Hoenn', 'Hoenn', '호연'],
  ['Sinnoh', 'Sinnoh', '신오'],
  ['Kalos', 'Kalos', '칼로스'],
  ['Alola', 'Alola', '알로라'],
  ['Galar', 'Galar', '가라르'],
  ['Paldea', 'Paldea', '팔데아'],
  ['Shiny', 'Shiny', '색이 다른'],
  ['Accesibilidad', 'Accessibility', '접근성'],
  ['Tienda Kecleon', 'Kecleon Shop', '켈리몬 상점'],
  ['Mentas, Cápsulas y MT', 'Mints, Capsules and TMs', '민트, 특성캡슐, 기술머신'],
  ['Mochila', 'Bag', '가방'],
  ['Vacía', 'Empty', '비어 있음'],
  ['Juega en grupo, hasta 4', 'Play in a group, up to 4', '최대 4명이 함께 플레이'],
  ['Sign in', 'Sign in', '로그인'],
  ['si alguien te pide pagar, no somos nosotros', 'if someone asks you to pay, it is not us', '이 게임은 무료입니다'],
  ['Web oficial: pokesurvivor.com · si alguien te pide pagar, no somos nosotros', 'Official website: pokesurvivor.com · si alguien te pide pagar, no somos nosotros', '공식 웹사이트: pokesurvivor.com · 이 게임은 무료입니다'],
  ['Sign in / Register', 'Sign in / Register', '로그인 / 회원가입'],
  ['Iniciar sesión / Registrarse', 'Iniciar sesión / Registrarse', '로그인 / 회원가입'],
  ['Return to this run', 'Return to this run', '진행 중인 게임으로 돌아가기'],
  ['Use the same game account on PokeSurvivor and every site that embeds the game. You can also play as a guest.', 'Use the same game account on PokeSurvivor and every site that embeds the game. You can also play as a guest.', 'PokéSurvivor와 이 게임을 제공하는 사이트에서 같은 게임 계정을 사용할 수 있습니다. 게스트로도 플레이할 수 있습니다.'],
  ['You’re playing as a guest. Sign in to save future progress to your game account.', 'You’re playing as a guest. Sign in to save future progress to your game account.', '게스트로 플레이 중입니다. 로그인하면 이후 진행 상황을 게임 계정에 저장할 수 있습니다.'],
  ['Finish this run before signing out.', 'Finish this run before signing out.', '현재 게임을 마친 뒤 로그아웃해 주세요.'],
  ['Guest mode: progress is not saved to an account. Guest scores are saved under a browser nickname.', 'Guest mode: progress is not saved to an account. Guest scores are saved under a browser nickname.', '게스트 모드: 진행 상황은 계정에 저장되지 않습니다. 점수는 이 브라우저의 닉네임으로 저장됩니다.'],
  ['Leaderboard', 'Leaderboard', '순위표'],
  ['Game Guide', 'Game Guide', '게임 가이드'],
  ['Moves & Types', 'Moves & Types', '기술과 타입'],
  ['Tier List Maker', 'Tier List Maker', '티어표 만들기'],
  ['Show site navigation', 'Show site navigation', '사이트 메뉴 열기'],
  ['Play the PokeSurvivor browser game', 'Play the PokeSurvivor browser game', 'PokéSurvivor 게임 플레이'],
  ['Loading the game…', 'Loading the game…', '게임 불러오는 중…'],
  ['Poke Survivor leaderboard', 'Poke Survivor leaderboard', 'PokéSurvivor 순위표'],
  ['SHARED RECORDS', 'SHARED RECORDS', '플레이 기록'],
  ['Every run leaves a mark.', 'Every run leaves a mark.', '모든 도전은 기록으로 남습니다.'],
  ['games played', 'games played', '누적 플레이'],
  ['Your adventures', 'Your adventures', '내 모험 기록'],
  ['Your best rank', 'Your best rank', '내 최고 순위'],
  ['How rankings work', 'How rankings work', '순위 집계 방식'],
  ['Play a run to claim your place on the board.', 'Play a run to claim your place on the board.', '게임을 플레이하고 순위표에 이름을 올려 보세요.'],
  ['This week', 'This week', '이번 주'],
  ['This month', 'This month', '이번 달'],
  ['24 hours', '24 hours', '최근 24시간'],
  ['All time', 'All time', '전체 기간'],
  ['COUNTRY', 'COUNTRY', '국가'],
  ['PARTNER', 'PARTNER', '파트너'],
  ['SCORE', 'SCORE', '점수'],
  ['Previous', 'Previous', '이전'],
  ['Page {x} of {x}', 'Page {x} of {x}', '{x} / {x} 페이지'],
]);

// Additional states found by the live UI audit.
globalThis.PSKO_MESSAGES = (globalThis.PSKO_MESSAGES || []).concat([
  ["Política de privacidad","Privacy policy","개인정보 처리방침"],
  ["Último vídeo","Latest video","최신 영상"],
  ["Novedades importantes","Important news","주요 소식"],
  ["Anterior","Previous","이전"],
  ["Siguiente","Next","다음"],
  ["{x} Pokémonedas","{x} PokéCoins","포켓코인 {x}개"],
  ["Mi canal de YouTube","My YouTube channel","제작자 YouTube 채널"],
  ["Folagor, Sekiam, PokeAlex: ¿un hueco?","Folagor, Sekiam, PokeAlex: room for one more?","Folagor, Sekiam, PokeAlex: 한 자리 더 있나요?"],
  ["Mando","Controller","컨트롤러"],
  ["mando 사용","mando 사용","컨트롤러"],
  ["Xbox, PlayStation, Switch y la mayoría de mandos USB o Bluetooth. Conéctalo y pulsa cualquier botón.","Xbox, PlayStation, Switch and most USB or Bluetooth controllers. Connect it and press any button.","Xbox, PlayStation, Switch 및 대부분의 USB·Bluetooth 컨트롤러를 지원합니다. 연결한 뒤 아무 버튼이나 누르세요."],
  ["Usar mando","Use controller","컨트롤러 사용"],
  ["Moverte, cambiar de ataque y manejar los menús con el mando.","Move, switch attacks and use the menus with a controller.","컨트롤러로 이동하고, 기술을 전환하고, 메뉴를 조작합니다."],
  ["Vibración","Vibration","진동"],
  ["El mando vibra al recibir daño (si el mando y el navegador lo permiten).","The controller vibrates when you take damage (if your controller and browser support it).","피해를 받으면 컨트롤러가 진동합니다. 컨트롤러와 브라우저가 진동을 지원해야 합니다."],
  ["Stick izq.","Left stick","왼쪽 스틱"],
  ["Cruceta","D-pad","방향 패드"],
  ["moverse · elegir en los menús","move · choose in menus","이동 · 메뉴 선택"],
  ["pulsar (en los menús) · saltar la animación de Arceus","press (in menus) · skip the Arceus cutscene","메뉴에서 선택 · 아르세우스 연출 건너뛰기"],
  ["cambiar las cartas al subir de nivel","reroll the cards when leveling up","레벨 업 카드 다시 뽑기"],
  ["Stick der.","Right stick","오른쪽 스틱"],
  ["Apuntado","Aiming","조준"],
  ["Apuntar a mano","Manual aim","수동 조준"],
  ["Tus ataques van hacia el ratón (o hacia donde empujes el stick derecho del mando) en vez de al enemigo más cercano. Si sueltas el stick y no mueves el ratón, vuelve a apuntar solo. La cadena y los meteoros siguen buscando a los enemigos solos.","Your attacks go towards the mouse (or wherever you push the controller’s right stick) instead of the nearest enemy. If you let go of the stick and don’t move the mouse, it aims by itself again. Chain and meteor moves still find enemies by themselves.","마우스나 컨트롤러 오른쪽 스틱이 가리키는 방향으로 공격합니다. 스틱을 놓고 마우스를 움직이지 않으면 자동 조준으로 돌아갑니다. 연쇄형·운석형 기술은 계속 자동으로 적을 찾습니다."],
  ["Todas","All types","모든 타입"],
  ["Orden:","Sort:","정렬:"],
  ["Nº","No.","도감 번호"],
  ["Recién conseguidos","Recently caught","최근 포획순"],
  ["Pega mejor con ataques","Hits harder with","더 강한 공격 분류:"],
  ["físicos","physical moves","물리 기술"],
  ["especiales","special moves","특수 기술"],
  ["+{x} % de daño de tipo {x} con poca vida (menos de 1/3).","+{x}% {x}-type damage at low HP (under 1/3).","체력이 1/3 미만이면 {x}% 피해 증가 · {x}타입 기술"],
  ["Monotipo: +{x} % de daño con sus ataques de tipo {x}","Single type: +{x}% damage with its {x}-type moves","단일 타입: {x}% 피해 증가 · {x}타입 기술"],
  ["Tipo","Type","타입"],
  ["Movimiento inicial","Starting move","시작 기술"],
  ["Eliges con qué ataque empiezas la partida","Choose which move you start the run with","게임을 시작할 때 사용할 기술을 선택합니다"],
  ["Segundo movimiento inicial","Second starting move","두 번째 시작 기술"],
  ["Eliges el segundo ataque con el que empiezas (necesita Repertorio)","Choose the second move you start with (needs Repertoire)","두 번째 시작 기술을 선택합니다 (시작 기술 확장 필요)"],
  ["Necesita Repertorio","Needs Repertoire","시작 기술 확장 필요"],
  ["Primero compra Repertorio","Buy Repertoire first","먼저 시작 기술 확장을 구매하세요"],
  ["Tirar ×100 ·","Pull ×100 ·","100회 뽑기 ·"],
  ["Elige una recompensa","Choose a reward","보상을 선택하세요"],
  ["×1,8 daño, rayo un 50% más grueso y carga más rápido","×1.8 damage, 50% thicker beam and faster charge","피해 ×1.8, 빔 두께 50% 증가, 충전 속도 증가"],
  ["×1,8 daño, +1 vuelta y más radio","×1.8 damage, +1 spin and more radius","피해 ×1.8, 회전 1회 추가, 반경 증가"],
  ["×1,8 daño, más radio y atrae más fuerte","×1.8 damage, more radius and stronger pull","피해 ×1.8, 반경 및 끌어당기는 힘 증가"],
  ["×1,8 daño, +2 rebotes y +1 proyectil","×1.8 damage, +2 bounces and +1 projectile","피해 ×1.8, 튕김 2회 추가, 투사체 1개 추가"],
  ["×1,8 daño, +2 proyectiles y más grandes","×1.8 damage, +2 projectiles and bigger","피해 ×1.8, 투사체 2개 추가 및 크기 증가"],
  ["×1,8 daño, más radio y aturde más rato","×1.8 damage, more radius and longer stun","피해 ×1.8, 반경 및 기절 시간 증가"],
  ["×1,8 daño, más radio y empuja más","×1.8 damage, more radius and stronger push","피해 ×1.8, 반경 및 밀어내는 힘 증가"],
  ["×1,8 daño, +3 ondas y ondas más grandes","×1.8 damage, +3 waves and bigger waves","피해 ×1.8, 파동 3개 추가 및 크기 증가"],
  ["Sólo puedes llevar uno","You can only hold one","하나만 지닐 수 있습니다"],
  ["esferas ·","orbs ·","구슬 ·"],
  ["{x} (tecla {x}): {x}","{x} (key {x}): {x}","{x} ({x}번 키): {x}"],
  ["{x} (X para usarla): {x}","{x} (X to use it): {x}","{x} (X 버튼으로 사용): {x}"],
  ["{x} (tócala encima de tus ataques): {x}","{x} (tap it above your moves): {x}","{x} (기술 위의 구슬을 터치): {x}"],
  ["Tus esferas","Your orbs","보유 구슬"],
  ["Aún no llevas esferas. Salen de los cofres, de los jefes y, a veces, al derrotar a un Pokémon.","You have no orbs yet. They come from chests, bosses and sometimes from defeated Pokémon.","아직 보유한 구슬이 없습니다. 상자를 열거나 보스를 쓰러뜨리면 구슬을 얻을 수 있습니다. 일반 포켓몬도 가끔 구슬을 떨어뜨립니다."],
  ["Arrastra el dedo para moverte · toca un ataque para cambiarlo · toca una esfera para usarla","Drag your finger to move · tap a move to switch · tap an orb to use it","드래그해서 이동 · 기술을 터치해서 전환 · 구슬을 터치해서 사용"],
  ["Daño a Arceus","Damage to Arceus","아르세우스에게 준 피해"],
  ["desplazar las listas · apuntar (si activas Apuntar a mano en Accesibilidad)","scroll lists · aim (if you turn on Manual aim in Accessibility)","목록 스크롤 · 조준 (접근성에서 수동 조준을 켠 경우)"],
  ["Ninguno con estos filtros.","None with these filters.","조건에 맞는 포켓몬이 없습니다."],
  ["oculta","hidden","숨겨진 특성"],
  ["+40% special damage in sun, but the sun drains some HP.","+40% special damage in sun, but the sun drains some HP.","햇살이 강하면 특수 피해가 40% 증가하지만 체력이 조금씩 줄어듭니다."],
  ["+15% damage to enemies below half HP.","+15% damage to enemies below half HP.","체력이 절반 미만인 적에게 주는 피해가 15% 증가합니다."],
  ["+{x} % de daño con movimientos de tipo {x}.","+{x}% damage with {x}-type moves.","{x}% 피해 증가 · {x}타입 기술"],
  ["Recupera un {x} % de su vida por segundo.","Recupera un {x} % de su vida por segundo.","매초 체력을 {x}% 회복합니다."],
  ["¡Ya hay Discord oficial!","There's an official Discord now!","공식 Discord가 열렸습니다!"],
  ["Talk about the game, find a group and hear about everything first.","Talk about the game, find a group and hear about everything first.","게임 이야기를 나누고, 함께할 동료를 찾고, 새 소식을 먼저 받아보세요."]
]);

globalThis.PSKO_MESSAGES = (globalThis.PSKO_MESSAGES || []).concat([
  ['+12 % de daño con todos sus movimientos.', '+12% damage with all its moves.', '모든 기술의 피해가 12% 증가합니다.'],
  ['+50 % de velocidad con sol.', '+50% speed in sun.', '햇살이 강하면 이동 속도가 50% 증가합니다.'],
  ['Atrae los objetos desde más lejos (+10 % de imán).', 'Atrae los objetos desde más lejos (+10 % de imán).', '도구를 더 먼 곳에서 끌어당깁니다 (자석 범위 10% 증가).'],
  ['Habla del juego, busca grupo y entérate de todo antes que nadie.', 'Talk about the game, find a group and hear about everything first.', '게임 이야기를 나누고, 함께할 동료를 찾고, 새 소식을 먼저 받아보세요.']
]);

globalThis.PSKO_MESSAGES = (globalThis.PSKO_MESSAGES || []).concat([
  ['Las clasificaciones se han reiniciado', 'The leaderboards have been reset', '순위표가 초기화되었습니다'],
  ['Entendido', 'Got it', '확인'],
  ['Resumen de la partida', 'Run summary', '전투 요약'],
  ['Daño', 'Damage', '피해량'],
  ['Por segundo', 'Per second', '초당 피해량'],
  ['Sin objeto.', 'No item.', '지닌 도구가 없습니다.'],
  ['{x} · Nv. {x} · {x} de daño en total', '{x} · Lv. {x} · {x} damage in total', '{x} · 레벨 {x} · 총 피해량 {x}'],
  ['Tiempo {x} · Derrotados {x} · recogidas {x}', 'Time {x} · Defeated {x} · recogidas {x}', '시간 보상 {x} · 격파 보상 {x} · 주운 코인 {x}']
]);

globalThis.PSKO_MESSAGES = (globalThis.PSKO_MESSAGES || []).concat([
  ['Los rankings se han reiniciado', 'The leaderboards have been reset', '순위표가 초기화되었습니다'],
  ['Hemos ajustado la', 'We have adjusted the', '다음 콘텐츠를 조정했습니다:'],
  [': huir corriendo con toda la velocidad subida y el veneno ya no sirven para aguantar para siempre.', ': running away with maxed-out speed and poison no longer let you last forever.', '. 이제 이동 속도를 최대로 높이고 독을 이용해 도망쳐도 무한히 버틸 수 없습니다.'],
  ['Para que todos compitáis en igualdad,', 'So everyone competes on equal terms,', '공정한 경쟁을 위해'],
  ['todos los rankings empiezan de cero', 'all leaderboards start from scratch', '모든 순위표를 초기화했습니다'],
  ['(hoy, semana, mes, año e histórico). ¡A por el primer puesto!', '(daily, weekly, monthly, yearly and all-time). Go for first place!', '(일간·주간·월간·연간·전체 기간). 1위에 도전하세요!']
]);

globalThis.PSKO_MESSAGES = (globalThis.PSKO_MESSAGES || []).concat([
  ["Sentencia de Arceus", "Judgment of Arceus", "아르세우스의 심판"]
]);

// Keep the title and effect together so the canvas can identify wrapped tooltip lines.
globalThis.PSKO_ORBS = [
  [
    ["Soporesfera","Slumber Orb","잠들기구슬"],
    ["Duerme a los enemigos de la pantalla 4 s (a los jefes, 1 s).","Puts the enemies on screen to sleep for 4 s (bosses, 1 s).","화면 안의 적을 4초 동안 재웁니다. 보스는 1초 동안 잠듭니다."],
  ],
  [
    ["Ralentosfera","Slow Orb","둔화의구슬"],
    ["Los enemigos de la pantalla van un 50 % más lentos durante 8 s (los jefes, un 20 %).","Enemies on screen move 50% slower for 8 s (bosses, 20%).","8초 동안 화면 안의 적은 이동 속도가 50%, 보스는 20% 감소합니다."],
  ],
  [
    ["Rafagaesfera","Blowback Orb","날려버리기구슬"],
    ["Lanza lejos a los enemigos que tienes cerca (a los jefes, la mitad).","Blows nearby enemies far away (bosses, half as far).","주변의 적을 멀리 날려버립니다. 보스는 절반 거리만큼 밀려납니다."],
  ],
  [
    ["Focosfera","Focus Orb","집중의 구슬"],
    ["+25 % de crítico durante 15 s, para ti y los compañeros cercanos.","+25% critical chance for 15 s, for you and nearby teammates.","15초 동안 자신과 주변 팀원의 급소 확률이 25% 증가합니다."],
  ],
  [
    ["Luminosfera","Luminous Orb","빛의구슬"],
    ["Ves más campo (la cámara se aleja) durante 15 s, tú y los compañeros cercanos.","You see more of the map (the camera zooms out) for 15 s, you and nearby teammates.","15초 동안 자신과 주변 팀원의 카메라가 멀어져 더 넓은 범위를 볼 수 있습니다."],
  ],
  [
    ["Rapidosfera","Quick Orb","발빠름구슬"],
    ["+40 % de velocidad durante 10 s, para ti y los compañeros cercanos.","+40% speed for 10 s, for you and nearby teammates.","10초 동안 자신과 주변 팀원의 이동 속도가 40% 증가합니다."],
  ],
];
globalThis.PSKO_MESSAGES = globalThis.PSKO_MESSAGES.concat(globalThis.PSKO_ORBS.flat());

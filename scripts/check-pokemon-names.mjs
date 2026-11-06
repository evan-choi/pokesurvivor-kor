// Recheck the bundled names against PokéAPI. This developer command uses the network;
// the Chrome extension itself never downloads translations.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

if (!process.argv.includes('--online')) {
  console.error('최신 PokéAPI 데이터를 조회하려면 --online을 지정하세요.');
  process.exit(1);
}

const context = vm.createContext({});
for (const file of ['moves', 'menus', 'progress', 'settings', 'extra', 'shop', 'interface', 'changelog', 'pokemon']) {
  vm.runInContext(await readFile(new URL(`../extension/translations/${file}.js`, import.meta.url), 'utf8'), context);
}
vm.runInContext(await readFile(new URL('../extension/translation-core.js', import.meta.url), 'utf8'), context);

// Existing translation baseline from c31715d-game-auth-popup-overlay-20261017:
// 64 base moves and 59 evolved moves. Some internal IDs differ from displayed names.
const previousMoveNames = [
  "Tackle", "Quick Attack", "Swords Dance", "Agility", "Harden", "Ember",
  "Flamethrower", "Fire Spin", "Heat Wave", "Water Gun", "Bubble", "Hydro Pump",
  "Aqua Ring", "Vine Whip", "Razor Leaf", "Petal Blizzard", "Grass Knot", "Thunder Shock",
  "Discharge", "Thunderbolt", "Confusion", "Psybeam", "Psychic", "Sludge",
  "Mud Shot", "Gust", "Wing Attack", "Body Slam", "Hyper Voice", "Poison Sting",
  "Toxic", "Bulldoze", "Bug Bite", "String Shot", "Bug Buzz", "Rock Throw",
  "Rock Slide", "Ice Beam", "Powder Snow", "Karate Chop", "Aura Sphere", "Lick",
  "Shadow Ball", "Dragon Rage", "Dragon Dance", "Fairy Wind", "Dazzling Gleam", "Metal Claw",
  "Flash Cannon", "Bite", "Dark Pulse", "Night Shade", "Bonemerang", "Psycho Cut",
  "Spikes", "Toxic Spikes", "Hail", "Meteor Mash", "Will-O-Wisp", "Substitute",
  "Aerial Ace", "Flame Wheel", "Bubble Beam", "Hex", "Take Down", "Extreme Speed",
  "Giga Impact", "Uproar", "Fire Blast", "Overheat", "Sacred Fire", "Eruption",
  "Scald", "Surf", "Hydro Cannon", "Power Whip", "Leaf Storm", "Petal Dance",
  "Frenzy Plant", "Thunder", "Electric Terrain", "Zap Cannon", "Psyshock", "Future Sight",
  "Expanding Force", "Sludge Bomb", "Poison Jab", "Poison Gas", "Earth Power", "Earthquake",
  "Hurricane", "Brave Bird", "X-Scissor", "Sticky Web", "Swarm", "Stone Edge",
  "Stealth Rock", "Blizzard", "Icy Wind", "Close Combat", "Focus Blast", "Shadow Punch",
  "Phantom Force", "Draco Meteor", "Moonblast", "Misty Terrain", "Iron Head", "Steel Beam",
  "Crunch", "Snarl", "Nightmare", "Bone Rush", "Psychic Fangs", "Fissure",
  "Gunk Shot", "Avalanche", "Magnet Bomb", "Inferno", "Double Team", "Acrobatics",
  "Flare Blitz", "Aqua Tail", "Poltergeist",
];
const { moves: currentMoves } = JSON.parse(await readFile(new URL('../tests/fixtures/official-game-moves.json', import.meta.url), 'utf8'));
const gameMoveNames = [...new Set([...previousMoveNames, ...currentMoves.map((move) => move.name[1])])];

const base = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
async function names(filename) {
  const response = await fetch(base + filename, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
  const lines = (await response.text()).trim().split(/\r?\n/).slice(1);
  const records = new Map();
  for (const line of lines) {
    const values = [...line.matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^",]*))/g)]
      .map((match) => match[1] === undefined ? match[2] : match[1].replaceAll('""', '"'));
    const [id, language, name] = values;
    if (!records.has(id)) records.set(id, {});
    records.get(id)[language] = name;
  }
  return [...records.values()];
}

const [species, moves, types, items, regions, abilities] = await Promise.all([
  names('pokemon_species_names.csv'), names('move_names.csv'), names('type_names.csv'),
  names('item_names.csv'), names('region_names.csv'), names('ability_names.csv'),
]);
const koreanByEnglish = (records) => new Map(records.filter((record) => record[3] && record[9]).map((record) => [record[9], record[3]]));
const normalize = (text) => text.replaceAll('’', "'").toLowerCase();
const speciesByAlias = new Map();
for (const record of species) {
  if (!record[3]) continue;
  for (const language of [7, 9]) if (record[language]) speciesByAlias.set(normalize(record[language]), record[3]);
}
for (const [alias, korean] of Object.entries(context.PSKO_POKEMON)) {
  assert.equal(korean, speciesByAlias.get(normalize(alias)), `포켓몬 이름: ${alias}`);
}
for (const [english, korean] of koreanByEnglish(species)) {
  assert.equal(context.PSKO_POKEMON[english], korean, `포켓몬 누락: ${english}`);
}
const moveNames = koreanByEnglish(moves);
for (const name of gameMoveNames) {
  // The game uses the ability Swarm as an evolved move.
  const expected = name === 'Swarm' ? koreanByEnglish(abilities).get(name) : moveNames.get(name);
  assert.ok(expected, `PokéAPI 기술명 없음: ${name}`);
  assert.equal(context.PSKO.translateMove(name), expected, `기술 이름: ${name}`);
}
for (const type of ['Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']) {
  assert.equal(context.PSKO.translate(type), koreanByEnglish(types).get(type), `타입 이름: ${type}`);
}
for (const region of ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea']) {
  assert.equal(context.PSKO.translate(region), koreanByEnglish(regions).get(region), `지방 이름: ${region}`);
}
let itemCount = 0;
const itemNames = koreanByEnglish(items);
for (const [, english, korean] of context.PSKO_MESSAGES) {
  // "Upgrade" is a UI action here, not the similarly named held item.
  if (!itemNames.has(english) || english === 'Upgrade') continue;
  assert.equal(korean, itemNames.get(english), `도구 이름: ${english}`);
  itemCount++;
}
console.log(`최신 PokéAPI 대조 통과: 포켓몬·별칭 ${Object.keys(context.PSKO_POKEMON).length}개, 게임 기술 ${gameMoveNames.length}개(특성명 1개 포함), 타입 18개, 지방 9개, 도구 ${itemCount}개.`);


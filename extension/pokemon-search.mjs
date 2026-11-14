import { disassemble, getChoseong } from './vendor/es-hangul.mjs';
import Fuse from './vendor/fuse.mjs';

export function createPokemonSearch(entries, namesFor) {
  const documents = entries.map(entry => {
    const names = namesFor(entry).filter(Boolean).map(name => name.normalize('NFC').toLowerCase());
    return {
      entry,
      values: [...names, String(entry.dex), String(entry.nationalDex || entry.dex).padStart(3, '0')],
      initials: names.map(name => getChoseong(name)),
      letters: names.map(disassemble),
    };
  });
  const fuzzy = new Fuse(documents, { keys: ['letters'], threshold: 0.25, ignoreLocation: true });

  return input => {
    const query = input.trim().normalize('NFC').toLowerCase();
    if (!query) return entries;
    const initialsOnly = /^[ㄱ-ㅎ]+$/.test(query);
    const matches = documents.filter(document => document.values.some(value => value.includes(query))
      || (initialsOnly && document.initials.some(value => value.includes(query))));
    if (matches.length || initialsOnly || /^\d+$/.test(query)) return matches.map(({ entry }) => entry);

    const fuzzyMatches = new Set(fuzzy.search(disassemble(query)).map(({ item }) => item.entry));
    return entries.filter(entry => fuzzyMatches.has(entry));
  };
}

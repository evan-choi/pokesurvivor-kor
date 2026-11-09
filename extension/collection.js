(() => {
  'use strict';

  // Reuse the module registry captured by effects.js; never expose the save or account.
  globalThis.PSKO_INSTALL_COLLECTION_READER = root => {
    const stores = Object.values(root).filter(module => module && typeof module === 'object'
      && typeof module.owns === 'function' && typeof module.upgradesOf === 'function' && 'save' in module);
    if (stores.length !== 1) return;
    const store = stores[0];
    globalThis.PSKO_READ_OWNED_POKEMON = () => {
      const save = store.save;
      if (save == null) return null;
      const owned = save.owned;
      if (!owned || typeof owned !== 'object' || Array.isArray(owned)) throw new Error('Invalid collection');
      return Object.keys(owned).filter(dex => owned[dex]);
    };
  };
})();

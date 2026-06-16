import { store } from './store.js';

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function safe(user) {
  if (!user) return null;
  const { password: _, ...rest } = user;
  return rest;
}

export const auth = {
  signup(username, displayName, password) {
    username    = (username    || '').trim();
    displayName = (displayName || '').trim();
    password    = (password    || '');

    if (!username || !displayName || !password) throw new Error('Alle velden zijn verplicht.');
    if (username.length < 3)  throw new Error('Gebruikersnaam moet minimaal 3 tekens zijn.');
    if (!/^[a-z0-9_.]+$/i.test(username)) throw new Error('Gebruikersnaam mag alleen letters, cijfers, . en _ bevatten.');
    if (password.length < 6)  throw new Error('Wachtwoord moet minimaal 6 tekens zijn.');
    if (store.getUserByUsername(username)) throw new Error('Deze gebruikersnaam is al bezet.');

    const user = {
      id: uid(),
      username: username.toLowerCase(),
      displayName,
      password,
      bio: '',
      avatar: `https://i.pravatar.cc/150?u=${username}`,
      joinedAt: Date.now(),
    };
    store.addUser(user);
    store.setCurrentUser(safe(user));
    return safe(user);
  },

  login(username, password) {
    const user = store.getUserByUsername((username||'').trim());
    if (!user || user.password !== password) throw new Error('Gebruikersnaam of wachtwoord onjuist.');
    store.setCurrentUser(safe(user));
    return safe(user);
  },

  logout() { store.clearCurrentUser(); },

  getCurrentUser() { return store.getCurrentUser(); },

  updateProfile(patch) {
    const cur = store.getCurrentUser();
    if (!cur) throw new Error('Niet ingelogd.');
    const updated = store.updateUser(cur.id, patch);
    store.setCurrentUser(safe(updated));
    return safe(updated);
  },
};

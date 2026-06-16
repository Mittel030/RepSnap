import { api, setToken } from './api.js';

export const auth = {
    _user: null,

    async init() {
        if (!localStorage.getItem('rs_token')) return null;
        try { this._user = await api.me(); return this._user; }
        catch { setToken(null); this._user = null; return null; }
    },

    async signup(username, displayName, password) {
        const { token, user } = await api.signup(username, displayName, password);
        setToken(token);
        this._user = user;
        return user;
    },

    async login(username, password) {
        const { token, user } = await api.login(username, password);
        setToken(token);
        this._user = user;
        return user;
    },

    async logout() {
        try { await api.logout(); } catch {}
        setToken(null);
        this._user = null;
    },

    getCurrentUser() { return this._user; },

    async updateProfile(patch) {
        this._user = await api.updateProfile(patch);
        return this._user;
    },
};

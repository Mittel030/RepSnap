const routes = {};

export const router = {
  register(route, fn) { routes[route] = fn; },

  navigate(route, params = {}) {
    const hash = params && Object.keys(params).length
      ? route + '?' + new URLSearchParams(params).toString()
      : route;
    window.location.hash = hash;
  },

  getParams() {
    const raw = window.location.hash.slice(1);
    const [, qs] = raw.split('?');
    return qs ? Object.fromEntries(new URLSearchParams(qs)) : {};
  },

  getRoute() {
    return (window.location.hash.slice(1).split('?')[0]) || 'feed';
  },

  init() {
    window.addEventListener('hashchange', () => this._handle());
    this._handle();
  },

  _handle() {
    const route = this.getRoute();
    if (routes[route]) routes[route]();
    else if (routes['feed']) routes['feed']();
  },
};

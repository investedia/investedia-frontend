// Connections come from public configuration, never former account endpoints.
var cfg = window.INV_CONFIG || {};
window.INV_LIVE_URL = cfg.apiBaseUrl ? cfg.apiBaseUrl.replace(/\/$/, '') + '/ticker' : '';
window.INV_DATA_MODE = cfg.dataMode || 'static';

import { createModules } from './core/modules';
import { initBrowserRuntime } from './platform/browser-runtime';

window.LumaRadioModules = createModules();
initBrowserRuntime();
window.dispatchEvent(new CustomEvent('lumaradio:ready'));

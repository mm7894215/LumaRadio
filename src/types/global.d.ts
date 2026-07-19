import type { LumaRadioModules } from '../core/modules';

declare global {
  interface Window {
    LumaRadioModules: LumaRadioModules;
    desktopWindow?: { isDesktop?: boolean };
  }
}

export {};

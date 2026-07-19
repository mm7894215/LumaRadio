import { ApiClient } from './api-client';
import * as storage from './storage';
import * as search from '../features/search/search-domain';
import * as queue from '../features/queue/queue-model';
import * as auth from '../features/auth/auth-state';
import * as lyrics from '../engines/lyrics/lrc-parser';
import * as spectrum from '../engines/audio/spectrum';
import * as scene from '../engines/scene/render-quality';
import * as particles from '../engines/particles/presets';

export function createModules() {
  return {
    api: new ApiClient(),
    storage,
    search,
    queue,
    auth,
    engines: { lyrics, spectrum, scene, particles },
  };
}

export type LumaRadioModules = ReturnType<typeof createModules>;

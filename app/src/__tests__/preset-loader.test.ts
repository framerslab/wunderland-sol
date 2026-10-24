/**
 * PresetLoader against the presets shipped in presets/agents.
 *
 * `wunderland init --preset <id>` writes the loaded preset's
 * suggestedExtensions into agent.config.json as `extensions`, and
 * `wunderland chat` loads exactly that list when it is present.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { PresetLoader } from '../../../src/core/PresetLoader';

const PRESETS_DIR = path.resolve(__dirname, '..', '..', '..', 'presets');

function presetConfig(id: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(PRESETS_DIR, 'agents', id, 'agent.config.json'), 'utf8'));
}

describe('PresetLoader with the shipped presets', () => {
  const loader = new PresetLoader(PRESETS_DIR);

  it.each(['devops-assistant', 'data-analyst'])(
    '%s keeps the extensions and tool access profile its config names',
    (id) => {
      const preset = loader.loadPreset(id);
      const config = presetConfig(id);
      expect(config.suggestedExtensions).toBeDefined();
      expect(preset.suggestedExtensions).toEqual(config.suggestedExtensions);
      expect(preset.toolAccessProfile).toBe(config.toolAccessProfile);
    },
  );

  it('gives devops-assistant the shell executor and the browser', () => {
    expect(loader.loadPreset('devops-assistant').suggestedExtensions?.tools).toEqual([
      'cli-executor',
      'web-browser',
    ]);
  });

  it('leaves extensions unset for a preset that names none, so chat keeps its default set', () => {
    expect(presetConfig('research-assistant').suggestedExtensions).toBeUndefined();
    expect(loader.loadPreset('research-assistant').suggestedExtensions).toBeUndefined();
  });

  it('returns the same fields from listPresets', () => {
    const devops = loader.listPresets().find((preset) => preset.id === 'devops-assistant');
    expect(devops?.suggestedExtensions).toEqual(presetConfig('devops-assistant').suggestedExtensions);
  });
});

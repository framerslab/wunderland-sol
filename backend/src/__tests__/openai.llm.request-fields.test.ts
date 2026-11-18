import { describe, expect, it, vi } from 'vitest';
import { OpenAiLlmService } from '../core/llm/openai.llm.service.js';

/** The request the service sends OpenAI for one call on `model`. */
async function requestFor(model: string): Promise<Record<string, unknown>> {
  const service = new OpenAiLlmService({ providerId: 'openai', apiKey: 'test-key' });
  const create = vi.fn().mockResolvedValue({
    id: 'r1',
    model,
    choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
  });
  (service as unknown as { openai: unknown }).openai = { chat: { completions: { create } } };
  await service.generateChatCompletion([{ role: 'user', content: 'hi' }], model, {
    temperature: 0.5,
    max_tokens: 100,
    top_p: 0.9,
    stop: ['END'],
  });
  return create.mock.calls[0][0] as Record<string, unknown>;
}

describe('OpenAiLlmService request fields', () => {
  it('runs gpt-6-luna at reasoning effort none, keeping temperature and top_p', async () => {
    const body = await requestFor('gpt-6-luna');
    expect(body).toMatchObject({ reasoning_effort: 'none', temperature: 0.5, top_p: 0.9, max_completion_tokens: 100 });
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('stop');
  });

  it('sends gpt-6.2-sol no temperature, top_p or stop', async () => {
    const body = await requestFor('gpt-6.2-sol');
    expect(body).toMatchObject({ max_completion_tokens: 100 });
    for (const field of ['temperature', 'top_p', 'stop', 'max_tokens', 'reasoning_effort']) {
      expect(body).not.toHaveProperty(field);
    }
  });

  it('sends a chat model the fields it sent before', async () => {
    const body = await requestFor('gpt-4o');
    expect(body).toMatchObject({ temperature: 0.5, top_p: 0.9, stop: ['END'], max_tokens: 100 });
  });
});

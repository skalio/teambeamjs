import * as inquirer from 'inquirer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getOrPromptEditor,
  getOrPromptInput,
  getOrPromptSecret,
  getOrPromptTtl
} from '../../src/utils/input.js';

vi.mock('inquirer', async () => {
  return {
    default: {
      prompt: vi.fn(),
    },
  };
});

const mockedPrompt = (inquirer.default.prompt as unknown as ReturnType<typeof vi.fn>);

beforeEach(() => {
  mockedPrompt.mockReset();
});

describe('getOrPromptInput', () => {
  it('returns flagValue when valid', async () => {
    const result = await getOrPromptInput({
      key: 'foo',
      message: 'Enter foo',
      flagValue: 'bar',
    });
    expect(result).toBe('bar');
  });

  it('throws when validation fails for flagValue', async () => {
    await expect(
      getOrPromptInput({
        key: 'foo',
        message: 'Enter foo',
        flagValue: 'invalid',
        validate: (v) => (v === 'ok' ? true : 'bad input'),
      })
    ).rejects.toThrow(Error);
  });

  it('prompts when flagValue is not given', async () => {
    mockedPrompt.mockResolvedValueOnce({ value: 'user-input' });
    const result = await getOrPromptInput({
      key: 'foo',
      message: 'Enter foo',
    });
    expect(result).toBe('user-input');
  });
});

describe('getOrPromptSecret', () => {
  it('returns flagValue when provided', async () => {
    const result = await getOrPromptSecret({
      key: 'secret',
      message: 'Enter secret',
      flagValue: 'the-earth-is-flat',
    });
    expect(result).toBe('the-earth-is-flat');
  });

  it('returns default if user does not overwrite', async () => {
    mockedPrompt.mockResolvedValueOnce({ overwrite: false });
    const result = await getOrPromptSecret({
      key: 'secret',
      message: 'Enter secret',
      defaultValue: 'thecake-is-a-lie',
    });
    expect(result).toBe('thecake-is-a-lie');
  });

  it('prompts for secret if user overwrites', async () => {
    mockedPrompt
      .mockResolvedValueOnce({ overwrite: true })
      .mockResolvedValueOnce({ value: 'george-bush-did-9/11' });

    const result = await getOrPromptSecret({
      key: 'secret',
      message: 'Enter secret',
      defaultValue: 'old-secret',
    });
    expect(result).toBe('george-bush-did-9/11');
  });
});

describe('getOrPromptEditor', () => {
  it('returns flagValue when provided', async () => {
    const result = await getOrPromptEditor({
      key: 'editor',
      message: 'Enter',
      flagValue: 'edited',
    });
    expect(result).toBe('edited');
  });

  it('prompts editor when no flagValue', async () => {
    mockedPrompt.mockResolvedValueOnce({ value: 'written in editor' });
    const result = await getOrPromptEditor({
      key: 'editor',
      message: 'Enter',
    });
    expect(result).toBe('written in editor');
  });
});

describe('getOrPromptTtl', () => {
  it('returns flagValue if valid', async () => {
    const result = await getOrPromptTtl({
      flagValue: 3,
      defaultValue: 2,
      values: [1, 2, 3],
    });
    expect(result).toBe(3);
  });

  it('throws error if flagValue is invalid', async () => {
    await expect(
      getOrPromptTtl({
        flagValue: 99,
        defaultValue: 2,
        values: [1, 2, 3],
      })
    ).rejects.toThrow(Error);
  });

  it('prompts when no flagValue', async () => {
    mockedPrompt.mockResolvedValueOnce({ ttl: 2 });
    const result = await getOrPromptTtl({
      defaultValue: 1,
      values: [1, 2, 3],
    });
    expect(result).toBe(2);
  });
});
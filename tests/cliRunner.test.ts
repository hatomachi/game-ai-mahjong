import { describe, it, expect } from 'vitest';
import { getCommandFullPath } from '../server/cliRunner';

describe('cliRunner check', () => {
  it('getCommandFullPath finds agy if present', () => {
    const agy = getCommandFullPath('agy');
    console.log('Detected agy path:', agy);
    expect(agy).not.toBeNull();
  });
});

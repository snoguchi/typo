import { resolve } from 'path';
import { describe, expect, test } from '@jest/globals';
import { compareFile } from '../src/compareFile';

const testCompareFiles = async (name: string, bufferSize: number) => {
  const orig = resolve(__dirname, `files/${name}.dat`);
  const copy = resolve(__dirname, `files/${name}_copy.dat`);
  const modify = resolve(__dirname, `files/${name}_modify.dat`);
  const truncate = resolve(__dirname, `files/${name}_truncate.dat`);

  await expect(compareFile(orig, orig, bufferSize)).resolves.toBe(true);
  await expect(compareFile(orig, copy, bufferSize)).resolves.toBe(true);
  await expect(compareFile(orig, modify, bufferSize)).resolves.toBe(false);
  await expect(compareFile(orig, truncate, bufferSize)).resolves.toBe(false);
};

describe('compareFiles', () => {
  test('1KB', async () => testCompareFiles('1kb', 99));
  test('128KB', async () => testCompareFiles('128kb', 8192));
});

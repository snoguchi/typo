import { resolve } from 'path';
import { describe, expect, test } from '@jest/globals';
import { FileTime } from '../src/FileTime';

describe('FileTime', () => {
  test('fromExif', async () => {
    const filepath = resolve(__dirname, 'exif-samples/jpg/Sony_HDR-HC3.jpg');
    const ft = await FileTime.fromExif(filepath);
    expect(ft).toEqual({
      filepath,
      year: 2007,
      month: 6,
      date: 15,
      hours: 4,
      minutes: 42,
      seconds: 32,
      from: 'exif',
    });
  });
});

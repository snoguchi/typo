import * as fs from 'node:fs/promises';
import { basename } from 'node:path';
const ExifParser = require('exif-parser');
import MediaInfoFactory from 'mediainfo.js';

export type FileTime = {
  filepath: string;
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  seconds: number;
  from: 'exif' | 'filename' | 'mediainfo' | 'stat';
};

const TIMEZONE_OFFSET = new Date().getTimezoneOffset() * 60_000;

const dateToFileTime = (d: Date): Omit<FileTime, 'filepath' | 'from'> => {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    date: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
  };
};

const fromExif = async (filepath: string): Promise<FileTime | null> => {
  const fh = await fs.open(filepath);
  try {
    const buffer = Buffer.alloc(65635);
    await fh.read(buffer, 0, buffer.length);
    const { tags } = ExifParser.create(buffer).parse();

    if (!tags.DateTimeOriginal) {
      return null;
    }

    return { filepath, ...dateToFileTime(new Date(tags.DateTimeOriginal * 1000 + TIMEZONE_OFFSET)), from: 'exif' };
  } catch (e) {
    return null;
  } finally {
    await fh.close();
  }
};

const fromFilename = (filepath: string): FileTime | null => {
  const filename = basename(filepath);

  const m = filename.match(/(\d\d\d\d)\D?(\d\d)\D?(\d\d)\D?(\d\d)\D?(\d\d)\D?(\d\d)/);
  if (!m) {
    return null;
  }

  const [, year, month, date, hours, minutes, seconds] = m.map(Number);
  if (year < 1970 || month < 1 || month > 12 || date < 1 || date > 31 || hours > 24 || minutes > 60 || seconds > 60) {
    return null;
  }

  return {
    filepath,
    year,
    month,
    date,
    hours,
    minutes,
    seconds,
    from: 'filename',
  };
};

const fromMediainfo = async (filepath: string): Promise<FileTime | null> => {
  const mediainfo = await MediaInfoFactory();
  try {
    const fh = await fs.open(filepath);
    const { size } = await fh.stat();
    try {
      const info = await mediainfo.analyzeData(
        () => size,
        async (size, offset) => {
          const buffer = new Uint8Array(size);
          await fh.read(buffer, 0, size, offset);
          return buffer;
        }
      );
      if (info.media?.track) {
        for (const { Encoded_Date } of info.media?.track) {
          if (Encoded_Date) {
            return { filepath, ...dateToFileTime(new Date(Encoded_Date)), from: 'mediainfo' };
          }
        }
      }
    } finally {
      await fh.close();
    }
  } finally {
    mediainfo.close();
  }
  return null;
};

const fromStat = async (filepath: string): Promise<FileTime | null> => {
  const { birthtimeMs, mtimeMs, ctimeMs } = await fs.stat(filepath);
  const createdAt = Math.min(birthtimeMs, mtimeMs, ctimeMs);

  if (createdAt === 0) {
    return null;
  }

  return {
    filepath,
    ...dateToFileTime(new Date(createdAt)),
    from: 'stat',
  };
};

const format = (ft: FileTime, format: string): string => {
  return format.replace(/{(.*?)}/g, (_, key) => {
    switch (key) {
      case 'filename':
        return basename(ft.filepath);
      case 'year':
        return String(ft.year);
      case 'month':
        return ('0' + ft.month).slice(-2);
      case 'date':
        return ('0' + ft.date).slice(-2);
      case 'hours':
        return ('0' + ft.hours).slice(-2);
      case 'minutes':
        return ('0' + ft.minutes).slice(-2);
      case 'seconds':
        return ('0' + ft.seconds).slice(-2);
      default:
        throw new Error(`Invalid format: ${format}`);
    }
  });
};

export const FileTime = {
  fromExif,
  fromFilename,
  fromMediainfo,
  fromStat,
  format,
};

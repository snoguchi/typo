#! /usr/bin/env node

import fs from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { glob, hasMagic } from 'glob';
import minimist from 'minimist';
import { File } from './File';
import { FileTime } from './FileTime';

const EXIF_EXTENSION = new Set(['.jpg', '.jpeg', '.jpe', '.tiff', '.tif']);

const MEDIAINFO_EXTENSION = new Set(['.mov', '.mp4', '.3gp']);

const findFile = async (files: string[]) => {
  const patternPromises = files.map(async (file) => {
    if (!hasMagic(file) && (await fs.lstat(file)).isDirectory()) {
      return `${file}/**/*`;
    } else {
      return file;
    }
  });
  return glob(await Promise.all(patternPromises), { nodir: true });
};

const moveFile = async (filepath: string, newFilepathTemplate: string, dryrun: boolean) => {
  const ext = extname(filepath).toLowerCase();

  let ft;
  if (EXIF_EXTENSION.has(ext)) {
    ft = await FileTime.fromExif(filepath);
  } else if (MEDIAINFO_EXTENSION.has(ext)) {
    ft = await FileTime.fromMediainfo(filepath);
  } else {
    ft = FileTime.fromFilename(filepath);
  }

  if (ft === null) {
    throw new Error(`Failed to identify date of ${filepath}`);
  }

  const newFilepath = FileTime.format(ft, newFilepathTemplate);
  if (resolve(filepath) === resolve(newFilepath)) {
    return;
  }

  if (dryrun) {
    console.log(`(dryrun) ${filepath} => ${newFilepath} (${ft.from})`);
  } else {
    console.log(`${filepath} => ${newFilepath} (${ft.from})`);
  }

  if (await File.exists(newFilepath)) {
    if (!(await File.identical(filepath, newFilepath))) {
      throw new Error(`${newFilepath} already exists and NOT identical`);
    }

    console.warn(`WARN: ${newFilepath} already exists and identical, deleting ${filepath}`);
    if (!dryrun) {
      await fs.unlink(filepath);
    }
    return;
  }

  if (!dryrun) {
    await File.move(filepath, newFilepath);
  }
};

type CliOptions = {
  files: string[];
  outDir: string;
  dryrun: boolean;
};

const parseCliOptions = (args: string[]): CliOptions => {
  const {
    _: files,
    outDir,
    dryrun,
  } = minimist(args, {
    boolean: ['dryrun'],
    default: {
      outDir: '{year}/{year}-{month}-{date}/',
      dryrun: false,
    },
    alias: {
      outDir: ['o'],
      dryrun: ['dry-run'],
    },
  });

  return { files, outDir, dryrun };
};

const main = async () => {
  const options = parseCliOptions(process.argv.slice(2));
  const newFilepathTemplate = join(options.outDir, '{filename}');
  const files = await findFile(options.files);
  for (const filepath of files.sort()) {
    await moveFile(filepath, newFilepathTemplate, options.dryrun);
  }
};

main();

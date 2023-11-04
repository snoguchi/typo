#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = require("node:path");
const glob_1 = require("glob");
const minimist_1 = __importDefault(require("minimist"));
const File_1 = require("./File");
const FileTime_1 = require("./FileTime");
const EXIF_EXTENSION = new Set(['.jpg', '.jpeg', '.jpe', '.tiff', '.tif']);
const MEDIAINFO_EXTENSION = new Set(['.mov', '.mp4', '.3gp']);
const findFile = async (files) => {
    const patternPromises = files.map(async (file) => {
        if (!(0, glob_1.hasMagic)(file) && (await promises_1.default.lstat(file)).isDirectory()) {
            return `${file}/**/*`;
        }
        else {
            return file;
        }
    });
    return (0, glob_1.glob)(await Promise.all(patternPromises), { nodir: true });
};
const moveFile = async (filepath, newFilepathTemplate, dryrun) => {
    const ext = (0, node_path_1.extname)(filepath).toLowerCase();
    let ft;
    if (EXIF_EXTENSION.has(ext)) {
        ft = await FileTime_1.FileTime.fromExif(filepath);
    }
    else if (MEDIAINFO_EXTENSION.has(ext)) {
        ft = await FileTime_1.FileTime.fromMediainfo(filepath);
    }
    else {
        ft = FileTime_1.FileTime.fromFilename(filepath);
    }
    if (ft === null) {
        throw new Error(`Failed to identify date of ${filepath}`);
    }
    const newFilepath = FileTime_1.FileTime.format(ft, newFilepathTemplate);
    if ((0, node_path_1.resolve)(filepath) === (0, node_path_1.resolve)(newFilepath)) {
        return;
    }
    if (dryrun) {
        console.log(`(dryrun) ${filepath} => ${newFilepath} (${ft.from})`);
    }
    else {
        console.log(`${filepath} => ${newFilepath} (${ft.from})`);
    }
    if (await File_1.File.exists(newFilepath)) {
        if (!(await File_1.File.identical(filepath, newFilepath))) {
            throw new Error(`${newFilepath} already exists and NOT identical`);
        }
        console.warn(`WARN: ${newFilepath} already exists and identical, deleting ${filepath}`);
        if (!dryrun) {
            await promises_1.default.unlink(filepath);
        }
        return;
    }
    if (!dryrun) {
        await File_1.File.move(filepath, newFilepath);
    }
};
const parseCliOptions = (args) => {
    const { _: files, outDir, dryrun, } = (0, minimist_1.default)(args, {
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
    const newFilepathTemplate = (0, node_path_1.join)(options.outDir, '{filename}');
    const files = await findFile(options.files);
    for (const filepath of files.sort()) {
        await moveFile(filepath, newFilepathTemplate, options.dryrun);
    }
};
main();

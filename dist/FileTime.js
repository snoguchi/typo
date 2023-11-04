"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTime = void 0;
const fs = __importStar(require("node:fs/promises"));
const node_path_1 = require("node:path");
const ExifParser = require('exif-parser');
const mediainfo_js_1 = __importDefault(require("mediainfo.js"));
const TIMEZONE_OFFSET = new Date().getTimezoneOffset() * 60_000;
const dateToFileTime = (d) => {
    return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        date: d.getDate(),
        hours: d.getHours(),
        minutes: d.getMinutes(),
        seconds: d.getSeconds(),
    };
};
const fromExif = async (filepath) => {
    const fh = await fs.open(filepath);
    try {
        const buffer = Buffer.alloc(65635);
        await fh.read(buffer, 0, buffer.length);
        const { tags } = ExifParser.create(buffer).parse();
        if (!tags.DateTimeOriginal) {
            return null;
        }
        return { filepath, ...dateToFileTime(new Date(tags.DateTimeOriginal * 1000 + TIMEZONE_OFFSET)), from: 'exif' };
    }
    catch (e) {
        return null;
    }
    finally {
        await fh.close();
    }
};
const fromFilename = (filepath) => {
    const filename = (0, node_path_1.basename)(filepath);
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
const fromMediainfo = async (filepath) => {
    const mediainfo = await (0, mediainfo_js_1.default)();
    try {
        const fh = await fs.open(filepath);
        const { size } = await fh.stat();
        try {
            const info = await mediainfo.analyzeData(() => size, async (size, offset) => {
                const buffer = new Uint8Array(size);
                await fh.read(buffer, 0, size, offset);
                return buffer;
            });
            if (info.media?.track) {
                for (const { Encoded_Date } of info.media?.track) {
                    if (Encoded_Date) {
                        return { filepath, ...dateToFileTime(new Date(Encoded_Date)), from: 'mediainfo' };
                    }
                }
            }
        }
        finally {
            await fh.close();
        }
    }
    finally {
        mediainfo.close();
    }
    return null;
};
const fromStat = async (filepath) => {
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
const format = (ft, format) => {
    return format.replace(/{(.*?)}/g, (_, key) => {
        switch (key) {
            case 'filename':
                return (0, node_path_1.basename)(ft.filepath);
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
exports.FileTime = {
    fromExif,
    fromFilename,
    fromMediainfo,
    fromStat,
    format,
};

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const fs = __importStar(require("node:fs/promises"));
const node_path_1 = require("node:path");
const exists = async (filepath) => {
    try {
        await fs.access(filepath);
        return true;
    }
    catch (_e) {
        return false;
    }
};
const move = async (oldFilepath, newFilepath) => {
    try {
        await fs.mkdir((0, node_path_1.dirname)(newFilepath), { recursive: true });
        await fs.rename(oldFilepath, newFilepath);
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'EXDEV') {
            const stat = await fs.stat(oldFilepath);
            await fs.copyFile(oldFilepath, newFilepath);
            await fs.utimes(newFilepath, stat.atime, stat.mtime);
            await fs.unlink(oldFilepath);
        }
        else {
            throw error;
        }
    }
};
const identical = async (filepath1, filepath2, bufferSize = 64 * 1024) => {
    const [stat1, stat2] = await Promise.all([fs.stat(filepath1), fs.stat(filepath2)]);
    if (stat1.size !== stat2.size) {
        return false;
    }
    const buffer1 = Buffer.alloc(bufferSize);
    const buffer2 = Buffer.alloc(bufferSize);
    const [fh1, fh2] = await Promise.all([fs.open(filepath1), fs.open(filepath2)]);
    try {
        for (;;) {
            const [res1, res2] = await Promise.all([fh1.read(buffer1, 0, bufferSize), fh2.read(buffer2, 0, bufferSize)]);
            if (res1.bytesRead !== res2.bytesRead || Buffer.compare(res1.buffer, res2.buffer) !== 0) {
                return false;
            }
            if (res1.bytesRead === null || res1.bytesRead < bufferSize) {
                return true;
            }
        }
    }
    finally {
        await Promise.all([fh1.close(), fh2.close()]);
    }
};
exports.File = {
    exists,
    move,
    identical,
};

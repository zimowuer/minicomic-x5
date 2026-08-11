import fs from '../x5-fs';
import { convert as convertWebp, isWebp as nativeIsWebp } from 'webp';

export function isWebpUrl(url) {
    return /\.webp(?:$|[?#])/i.test(String(url || ''));
}

export function isWebpFile(path) {
    return nativeIsWebp(path);
}

export async function convertWebpFile(inputPath, outputPath, segments = 0) {
    if (await fs.exists(outputPath)) return outputPath;
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            if (attempt) await new Promise(resolve => setTimeout(resolve, attempt * 80));
            else await new Promise(resolve => setTimeout(resolve, 30));
            convertWebp(inputPath, outputPath, 1020, 86, segments);
            const stat = await fs.stat(outputPath);
            if (!stat || !stat.size) throw new Error('converter produced an empty JPEG');
            if (inputPath !== outputPath && await fs.exists(inputPath)) await fs.rm(inputPath);
            await new Promise(resolve => setTimeout(resolve, 0));
            return outputPath;
        } catch (error) {
            lastError = error;
            if (await fs.exists(outputPath)) await fs.rm(outputPath);
        }
    }
    throw new Error(`WebP conversion failed after 3 attempts: ${lastError && lastError.message ? lastError.message : lastError}`);
}

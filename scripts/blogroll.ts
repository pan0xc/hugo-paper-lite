import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Parser from 'rss-parser';

interface Feed {
    title: string;
    url: string;
    date: Date;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const paperLiteDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(paperLiteDir, '../..');

const paths = [
    path.join(paperLiteDir, 'blogroll.txt'),
    path.join(repoDir, 'blogroll.txt'),
];

const outputPath = path.join(paperLiteDir, 'data/blogroll.json');

const parser = new Parser();

async function getBlogrollPath(): Promise<string> {
    for (const path of paths) {
        const exists = await fs.promises
            .access(path, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false);
        if (exists) return path;
    }
    throw new Error('Blogroll file not found');
}

async function feed(url: string): Promise<Feed[]> {
    const result = await parser.parseURL(url);

    return result.items
        .map(item => ({
            title: item.title || '',
            url: item.link || '',
            date: new Date(item.pubDate || ''),
        }))
        .slice(0, 5)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function main() {
    const path = await getBlogrollPath();

    const urls = (await fs.promises.readFile(path, 'utf-8'))
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    const feeds = (await Promise.all(urls.map(feed)))
        .flat()
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    await fs.promises.writeFile(
        outputPath,
        JSON.stringify(feeds, null, 2),
        'utf-8',
    );
}

main();

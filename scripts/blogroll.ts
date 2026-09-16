import fs from 'node:fs';

import Parser from 'rss-parser';

interface Feed {
    title: string;
    url: string;
    date: Date;
}

const paths = ['../blogroll.txt', '../../blogroll.txt'];

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
    const feeds: Feed[] = await parser.parseURL(url).then(feed => {
        return feed.items.map(item => ({
            title: item.title || '',
            url: item.link || '',
            date: new Date(item.pubDate || '')
        }));
    });

    if (feeds.length === 0) {
        return [];
    }

    return feeds.slice(0, 5).sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function main() {
    const path = await getBlogrollPath();
    const urls = await fs.promises.readFile(path, 'utf-8').then(data => data.split('\n').filter(line => line.trim() !== ''));
    const feeds: Feed[] = (await Promise.all(urls.map(url => feed(url)))).flat().sort((a, b) => b.date.getTime() - a.date.getTime());
    fs.promises.writeFile('data/blogroll.json', JSON.stringify(feeds, null, 2), 'utf-8');
}

main()

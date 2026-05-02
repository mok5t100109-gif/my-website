import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const POSTS_FILE = join(DATA_DIR, 'posts.json');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

function ensureDir() {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file, defaultVal) {
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch {
        return defaultVal;
    }
}

function writeJSON(file, data) {
    ensureDir();
    writeFileSync(file, JSON.stringify(data, null, 2));
}

export function getPosts() {
    return readJSON(POSTS_FILE, []);
}

export function savePosts(posts) {
    writeJSON(POSTS_FILE, posts);
}

export function getConfig() {
    return readJSON(CONFIG_FILE, {});
}

export function saveConfig(config) {
    writeJSON(CONFIG_FILE, config);
}

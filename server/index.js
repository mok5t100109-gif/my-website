import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { randomUUID } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
    getOAuthURL, exchangeCode, getLongLivedToken,
    getPages, getPageToken, getInstagramAccount,
    createMediaContainer, getContainerStatus, publishMedia
} from './instagram.js';
import { generateCaption } from './ai.js';
import { getPosts, savePosts, getConfig, saveConfig } from './store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '..')));

// ── Auth ──────────────────────────────────────────────────────────────────────

app.get('/auth/instagram/start', (req, res) => {
    const { INSTAGRAM_APP_ID, INSTAGRAM_REDIRECT_URI } = process.env;
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_REDIRECT_URI) {
        return res.redirect('/admin.html?error=' + encodeURIComponent('INSTAGRAM_APP_ID または INSTAGRAM_REDIRECT_URI が未設定です'));
    }
    res.redirect(getOAuthURL(INSTAGRAM_APP_ID, INSTAGRAM_REDIRECT_URI));
});

app.get('/auth/instagram/callback', async (req, res) => {
    const { code, error: oauthError } = req.query;
    if (oauthError) return res.redirect('/admin.html?error=' + encodeURIComponent(oauthError));
    if (!code) return res.redirect('/admin.html?error=No+code+returned');

    try {
        const { INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI } = process.env;

        const shortToken = await exchangeCode(code, INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI);
        const longToken = await getLongLivedToken(shortToken.access_token, INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET);

        const pages = await getPages(longToken.access_token);
        if (!pages.data?.length) throw new Error('Facebookページが見つかりません。ビジネスアカウントを確認してください。');

        const page = pages.data[0];
        const pageToken = await getPageToken(page.id, longToken.access_token);
        const igData = await getInstagramAccount(page.id, pageToken);

        if (!igData.instagram_business_account) {
            throw new Error('このFacebookページにInstagramビジネスアカウントが接続されていません。');
        }

        saveConfig({
            ...getConfig(),
            accessToken: pageToken,
            igUserId: igData.instagram_business_account.id,
            pageName: page.name,
            connectedAt: new Date().toISOString()
        });

        res.redirect('/admin.html?connected=1');
    } catch (err) {
        res.redirect('/admin.html?error=' + encodeURIComponent(err.message));
    }
});

// ── API: Status ───────────────────────────────────────────────────────────────

app.get('/api/status', (req, res) => {
    const cfg = getConfig();
    res.json({
        connected: !!(cfg.igUserId && cfg.accessToken),
        pageName: cfg.pageName || null,
        connectedAt: cfg.connectedAt || null
    });
});

// ── API: Caption generation ───────────────────────────────────────────────────

app.post('/api/caption', async (req, res) => {
    const { description } = req.body;
    if (!description?.trim()) return res.status(400).json({ error: 'description が必要です' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY が未設定です' });

    try {
        const caption = await generateCaption(description, apiKey);
        res.json({ caption });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── API: Posts ────────────────────────────────────────────────────────────────

app.get('/api/posts', (req, res) => {
    const posts = getPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(posts);
});

app.post('/api/posts', async (req, res) => {
    const { imageUrl, caption, scheduledAt } = req.body;
    if (!imageUrl?.trim() || !caption?.trim()) {
        return res.status(400).json({ error: 'imageUrl と caption が必要です' });
    }

    const cfg = getConfig();
    if (!cfg.igUserId) return res.status(400).json({ error: 'Instagramが接続されていません' });

    const post = {
        id: randomUUID(),
        imageUrl: imageUrl.trim(),
        caption: caption.trim(),
        scheduledAt: scheduledAt || null,
        status: scheduledAt ? 'scheduled' : 'pending',
        createdAt: new Date().toISOString(),
        publishedAt: null,
        igMediaId: null,
        error: null
    };

    const posts = getPosts();
    posts.push(post);
    savePosts(posts);

    res.json(post);

    if (!scheduledAt) {
        publishPost(post.id).catch(err => console.error(`Publish failed [${post.id}]:`, err.message));
    }
});

app.delete('/api/posts/:id', (req, res) => {
    const posts = getPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '投稿が見つかりません' });
    if (posts[idx].status === 'published') return res.status(400).json({ error: '公開済みの投稿は削除できません' });
    posts.splice(idx, 1);
    savePosts(posts);
    res.json({ ok: true });
});

// ── Publish helper ────────────────────────────────────────────────────────────

async function publishPost(postId) {
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const cfg = getConfig();
    post.status = 'processing';
    savePosts(posts);

    try {
        const container = await createMediaContainer(cfg.igUserId, post.imageUrl, post.caption, cfg.accessToken);

        // Poll until the container is ready (up to ~30 seconds)
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const { status_code } = await getContainerStatus(container.id, cfg.accessToken);
            if (status_code === 'FINISHED') break;
            if (status_code === 'ERROR') throw new Error('メディアコンテナの処理に失敗しました');
        }

        const result = await publishMedia(cfg.igUserId, container.id, cfg.accessToken);
        post.status = 'published';
        post.publishedAt = new Date().toISOString();
        post.igMediaId = result.id;
    } catch (err) {
        post.status = 'failed';
        post.error = err.message;
    }

    savePosts(posts);
}

// ── Scheduler (every minute) ──────────────────────────────────────────────────

cron.schedule('* * * * *', async () => {
    const now = new Date();
    const cfg = getConfig();
    if (!cfg.igUserId || !cfg.accessToken) return;

    const posts = getPosts();
    const due = posts.filter(p => p.status === 'scheduled' && new Date(p.scheduledAt) <= now);

    for (const post of due) {
        console.log(`Scheduler: publishing post ${post.id}`);
        await publishPost(post.id).catch(err => console.error(err.message));
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`Manas server: http://localhost:${PORT}`);
    console.log(`Admin panel:  http://localhost:${PORT}/admin.html`);
});

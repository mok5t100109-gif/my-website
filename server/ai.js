const SYSTEM_PROMPT = `あなたはヘアサロンのInstagram投稿専門アシスタント「マナス」です。
東京を拠点とする美容室のInstagram投稿キャプションを作成します。
以下の要件に従ってください：
- 自然でおしゃれな日本語のキャプション
- ブランドイメージ：シンプル・洗練・白と黒の世界観
- 絵文字は控えめに1〜2個
- 末尾に日本語・英語混在のハッシュタグを5〜8個
- 全体で150〜250文字程度`;

export async function generateCaption(description, apiKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: description }]
        })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Caption generation failed');
    return data.content[0].text;
}

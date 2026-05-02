const GRAPH = 'https://graph.facebook.com/v19.0';

export function getOAuthURL(appId, redirectUri) {
    const scope = [
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement'
    ].join(',');
    return (
        `https://www.facebook.com/v19.0/dialog/oauth` +
        `?client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scope}` +
        `&response_type=code`
    );
}

export async function exchangeCode(code, appId, appSecret, redirectUri) {
    const url =
        `${GRAPH}/oauth/access_token` +
        `?client_id=${appId}` +
        `&client_secret=${appSecret}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${code}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Token exchange failed');
    return data;
}

export async function getLongLivedToken(shortToken, appId, appSecret) {
    const url =
        `${GRAPH}/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${appId}` +
        `&client_secret=${appSecret}` +
        `&fb_exchange_token=${shortToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Long-lived token exchange failed');
    return data;
}

export async function getPages(accessToken) {
    const res = await fetch(`${GRAPH}/me/accounts?access_token=${accessToken}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Failed to get pages');
    return data;
}

export async function getPageToken(pageId, userToken) {
    const res = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${userToken}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Failed to get page token');
    return data.access_token;
}

export async function getInstagramAccount(pageId, pageToken) {
    const res = await fetch(
        `${GRAPH}/${pageId}?fields=instagram_business_account,name&access_token=${pageToken}`
    );
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Failed to get Instagram account');
    return data;
}

export async function createMediaContainer(igUserId, imageUrl, caption, accessToken) {
    const params = new URLSearchParams({ image_url: imageUrl, caption, access_token: accessToken });
    const res = await fetch(`${GRAPH}/${igUserId}/media`, { method: 'POST', body: params });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Failed to create media container');
    return data;
}

export async function getContainerStatus(containerId, accessToken) {
    const res = await fetch(
        `${GRAPH}/${containerId}?fields=status_code,status&access_token=${accessToken}`
    );
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Failed to get container status');
    return data;
}

export async function publishMedia(igUserId, containerId, accessToken) {
    const params = new URLSearchParams({ creation_id: containerId, access_token: accessToken });
    const res = await fetch(`${GRAPH}/${igUserId}/media_publish`, { method: 'POST', body: params });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Failed to publish media');
    return data;
}

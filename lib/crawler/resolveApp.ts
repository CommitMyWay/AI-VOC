import { getAppRegistry, upsertAppRegistry } from "../db/index.ts";
import type { ResolvedApp } from "./types.ts";

async function searchAppStore(name: string) {
  const endpoint = `https://itunes.apple.com/search?entity=software&country=vn&limit=1&term=${encodeURIComponent(name)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`App Store search failed with status ${response.status}`);
  }
  const body: any = await response.json();
  const app = Array.isArray(body?.results) ? body.results[0] : null;
  if (!app) {
    return { appStoreId: null, iconUrl: null };
  }
  return {
    appStoreId: typeof app.trackId === "number" ? String(app.trackId) : null,
    iconUrl: typeof app.artworkUrl512 === "string" ? app.artworkUrl512 : app.artworkUrl100 || null,
  };
}

async function searchPlayStore(name: string) {
  const endpoint = `https://play.google.com/store/search?c=apps&q=${encodeURIComponent(name)}`;
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) {
    throw new Error(`Play Store search failed with status ${response.status}`);
  }
  const html = await response.text();
  const match = html.match(/\/store\/apps\/details\?id=([A-Za-z0-9._-]+)/);
  return match?.[1] ?? null;
}

export async function resolveApp(name: string): Promise<ResolvedApp> {
  const cached = await getAppRegistry(name);

  let playId = cached?.play_id ?? null;
  let appStoreId = cached?.app_store_id ?? null;
  let iconUrl = cached?.icon_url ?? null;
  let source = cached ? "registry" : "search";

  if (!appStoreId || !iconUrl) {
    try {
      const result = await searchAppStore(name);
      appStoreId = appStoreId ?? result.appStoreId;
      iconUrl = iconUrl ?? result.iconUrl;
      source = "app_store_search";
    } catch {
      // Best effort only.
    }
  }

  if (!playId) {
    try {
      playId = await searchPlayStore(name);
      source = "play_store_search";
    } catch {
      // Best effort only.
    }
  }

  const resolved: ResolvedApp = {
    name,
    playId,
    appStoreId,
    iconUrl,
    verified: Boolean(playId || appStoreId),
  };

  await upsertAppRegistry({
    name,
    play_id: playId,
    app_store_id: appStoreId,
    category: null,
    icon_url: iconUrl,
    resolved_at: Math.floor(Date.now() / 1000),
    source,
  });

  return resolved;
}

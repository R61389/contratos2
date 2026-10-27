/** Reads the video id from the YouTube links people usually copy (watch, youtu.be, shorts, embed, music). */
export function parseYouTube(raw: string): { id: string; error?: undefined } | { id?: undefined; error: string } {
  const text = raw.trim();
  if (!text) return { error: "Pega el enlace del video" };
  if (/^[\w-]{11}$/.test(text)) return { id: text };
  if (/\s/.test(text) || !text.includes(".")) return { error: "No parece un enlace válido" };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { error: "No parece un enlace válido" };
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/);
      if (m) id = m[2];
    }
  } else return { error: "El enlace tiene que ser de YouTube" };
  if (!id || !/^[\w-]{11}$/.test(id)) return { error: "No encontramos el video en ese enlace" };
  return { id };
}

export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

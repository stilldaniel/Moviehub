import { OFFICIAL_CHANNELS, type LiveStream } from "@/lib/officialChannels";

// Live and upcoming (next 24h) streams from official channels only.
// Channel feeds are free RSS; one videos.list call per 50 videos costs 1 unit of the
// 10,000/day YouTube quota, so refreshing every 15 minutes uses well under 1,000 units a day.
export async function GET() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return Response.json({ streams: [], error: "YOUTUBE_API_KEY is not configured" }, { status: 500 });

  // 1. Latest videos per channel from its public RSS feed
  const feeds = await Promise.all(
    OFFICIAL_CHANNELS.map(async (channel) => {
      try {
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`, { next: { revalidate: 900 } });
        const xml = res.ok ? await res.text() : "";
        return [...xml.matchAll(/<yt:videoId>([\w-]{11})<\/yt:videoId>/g)].map((m) => ({ videoId: m[1], channel }));
      } catch {
        return [];
      }
    })
  );
  const candidates = feeds.flat();
  const channelFor = new Map(candidates.map((c) => [c.videoId, c.channel]));

  // 2. Ask YouTube which of those are live/upcoming and embeddable
  const streams: LiveStream[] = [];
  for (let i = 0; i < candidates.length; i += 50) {
    const ids = candidates.slice(i, i + 50).map((c) => c.videoId).join(",");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,status,contentDetails&id=${ids}&key=${key}`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const v of data.items ?? []) {
      const state = v.snippet?.liveBroadcastContent;
      if (state !== "live" && state !== "upcoming") continue;
      if (!v.status?.embeddable) continue;
      const scheduledStart: string | undefined = v.liveStreamingDetails?.scheduledStartTime;
      // Only show upcoming streams starting within a day
      if (state === "upcoming" && (!scheduledStart || Date.parse(scheduledStart) - Date.now() > 24 * 3600 * 1000)) continue;
      const channel = channelFor.get(v.id)!;
      streams.push({
        videoId: v.id,
        title: v.snippet.title,
        channel: channel.name,
        sport: channel.sport,
        state,
        scheduledStart,
        thumbnail: v.snippet.thumbnails?.high?.url ?? v.snippet.thumbnails?.medium?.url,
        allowedIn: v.contentDetails?.regionRestriction?.allowed,
        blockedIn: v.contentDetails?.regionRestriction?.blocked,
      });
    }
  }

  // Live first, then soonest upcoming
  streams.sort((a, b) =>
    a.state !== b.state ? (a.state === "live" ? -1 : 1) : Date.parse(a.scheduledStart ?? "0") - Date.parse(b.scheduledStart ?? "0")
  );

  return Response.json(
    { streams },
    { headers: { "cache-control": "public, max-age=120", "vercel-cdn-cache-control": "max-age=300, stale-while-revalidate=600" } }
  );
}

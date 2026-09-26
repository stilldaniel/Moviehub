// Official YouTube channels of leagues, federations and promoters that stream full events free.
// Only these channels are checked, so unauthorised restreams can't appear. Each ID was confirmed
// against the channel's handle, subscriber count and recent live streams. To add one, look up the
// channel ID via channels?forHandle=@handle and confirm it is the official account.
export const OFFICIAL_CHANNELS: { id: string; name: string; sport: string }[] = [
  { id: "UC9ckyA_A3MfXUa0ttxMoIZw", name: "World Table Tennis", sport: "Table Tennis" },
  { id: "UCtInrnU3QbWqFGsdKT1GZtg", name: "FIBA Basketball", sport: "Basketball" },
  { id: "UCQOt5-Mc5m03JCO_W9SWySA", name: "NBL", sport: "Basketball" },
  { id: "UCqn7r-so0mBLaJTtTms9dAQ", name: "Concacaf", sport: "Football" },
  { id: "UCyGa1YEx9ST66rYrJTGIKOw", name: "UEFA", sport: "Football" },
  { id: "UC5lTEvtwu6SR3LMSmU9VZ2Q", name: "World Snooker Tour", sport: "Snooker" },
  { id: "UCK59dYVs3Wgwoe73nDTH6jw", name: "Premier Padel", sport: "Padel" },
  { id: "UCZko_COpTM4_d2kPrxZfzFg", name: "World Aquatics", sport: "Aquatics" },
  { id: "UCeYa3QaP2n7I8SpGSqD-kUQ", name: "International Judo Federation", sport: "Judo" },
  { id: "UCE28rwYoaV7jvU6GVzdu_GQ", name: "World Rugby", sport: "Rugby" },
  { id: "UCrBrKNpd1BjGcBBxjurOyqQ", name: "World Skate", sport: "Skateboarding" },
  { id: "UCvgfXK4nTYKudb0rFR6noLA", name: "UFC", sport: "MMA" },
  { id: "UCiormkBf3jm6mfb7k0yPbKA", name: "ONE Championship", sport: "MMA" },
  { id: "UCEeMsInLdrUbIkbEcNm7g-A", name: "Bare Knuckle FC", sport: "Combat" },
  { id: "UC7LReVje9aPB4B6XAsXX8WQ", name: "Matchroom Boxing", sport: "Boxing" },
  { id: "UCurvRE5fGcdUgCYWgh-BDsg", name: "DAZN Boxing", sport: "Boxing" },
];

export type LiveStream = {
  videoId: string;
  title: string;
  channel: string;
  sport: string;
  state: "live" | "upcoming";
  scheduledStart?: string;
  thumbnail?: string;
  // From YouTube's region restriction data, so the page can hide streams blocked for the viewer
  allowedIn?: string[];
  blockedIn?: string[];
};

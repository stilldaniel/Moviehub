// Public-domain films the app can play in full, via the Internet Archive's embed player.
// Every copy here is one the Archive itself marks as public domain (or CC0), from its
// curated Feature Films / Silent Films / Film Noir collections. Check the licence
// on archive.org/details/<archiveId> before adding more.
export const FREE_CLASSICS: { tmdbId: number; archiveId: string }[] = [
  { tmdbId: 10331, archiveId: "night_of_the_living_dead_dvd" },           // Night of the Living Dead (1968)
  { tmdbId: 3085, archiveId: "his_girl_friday" },                         // His Girl Friday (1940)
  { tmdbId: 961, archiveId: "The_General_Buster_Keaton" },                // The General (1926)
  { tmdbId: 20367, archiveId: "Detour" },                                 // Detour (1945)
  { tmdbId: 15856, archiveId: "house_on_haunted_hill_ipod" },             // House on Haunted Hill (1959)
  { tmdbId: 234, archiveId: "DasKabinettdesDoktorCaligariTheCabinetofDrCaligari" }, // The Cabinet of Dr. Caligari (1920)
  { tmdbId: 15263, archiveId: "mclintok_widescreen" },                    // McLintock! (1963)
  { tmdbId: 16093, archiveId: "CarnivalofSouls" },                        // Carnival of Souls (1962)
  { tmdbId: 964, archiveId: "ThePhantomoftheOpera" },                     // The Phantom of the Opera (1925)
  { tmdbId: 17058, archiveId: "ScarletStreet" },                          // Scarlet Street (1945)
  { tmdbId: 20246, archiveId: "TheStranger_0" },                          // The Stranger (1946)
  { tmdbId: 32574, archiveId: "meet_john_doe" },                          // Meet John Doe (1941)
  { tmdbId: 42518, archiveId: "gullivers_travels1939" },                  // Gulliver's Travels (1939)
  { tmdbId: 24452, archiveId: "The_Little_Shop_of_Horrors.mpeg" },        // The Little Shop of Horrors (1960)
  { tmdbId: 20529, archiveId: "Sita_Sings_the_Blues" },                   // Sita Sings the Blues (2008, CC0)
];

const byTmdbId = new Map(FREE_CLASSICS.map((c) => [c.tmdbId, c.archiveId]));

// Internet Archive identifier for a movie that can be watched free in the app, if any
export function freeClassicArchiveId(tmdbId: number): string | undefined {
  return byTmdbId.get(tmdbId);
}

export function archiveEmbedUrl(archiveId: string): string {
  return `https://archive.org/embed/${encodeURIComponent(archiveId)}`;
}

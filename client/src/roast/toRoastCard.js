// Average reading speed, used to give each roast a playful "video length".
const WORDS_PER_SECOND = 3.5

function readingTimeLabel(text) {
  const seconds = Math.max(5, Math.round(text.split(/\s+/).length / WORDS_PER_SECOND))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Maps a roast from the API to the shape RoastPreviewCard displays. */
export function toRoastCard(roast) {
  return {
    badge: 'Your roast',
    title: roast.headline,
    durationLabel: readingTimeLabel(roast.roast),
    likedVideoCount: roast.snapshot.totals.likedVideos,
    subscriptionCount: roast.snapshot.totals.subscriptions,
    topChannels: roast.snapshot.topChannels.map((channel) => channel.name),
    roast: roast.roast,
    verdict: roast.verdict,
  }
}

/** Plain-text version for the clipboard. */
export function roastAsText(roast) {
  return `${roast.headline}\n\n${roast.roast}\n\nVerdict: ${roast.verdict}\n\nRoasted by TubeRoast`
}

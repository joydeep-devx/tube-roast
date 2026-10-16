// Traits are roast angles chosen by simple, named rules. Each rule only fires when there is enough data
// to make the claim fair, so a viewer with 5 likes isn't called a "Shorts addict" for liking 3 Shorts.

export const THRESHOLDS = Object.freeze({
  minSample: 10, // fewest data points before a share-based trait can fire
  shortsAddictShare: 0.4, // ≥40% of liked videos are ≤60s
  longFormShare: 0.25, // ≥25% of liked videos are ≥40 minutes
  channelLoyalistShare: 0.2, // ≥20% of likes go to one channel
  genreMonogamistShare: 0.5, // ≥50% of likes are one category
  eclecticMinCategories: 6,
  eclecticMaxTopShare: 0.3,
  nostalgicShare: 0.25, // ≥25% of liked videos are over 10 years old
  trendChaserMaxMedianYears: 0.5, // half the likes are under 6 months old
  commitmentIssuesMinChannels: 20,
  commitmentIssuesShare: 0.5, // ≥50% of liked channels aren't subscribed to
  subscriptionHoarderCount: 150,
  ghostSubscriberMinSubscriptions: 20,
  ghostSubscriberShare: 0.8, // ≥80% of subscriptions never appear in likes
  playlistHoarderCount: 10,
  playlistHoarderLargest: 200,
  emptyPlaylistMin: 2,
  lurkerMaxLikes: 10,
})

const T = THRESHOLDS

/** Returns trait IDs in a fixed order, so the same metrics always produce the same list. */
export function computeTraits(metrics) {
  const { totals, channelStats, categoryStats, videoLength, nostalgia, commitment, playlists, likesCapped } = metrics
  const enoughLikes = totals.likedVideos >= T.minSample
  const rules = [
    ['likeMachine', likesCapped],
    ['lurker', totals.likedVideos < T.lurkerMaxLikes],
    ['shortsAddict', videoLength.sampleSize >= T.minSample && videoLength.shortFormShare >= T.shortsAddictShare],
    ['longFormMarathoner', videoLength.sampleSize >= T.minSample && videoLength.longFormShare >= T.longFormShare],
    ['channelLoyalist', enoughLikes && channelStats.topChannelShare >= T.channelLoyalistShare],
    ['genreMonogamist', categoryStats.sampleSize >= T.minSample && categoryStats.topShare >= T.genreMonogamistShare],
    [
      'eclectic',
      categoryStats.sampleSize >= T.minSample &&
        categoryStats.distinct >= T.eclecticMinCategories &&
        categoryStats.topShare < T.eclecticMaxTopShare,
    ],
    ['nostalgic', nostalgia.sampleSize >= T.minSample && nostalgia.olderThan10YearsShare >= T.nostalgicShare],
    [
      'trendChaser',
      nostalgia.sampleSize >= T.minSample && nostalgia.medianVideoAgeYears < T.trendChaserMaxMedianYears,
    ],
    [
      'commitmentIssues',
      commitment.likedChannelsNotSubscribed >= T.commitmentIssuesMinChannels &&
        commitment.likedChannelsNotSubscribed / Math.max(channelStats.distinctChannels, 1) >= T.commitmentIssuesShare,
    ],
    ['subscriptionHoarder', totals.subscriptions >= T.subscriptionHoarderCount],
    [
      'ghostSubscriber',
      totals.subscriptions >= T.ghostSubscriberMinSubscriptions &&
        commitment.subscribedNeverLiked / totals.subscriptions >= T.ghostSubscriberShare,
    ],
    [
      'playlistHoarder',
      totals.playlists >= T.playlistHoarderCount || (playlists.largest?.items ?? 0) >= T.playlistHoarderLargest,
    ],
    ['emptyPlaylistCollector', playlists.emptyCount >= T.emptyPlaylistMin],
  ]

  return rules.filter(([, applies]) => applies).map(([trait]) => trait)
}

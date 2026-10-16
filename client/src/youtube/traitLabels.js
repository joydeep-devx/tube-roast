// Friendly names for the trait IDs the server's analysis produces.
export const TRAIT_LABELS = {
  likeMachine: 'Like machine',
  lurker: 'Silent lurker',
  shortsAddict: 'Shorts addict',
  longFormMarathoner: 'Long-form marathoner',
  channelLoyalist: 'Channel loyalist',
  genreMonogamist: 'Genre monogamist',
  eclectic: 'All over the place',
  nostalgic: 'Stuck in the past',
  trendChaser: 'Trend chaser',
  commitmentIssues: 'Commitment issues',
  subscriptionHoarder: 'Subscription hoarder',
  ghostSubscriber: 'Ghost subscriber',
  playlistHoarder: 'Playlist hoarder',
  emptyPlaylistCollector: 'Empty playlist collector',
}

export const traitLabel = (trait) => TRAIT_LABELS[trait] ?? trait

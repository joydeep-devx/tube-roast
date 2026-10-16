import { model, Schema } from 'mongoose'

// A small summary saved with each roast so history can show context. Never the full profile.
const snapshotSchema = new Schema(
  {
    totals: {
      likedVideos: { type: Number, min: 0 },
      subscriptions: { type: Number, min: 0 },
      playlists: { type: Number, min: 0 },
    },
    topChannels: {
      type: [{ name: { type: String, maxlength: 80 }, likes: { type: Number, min: 0 }, _id: false }],
      validate: { validator: (list) => list.length <= 3, message: 'at most 3 top channels' },
    },
    traits: { type: [{ type: String, maxlength: 40 }], validate: (list) => list.length <= 20 },
  },
  { _id: false },
)

const roastSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, immutable: true },
    headline: { type: String, required: true, trim: true, maxlength: 90 },
    roast: { type: String, required: true, trim: true, maxlength: 700 },
    verdict: { type: String, required: true, trim: true, maxlength: 70 },
    snapshot: { type: snapshotSchema, required: true },
    model: { type: String, required: true, maxlength: 120 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

// History queries: "this user's roasts, newest first".
roastSchema.index({ userId: 1, createdAt: -1 })

export const Roast = model('Roast', roastSchema)

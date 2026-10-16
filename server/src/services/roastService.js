import mongoose from 'mongoose'
import { Roast } from '../models/Roast.js'

// Older roasts are deleted, so history never grows without limit.
export const MAX_ROASTS_PER_USER = 20

// Every query filters by userId: a user can only ever read or delete their own roasts.
const ownedBy = (userId, roastId) => ({ _id: roastId, userId })

export async function createRoast({ userId, headline, roast, verdict, snapshot, model }) {
  const created = await Roast.create({ userId, headline, roast, verdict, snapshot, model })

  const overflow = await Roast.find({ userId }).sort({ createdAt: -1 }).skip(MAX_ROASTS_PER_USER).select('_id')
  if (overflow.length > 0) {
    await Roast.deleteMany({ userId, _id: { $in: overflow.map((doc) => doc._id) } })
  }

  return created
}

export async function listRoasts(userId) {
  return Roast.find({ userId }).sort({ createdAt: -1 }).limit(MAX_ROASTS_PER_USER)
}

/** Returns null for invalid IDs and for roasts that belong to someone else. */
export async function findRoast(userId, roastId) {
  if (!mongoose.isValidObjectId(roastId)) return null
  return Roast.findOne(ownedBy(userId, roastId))
}

/** Returns true if a roast was deleted. */
export async function deleteRoast(userId, roastId) {
  if (!mongoose.isValidObjectId(roastId)) return false
  const result = await Roast.deleteOne(ownedBy(userId, roastId))
  return result.deletedCount === 1
}

export const roastService = { createRoast, listRoasts, findRoast, deleteRoast }

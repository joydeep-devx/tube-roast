import { User } from '../models/User.js'

const DUPLICATE_KEY_ERROR = 11000

/**
 * Creates the user on first sign-in; on later sign-ins refreshes the name and avatar
 * in case they changed on the Google account.
 */
export async function findOrCreateUserFromGoogle({ googleId, displayName, avatarUrl }) {
  const update = { $set: { displayName }, $setOnInsert: { googleId } }
  if (avatarUrl) {
    update.$set.avatarUrl = avatarUrl
  } else {
    update.$unset = { avatarUrl: 1 }
  }

  const options = { upsert: true, returnDocument: 'after', runValidators: true }

  try {
    return await User.findOneAndUpdate({ googleId }, update, options)
  } catch (error) {
    // Two simultaneous first sign-ins can both try to insert; the unique index lets one win, the other retries.
    if (error.code === DUPLICATE_KEY_ERROR) {
      return User.findOneAndUpdate({ googleId }, update, { ...options, upsert: false })
    }
    throw error
  }
}

export async function findUserById(id) {
  return User.findById(id)
}

export const userService = { findOrCreateUserFromGoogle, findUserById }

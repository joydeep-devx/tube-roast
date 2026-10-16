import { model, Schema } from 'mongoose'

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

// Only what the app actually displays. No email, no tokens, no YouTube data.
const userSchema = new Schema(
  {
    // Google's stable account ID (the "sub" claim). Unlike email, it never changes.
    googleId: { type: String, required: true, unique: true, immutable: true, trim: true },
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    avatarUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: { validator: isHttpsUrl, message: 'avatarUrl must be an https URL' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      // API responses get a plain string `id` instead of MongoDB's `_id` object.
      transform(doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        return ret
      },
    },
  },
)

export const User = model('User', userSchema)

import mongoose from 'mongoose'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Roast } from '../../src/models/Roast.js'
import { createRoast, deleteRoast, findRoast, listRoasts, MAX_ROASTS_PER_USER } from '../../src/services/roastService.js'

// These tests inspect the queries sent to Mongoose (no database needed): ownership rules live in the query.
const userId = new mongoose.Types.ObjectId().toString()
const roastId = new mongoose.Types.ObjectId().toString()

// Mimics Mongoose's chainable query: find().sort().skip().select() / find().sort().limit()
function chainable(result) {
  const query = { sort: vi.fn(() => query), skip: vi.fn(() => query), limit: vi.fn(() => query), select: vi.fn(() => query) }
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return query
}

describe('roastService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('findRoast filters by both roast ID and owner', async () => {
    const findOne = vi.spyOn(Roast, 'findOne').mockResolvedValue(null)

    await findRoast(userId, roastId)

    expect(findOne).toHaveBeenCalledWith({ _id: roastId, userId })
  })

  it('findRoast returns null for malformed IDs without querying', async () => {
    const findOne = vi.spyOn(Roast, 'findOne')

    expect(await findRoast(userId, 'not-an-id')).toBeNull()
    expect(await findRoast(userId, { $ne: null })).toBeNull() // NoSQL injection attempt
    expect(findOne).not.toHaveBeenCalled()
  })

  it('deleteRoast filters by both roast ID and owner', async () => {
    const deleteOne = vi.spyOn(Roast, 'deleteOne').mockResolvedValue({ deletedCount: 0 })

    expect(await deleteRoast(userId, roastId)).toBe(false)
    expect(deleteOne).toHaveBeenCalledWith({ _id: roastId, userId })
  })

  it('listRoasts only asks for this user, newest first, capped', async () => {
    const query = chainable([])
    const find = vi.spyOn(Roast, 'find').mockReturnValue(query)

    await listRoasts(userId)

    expect(find).toHaveBeenCalledWith({ userId })
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(query.limit).toHaveBeenCalledWith(MAX_ROASTS_PER_USER)
  })

  it('createRoast deletes this user’s roasts beyond the newest 20', async () => {
    const created = { id: 'new' }
    vi.spyOn(Roast, 'create').mockResolvedValue(created)
    const overflowIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
    const query = chainable(overflowIds.map((_id) => ({ _id })))
    const find = vi.spyOn(Roast, 'find').mockReturnValue(query)
    const deleteMany = vi.spyOn(Roast, 'deleteMany').mockResolvedValue({ deletedCount: 2 })

    expect(await createRoast({ userId, headline: 'h' })).toBe(created)

    expect(find).toHaveBeenCalledWith({ userId })
    expect(query.skip).toHaveBeenCalledWith(MAX_ROASTS_PER_USER)
    expect(deleteMany).toHaveBeenCalledWith({ userId, _id: { $in: overflowIds } })
  })

  it('createRoast skips the cleanup when under the cap', async () => {
    vi.spyOn(Roast, 'create').mockResolvedValue({ id: 'new' })
    vi.spyOn(Roast, 'find').mockReturnValue(chainable([]))
    const deleteMany = vi.spyOn(Roast, 'deleteMany')

    await createRoast({ userId })

    expect(deleteMany).not.toHaveBeenCalled()
  })
})

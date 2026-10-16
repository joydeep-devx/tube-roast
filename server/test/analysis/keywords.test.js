import { describe, expect, it } from 'vitest'
import { extractKeywords, tokenize } from '../../src/analysis/keywords.js'

describe('tokenize', () => {
  it('lowercases, drops stopwords, YouTube noise, short words and pure numbers', () => {
    expect(tokenize('The OFFICIAL Music Video: Minecraft Speedrun in 4K (2019) ep 12')).toEqual(['minecraft', 'speedrun'])
  })

  it('keeps non-English letters', () => {
    expect(tokenize('Pokémon ポケモン café')).toEqual(['pokémon', 'ポケモン', 'café'])
  })
})

describe('extractKeywords', () => {
  const video = (title, tags = []) => ({ title, tags })

  it('returns the most repeated words with counts', () => {
    const videos = [video('Minecraft speedrun'), video('Minecraft hardcore'), video('Speedrun minecraft any%'), video('Cats')]
    expect(extractKeywords(videos)).toEqual([
      { word: 'minecraft', count: 3 },
      { word: 'speedrun', count: 2 },
    ])
  })

  it('counts a word once per video, however often its tags repeat it', () => {
    const videos = [video('asmr asmr', ['asmr', 'ASMR', 'asmr sleep']), video('cooking pasta'), video('cooking soup')]
    expect(extractKeywords(videos)).toEqual([{ word: 'cooking', count: 2 }])
  })

  it('ignores words seen only once and respects the limit', () => {
    const videos = Array.from({ length: 3 }, () => video('alpha bravo charlie delta echo foxtrot golf hotel india juliet'))
    expect(extractKeywords(videos, { limit: 8 })).toHaveLength(8)
    expect(extractKeywords([video('unique words only')])).toEqual([])
  })
})

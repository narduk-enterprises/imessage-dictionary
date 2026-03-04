import { like, sql } from 'drizzle-orm'
import { dictionaryEntries } from '../database/schema'
import type { DictionaryEntry, SearchResult } from './types'

type DbRow = typeof dictionaryEntries.$inferSelect

/**
 * Parse the senses_json column into a typed DictionaryEntry
 */
function rowToEntry(row: DbRow): DictionaryEntry {
  let senses
  try {
    senses = JSON.parse(row.sensesJson)
  }
  catch {
    senses = [{ gloss: row.gloss, pos: row.pos, example: row.example }]
  }

  return {
    term: row.term,
    senses,
    source: row.source || 'Unknown',
    sourceUrl: row.sourceUrl || undefined,
    license: row.license || 'Unknown',
    updatedAt: row.updatedAt || undefined,
  }
}

/**
 * Look up a single dictionary entry by term (case-insensitive)
 */
export async function getEntryByTerm(db: ReturnType<typeof useDatabase>, term: string): Promise<DictionaryEntry | null> {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return null

  const rows = await db.select()
    .from(dictionaryEntries)
    .where(sql`lower(${dictionaryEntries.term}) = ${normalized}`)
    .limit(1)

  if (rows.length === 0) return null
  return rowToEntry(rows[0]!)
}

/**
 * Search dictionary entries with prefix + contains matching
 */
export async function searchDictionary(db: ReturnType<typeof useDatabase>, query: string, limit = 20): Promise<SearchResult[]> {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  // Prefix matches first, then contains
  const prefixRows = await db.select()
    .from(dictionaryEntries)
    .where(like(dictionaryEntries.term, `${normalized}%`))
    .limit(limit)

  const prefixTerms = new Set(prefixRows.map(r => r.term.toLowerCase()))

  const containsRows = await db.select()
    .from(dictionaryEntries)
    .where(like(dictionaryEntries.term, `%${normalized}%`))
    .limit(limit)

  const results: SearchResult[] = []
  // Prefix matches come first
  for (const row of prefixRows) {
    results.push({ term: row.term, gloss: row.gloss, pos: row.pos || undefined })
  }
  // Then contains matches that aren't already in prefix results
  for (const row of containsRows) {
    if (!prefixTerms.has(row.term.toLowerCase())) {
      results.push({ term: row.term, gloss: row.gloss, pos: row.pos || undefined })
    }
  }

  return results.slice(0, limit)
}

/**
 * Get a random dictionary entry
 */
export async function getRandomEntry(db: ReturnType<typeof useDatabase>): Promise<DictionaryEntry | null> {
  const rows = await db.select()
    .from(dictionaryEntries)
    .orderBy(sql`RANDOM()`)
    .limit(1)

  if (rows.length === 0) return null
  return rowToEntry(rows[0]!)
}

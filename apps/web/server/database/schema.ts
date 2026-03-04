import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const dictionaryEntries = sqliteTable('dictionary_entries', {
  term: text('term').primaryKey(),
  pos: text('pos'),
  gloss: text('gloss').notNull(),
  example: text('example'),
  source: text('source'),
  sourceUrl: text('source_url'),
  license: text('license'),
  updatedAt: text('updated_at'),
  sensesJson: text('senses_json').notNull(),
})

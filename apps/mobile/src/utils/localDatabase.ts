import SQLite from 'react-native-sqlite-storage'
import type { Spirit } from './types'

SQLite.enablePromise(true)

export interface LocalProgress {
  spiritId: number
  bestScore: number
  captureVersion: string
  reviewCount: number
  nextReviewAt: number
  synced: number
}

let dbInstance: SQLite.SQLiteDatabase | null = null

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance
  dbInstance = await SQLite.openDatabase({ name: 'phonosia.db', location: 'default' })
  return dbInstance
}

export async function createTablesIfNeeded(): Promise<void> {
  const db = await getDb()
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS spirits (
      id INTEGER PRIMARY KEY,
      word TEXT NOT NULL,
      island_id INTEGER NOT NULL,
      phonetic TEXT,
      meaning_zh TEXT,
      example_sentence TEXT,
      is_boss INTEGER DEFAULT 0,
      difficulty INTEGER DEFAULT 1
    )
  `)
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS local_progress (
      spirit_id INTEGER PRIMARY KEY,
      best_score INTEGER DEFAULT 0,
      capture_version TEXT DEFAULT 'standard',
      review_count INTEGER DEFAULT 0,
      next_review_at INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0
    )
  `)
}

export async function getSpirits(islandId?: number): Promise<Spirit[]> {
  const db = await getDb()
  const sql = islandId
    ? 'SELECT * FROM spirits WHERE island_id = ? ORDER BY id ASC'
    : 'SELECT * FROM spirits ORDER BY island_id ASC, id ASC'
  const params = islandId ? [islandId] : []
  const [result] = await db.executeSql(sql, params)
  const spirits: Spirit[] = []
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i)
    spirits.push({
      id: row.id,
      word: row.word,
      islandId: row.island_id,
      phonetic: row.phonetic ?? '',
      meaningZh: row.meaning_zh ?? '',
      exampleSentence: row.example_sentence ?? '',
      isBoss: row.is_boss === 1,
      difficulty: row.difficulty,
      theme: '',
    })
  }
  return spirits
}

export async function countSpirits(): Promise<number> {
  const db = await getDb()
  const [result] = await db.executeSql('SELECT COUNT(*) as cnt FROM spirits')
  return result.rows.item(0).cnt as number
}

export async function insertSpirits(spirits: Spirit[]): Promise<void> {
  const db = await getDb()
  for (const s of spirits) {
    await db.executeSql(
      `INSERT OR REPLACE INTO spirits (id, word, island_id, phonetic, meaning_zh, example_sentence, is_boss, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.word, s.islandId, s.phonetic, s.meaningZh, s.exampleSentence, s.isBoss ? 1 : 0, s.difficulty],
    )
  }
}

export async function upsertProgress(
  spiritId: number,
  bestScore: number,
  captureVersion: string,
  nextReviewAt: number,
): Promise<void> {
  const db = await getDb()
  const [existing] = await db.executeSql(
    'SELECT best_score, capture_version FROM local_progress WHERE spirit_id = ?',
    [spiritId],
  )
  if (existing.rows.length > 0) {
    const row = existing.rows.item(0)
    const newScore = Math.max(row.best_score as number, bestScore)
    // shiny never downgrades
    const newVersion = row.capture_version === 'shiny' ? 'shiny' : captureVersion
    await db.executeSql(
      `UPDATE local_progress
       SET best_score = ?, capture_version = ?, next_review_at = ?, synced = 0
       WHERE spirit_id = ?`,
      [newScore, newVersion, nextReviewAt, spiritId],
    )
  } else {
    await db.executeSql(
      `INSERT INTO local_progress (spirit_id, best_score, capture_version, review_count, next_review_at, synced)
       VALUES (?, ?, ?, 0, ?, 0)`,
      [spiritId, bestScore, captureVersion, nextReviewAt],
    )
  }
}

export async function getPendingSync(): Promise<LocalProgress[]> {
  const db = await getDb()
  const [result] = await db.executeSql(
    'SELECT * FROM local_progress WHERE synced = 0',
  )
  const items: LocalProgress[] = []
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i)
    items.push({
      spiritId: row.spirit_id,
      bestScore: row.best_score,
      captureVersion: row.capture_version,
      reviewCount: row.review_count,
      nextReviewAt: row.next_review_at,
      synced: row.synced,
    })
  }
  return items
}

export async function markSynced(spiritId: number): Promise<void> {
  const db = await getDb()
  await db.executeSql('UPDATE local_progress SET synced = 1 WHERE spirit_id = ?', [spiritId])
}

export async function upsertProgressFromCloud(entries: LocalProgress[]): Promise<void> {
  for (const e of entries) {
    await upsertProgress(e.spiritId, e.bestScore, e.captureVersion, e.nextReviewAt)
    await markSynced(e.spiritId)
  }
}

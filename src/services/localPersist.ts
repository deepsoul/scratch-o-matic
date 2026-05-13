import { get, set, del, keys as idbKeys } from 'idb-keyval'

const PREFIX = 'scratch-o-matic:'

export async function saveLocalJson<T>(key: string, value: T): Promise<void> {
  await set(`${PREFIX}${key}`, value)
}

export async function loadLocalJson<T>(key: string): Promise<T | undefined> {
  return get(`${PREFIX}${key}`) as Promise<T | undefined>
}

export async function removeLocal(key: string): Promise<void> {
  await del(`${PREFIX}${key}`)
}

export async function listLocalKeys(): Promise<string[]> {
  const all = await idbKeys()
  return all
    .filter((k): k is string => typeof k === 'string' && k.startsWith(PREFIX))
    .map((k) => k.slice(PREFIX.length))
}

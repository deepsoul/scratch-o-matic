import { getFirebaseOrNull } from '@/services/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export async function uploadMixWav(file: Blob, path: string): Promise<string> {
  const fb = getFirebaseOrNull()
  if (!fb) throw new Error('Firebase not available')
  const r = storageRef(fb.storage, path)
  await uploadBytes(r, file, { contentType: 'audio/wav' })
  return getDownloadURL(r)
}

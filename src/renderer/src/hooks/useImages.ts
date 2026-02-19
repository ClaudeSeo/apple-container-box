/**
 * 이미지 관리 훅
 */

import { useState, useEffect, useCallback } from 'react'
import type { Image } from '@/types'

interface UseImagesReturn {
  images: Image[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  pullImage: (ref: string) => Promise<void>
  deleteImage: (id: string, force?: boolean) => Promise<void>
}

export function useImages(): UseImagesReturn {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.electronAPI.images.list()
      setImages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }, [])

  const pullImage = useCallback(async (ref: string) => {
    await window.electronAPI.images.pull(ref)
    await fetchImages()
  }, [fetchImages])

  const deleteImage = useCallback(async (id: string, force?: boolean) => {
    await window.electronAPI.images.remove(id, force)
    await fetchImages()
  }, [fetchImages])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  return {
    images,
    loading,
    error,
    refetch: fetchImages,
    pullImage,
    deleteImage
  }
}

/** 이미지 풀 진행 상황 훅 */
export function useImagePullProgress() {
  const [progress, setProgress] = useState<{
    image: string
    status: string
    current?: number
    total?: number
  } | null>(null)

  useEffect(() => {
    const unsubscribe = window.electronAPI.streams.onPullProgress((data) => {
      setProgress(data)
    })
    return unsubscribe
  }, [])

  const clearProgress = useCallback(() => {
    setProgress(null)
  }, [])

  return { progress, clearProgress }
}

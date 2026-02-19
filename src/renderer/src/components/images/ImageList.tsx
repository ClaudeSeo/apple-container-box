/**
 * 이미지 목록 컴포넌트
 */

import { useState } from 'react'
import { HardDrive, Search, Trash2, Download, RefreshCw, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useImages } from '@/hooks/useImages'
import { ImagePullDialog } from './ImagePullDialog'
import { InspectDialog } from '@/components/common/InspectDialog'
import { formatBytes, formatRelativeTime } from '@/lib/format'
import type { Image } from '@/types'

interface ImageListProps {
  onInspect?: (image: Image) => void
}

export function ImageList(_props: ImageListProps) {
  const { images, loading, refetch, deleteImage } = useImages()
  const [search, setSearch] = useState('')
  const [pullDialogOpen, setPullDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [inspectedImage, setInspectedImage] = useState<unknown>(null)
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false)

  const filteredImages = images.filter((image) => {
    const searchLower = search.toLowerCase()
    return (
      (image.repository ?? '').toLowerCase().includes(searchLower) ||
      (image.tag ?? '').toLowerCase().includes(searchLower) ||
      (image.id ?? '').toLowerCase().includes(searchLower)
    )
  })

  const handleDelete = async (image: Image) => {
    if (deleting) return
    setDeleting(image.id)
    try {
      await deleteImage(`${image.repository}:${image.tag}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleInspect = async (image: Image) => {
    const ref = `${image.repository}:${image.tag}`
    const data = await window.electronAPI.images.inspect(ref)
    setInspectedImage(data)
    setInspectDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Images</h2>
          <span className="text-sm text-muted-foreground">({images.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setPullDialogOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Pull Image
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Image ID</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredImages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {loading ? 'Loading images...' : 'No images found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredImages.map((image, index) => (
                <TableRow key={`${image.id}-${image.repository}-${image.tag}-${index}`}>
                  <TableCell className="font-medium">{image.repository}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 bg-surface rounded text-sm">{image.tag}</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {(image.id ?? '').slice(0, 12) || '—'}
                  </TableCell>
                  <TableCell>{formatBytes(image.size)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(image.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleInspect(image)}>
                          <Info className="w-4 h-4 mr-2" />
                          Inspect
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(image)}
                          disabled={deleting === image.id}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pull Dialog */}
      <ImagePullDialog open={pullDialogOpen} onOpenChange={setPullDialogOpen} />

      {/* Inspect Dialog */}
      <InspectDialog
        title={`Image: ${inspectedImage && typeof inspectedImage === 'object' && 'repository' in inspectedImage ? `${(inspectedImage as Image).repository}:${(inspectedImage as Image).tag}` : 'Inspect'}`}
        data={inspectedImage}
        open={inspectDialogOpen}
        onOpenChange={setInspectDialogOpen}
      />
    </div>
  )
}

/**
 * 이미지 목록 컴포넌트
 */

import { useState } from 'react'
import { Image as ImageIcon, Search, Trash2, Download, RefreshCw, Info, MoreHorizontal } from 'lucide-react'
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
    <div className="flex flex-col h-full bg-[#000000]/20">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#30D158] text-white shadow-lg">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Images</h2>
            <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-widest mt-0.5">
              {images.length} Local Images
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={loading}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={() => setPullDialogOpen(true)}
            className="bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 shadow-lg shadow-[#0A84FF]/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Pull Image
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#0A84FF] transition-colors" />
          <Input
            placeholder="Filter images by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#1C1C1E]/50 border-white/5 text-white placeholder:text-[#48484A] focus-visible:ring-[#0A84FF]/50"
          />
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1 px-8 pb-8">
        <div className="rounded-2xl border border-white/5 bg-[#1C1C1E]/50 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Repository</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Tag</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Image ID</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Size</TableHead>
                <TableHead className="text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">Created</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredImages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[#8E8E93] py-20 border-none">
                    <div className="flex flex-col items-center gap-3">
                      <ImageIcon className="h-10 w-10 text-[#48484A]" />
                      <p>{loading ? 'Loading images...' : 'No images found'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredImages.map((image, index) => (
                  <TableRow key={`${image.id}-${image.repository}-${image.tag}-${index}`} className="border-white/5 hover:bg-white/5 group">
                    <TableCell className="font-semibold text-white py-4">{image.repository}</TableCell>
                    <TableCell>
                      <span className="bg-[#8E8E93]/10 border border-[#8E8E93]/20 text-[#8E8E93] text-[11px] font-bold px-2 py-0.5 rounded-md">
                        {image.tag}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#8E8E93]">
                      {(image.id ?? '').slice(0, 12) || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-[#E5E5E7]">{formatBytes(image.size)}</TableCell>
                    <TableCell className="text-sm text-[#8E8E93]">
                      {formatRelativeTime(image.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8E8E93] hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#2C2C2E] border-white/10 text-white">
                          <DropdownMenuItem onClick={() => handleInspect(image)} className="focus:bg-white/10 focus:text-white">
                            <Info className="w-4 h-4 mr-2" />
                            Inspect
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(image)}
                            disabled={deleting === image.id}
                            className="text-[#FF453A] focus:bg-[#FF453A]/10 focus:text-[#FF453A]"
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
        </div>
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

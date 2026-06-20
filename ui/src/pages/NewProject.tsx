import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Button, Input } from '@/components/ui'
import { projectsService } from '@/services/projects.service'
import { useAuthStore } from '@/stores/authStore'
import { CoverUpload } from '@/features/projects/components/CoverUpload'
import { TagInput } from '@/features/projects/components/TagInput'
import { VisibilitySelector } from '@/features/projects/components/VisibilitySelector'
import type { Visibility } from '@/types'

export default function NewProject() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error('Title is required')
      return
    }

    setLoading(true)
    try {
      const project = await projectsService.create({
        owner_id: user.id,
        title: trimmedTitle,
        description: description.trim() || undefined,
        visibility,
        tags,
      })

      if (coverFile) {
        setUploadingCover(true)
        try {
          const coverUrl = await projectsService.uploadCover(project.id, coverFile, user.id)
          await projectsService.update(project.id, { cover_image_url: coverUrl })
        } catch {
          toast.error('Project created but cover upload failed')
        } finally {
          setUploadingCover(false)
        }
      }

      toast.success('Project created')
      navigate(`/projects/${project.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedPage className="max-w-2xl flex flex-col justify-center">
      <h1 className="text-headline text-ink-primary mb-6 text-center">New project</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CoverUpload
          onChange={setCoverFile}
          uploading={uploadingCover}
          disabled={loading}
        />

        <div className="glass rounded-glass p-6 space-y-5">
          <Input
            label="Title"
            placeholder="What are you building?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-label uppercase text-ink-secondary tracking-wider">
              Description
            </label>
            <textarea
              placeholder="A short description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full rounded-glass glass text-ink-primary text-body px-4 py-3 outline-none border border-transparent placeholder:text-ink-disabled focus:border-accent/50 focus:shadow-glow transition-all duration-200 resize-none"
            />
          </div>

          <TagInput tags={tags} onChange={setTags} disabled={loading} />

          <div className="space-y-1.5">
            <label className="text-label uppercase text-ink-secondary tracking-wider">
              Visibility
            </label>
            <VisibilitySelector value={visibility} onChange={setVisibility} disabled={loading} />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading || !title.trim()}
            className="w-full"
          >
            {loading ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </form>
    </AnimatedPage>
  )
}

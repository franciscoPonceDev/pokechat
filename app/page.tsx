'use client'

import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ScrollArea, ScrollViewport } from '../components/ui/scroll-area'
import { cn } from '../lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
}

function LoadingRow ({ label }: { label: string }) {
  return (
    <div role='status' aria-live='polite' className='rounded-md p-3 border bg-card flex items-center gap-2'>
      <span className='inline-block h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin' aria-hidden='true' />
      <span className='text-sm text-muted-foreground'>{label}</span>
    </div>
  )
}

export default function HomePage () {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const chatAbortRef = useRef<AbortController | null>(null)
  const identifyAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!activeId && sessions.length === 0) {
      const id = `${Date.now()}`
      setSessions([{ id, title: 'New chat', messages: [] }])
      setActiveId(id)
    }
  }, [activeId, sessions.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [sessions, activeId])

  const active = useMemo(() => sessions.find(s => s.id === activeId) || null, [sessions, activeId])

  const handleNewChat = () => {
    const id = `${Date.now()}`
    setSessions(prev => [{ id, title: 'New chat', messages: [] }, ...prev])
    setActiveId(id)
    setInput('')
  }

  const pushMessage = (role: 'user' | 'assistant', content: string) => {
    setSessions(prev => prev.map(s => s.id !== activeId ? s : { ...s, messages: [...s.messages, { id: `${Date.now()}`, role, content }] }))
  }

  const handleSend = async () => {
    if (!input.trim() || !activeId) return
    const question = input.trim()
    setInput('')
    pushMessage('user', question)
    setIsSending(true)
    try {
      const controller = new AbortController()
      chatAbortRef.current = controller
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text || `Request failed: ${res.status}`)
      pushMessage('assistant', text)
      setSessions(prev => prev.map(s => s.id !== activeId ? s : { ...s, title: s.title === 'New chat' ? question.slice(0, 32) : s.title }))
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        pushMessage('assistant', 'Cancelled.')
      } else {
        pushMessage('assistant', `Error: ${err?.message || 'Failed to fetch'}`)
      }
    } finally {
      setIsSending(false)
      chatAbortRef.current = null
    }
  }

  const handleSelectImage = () => fileInputRef.current?.click()

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activeId) return
    const file = files[0]
    setUploading(true)
    pushMessage('user', `Uploaded image: ${file.name}`)
    try {
      const form = new FormData()
      form.append('file', file)
      const controller = new AbortController()
      identifyAbortRef.current = controller
      const res = await fetch(`${API_URL}/identify`, { method: 'POST', body: form, signal: controller.signal })
      const text = await res.text()
      if (!res.ok) throw new Error(text || `Request failed: ${res.status}`)
      pushMessage('assistant', text)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        pushMessage('assistant', 'Cancelled.')
      } else {
        pushMessage('assistant', `Error: ${err?.message || 'Upload failed'}`)
      }
    } finally {
      setUploading(false)
      identifyAbortRef.current = null
    }
  }

  const handleIdentifyByUrl = async () => {
    if (!imageUrl.trim() || !activeId) return
    setUploading(true)
    pushMessage('user', `Identify from URL: ${imageUrl.trim()}`)
    try {
      const controller = new AbortController()
      identifyAbortRef.current = controller
      const res = await fetch(`${API_URL}/identify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: imageUrl.trim() }), signal: controller.signal })
      const text = await res.text()
      if (!res.ok) throw new Error(text || `Request failed: ${res.status}`)
      pushMessage('assistant', text)
      setImageUrl('')
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        pushMessage('assistant', 'Cancelled.')
      } else {
        pushMessage('assistant', `Error: ${err?.message || 'URL identify failed'}`)
      }
    } finally {
      setUploading(false)
      identifyAbortRef.current = null
    }
  }

  

  const handleAbort = () => {
    const hasChat = !!chatAbortRef.current
    const hasIdentify = !!identifyAbortRef.current
    if (!hasChat && !hasIdentify) return
    try { chatAbortRef.current?.abort() } catch {}
    try { identifyAbortRef.current?.abort() } catch {}
    chatAbortRef.current = null
    identifyAbortRef.current = null
    if (isSending) setIsSending(false)
    if (uploading) setUploading(false)
  }

  useEffect(() => {
    function onKeyDown (e: KeyboardEvent) {
      if (e.key === 'Escape' && (isSending || uploading)) {
        e.preventDefault()
        handleAbort()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSending, uploading])

  return (
    <main className='min-h-screen grid grid-cols-12 gap-4 p-4'>
      <aside className='col-span-12 md:col-span-3'>
        <Card>
          <CardHeader>
            <CardTitle>Chats</CardTitle>
            <CardDescription>Session-only history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex gap-2 mb-3'>
              <Button onClick={handleNewChat} aria-label='New chat'>New</Button>
              <Button variant='outline' onClick={handleSelectImage} disabled={uploading} aria-busy={uploading}>{uploading ? 'Uploading…' : 'Image'}</Button>
              <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={e => handleUpload(e.target.files)} />
            </div>
            <div className='flex gap-2 mb-3'>
              <Input
                placeholder='Paste image URL (http/https)'
                aria-label='Image URL'
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleIdentifyByUrl() }}
              />
              <Button variant='outline' onClick={handleIdentifyByUrl} disabled={uploading || !imageUrl.trim()} aria-busy={uploading}>{uploading ? 'Identifying…' : 'Identify URL'}</Button>
            </div>
            
            <ul className='space-y-1 max-h-[60vh] overflow-auto pr-2'>
              {sessions.map(s => (
                <li key={s.id}>
                  <button
                    className={cn('w-full text-left text-sm px-2 py-1 rounded-md border', s.id === activeId ? 'bg-accent' : 'hover:bg-accent')}
                    onClick={() => setActiveId(s.id)}
                    aria-current={s.id === activeId}
                  >
                    {s.title || 'Untitled'}
                  </button>
                </li>
              ))}
              {sessions.length === 0 && <li className='text-sm text-muted-foreground'>No sessions.</li>}
            </ul>
          </CardContent>
        </Card>
      </aside>

      <section className='col-span-12 md:col-span-9'>
        <Card className='h-[80vh] flex flex-col'>
          <CardHeader>
            <CardTitle>PokeChat</CardTitle>
            <CardDescription>Ask about any Pokémon. Upload an image to identify.</CardDescription>
          </CardHeader>
          <CardContent className='flex-1 min-h-0'>
            <ScrollArea className='h-full'>
              <ScrollViewport ref={scrollRef as any} className='pr-2 space-y-4'>
                {active?.messages.map(m => {
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className={cn('rounded-md p-3 border', 'bg-secondary')}
                        role='article' aria-label='User message' tabIndex={0}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className='prose dark:prose-invert max-w-none'>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )
                  }

                  // Assistant: render Markdown, but if a Base Stats table exists, split it into stat cards
                  const lines = m.content.split('\n')
                  const startIdx = lines.findIndex(l => l.trim().toLowerCase().startsWith('**base stats:**'.toLowerCase()))
                  let before = m.content
                  let after = ''
                  let statCards: Array<{ label: string, value: string }> = []
                  if (startIdx !== -1) {
                    // Expect 3-line markdown table after the Base Stats header
                    const headerIdx = startIdx + 1
                    const sepIdx = startIdx + 2
                    const rowIdx = startIdx + 3
                    const header = lines[headerIdx] || ''
                    const row = lines[rowIdx] || ''
                    const isTable = header.includes('|') && row.includes('|')
                    if (isTable) {
                      const parseCells = (s: string) => s.split('|').map(x => x.trim()).filter(Boolean)
                      const headers = parseCells(header.replace(/^\|/, '').replace(/\|$/, ''))
                      const values = parseCells(row.replace(/^\|/, '').replace(/\|$/, ''))
                      if (headers.length && headers.length === values.length) {
                        statCards = headers.map((h, i) => ({ label: h, value: values[i] }))
                        // Compose before and after without the table block
                        before = lines.slice(0, startIdx).join('\n')
                        after = lines.slice(rowIdx + 1).join('\n')
                      }
                    }
                  }

                  return (
                    <div key={m.id} className={cn('rounded-md p-3 border', 'bg-card')}
                      role='article' aria-label='Assistant message' tabIndex={0}>
                      {before && (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className='prose dark:prose-invert max-w-none'>
                          {before}
                        </ReactMarkdown>
                      )}
                      {statCards.length > 0 && (
                        <div className='my-3'>
                          <div className='mb-2 text-sm font-medium text-muted-foreground'>Base Stats</div>
                          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2'>
                            {statCards.map((s, idx) => (
                              <Card key={idx}>
                                <CardContent className='p-3'>
                                  <div className='text-xs text-muted-foreground'>{s.label}</div>
                                  <div className='text-xl font-semibold'>{s.value}</div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      {after && (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className='prose dark:prose-invert max-w-none'>
                          {after}
                        </ReactMarkdown>
                      )}
                      {(!statCards.length && !before) && (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className='prose dark:prose-invert max-w-none'>
                          {m.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )
                })}
                {(isSending || uploading) && (
                  <LoadingRow label={uploading ? 'Identifying…' : 'Thinking…'} />
                )}
                {active?.messages.length === 0 && (
                  <div className='text-sm text-muted-foreground'>Start by asking "Tell me about Pikachu"</div>
                )}
              </ScrollViewport>
            </ScrollArea>
          </CardContent>
          <CardFooter className='gap-2'>
            <Input
              aria-label='Message'
              placeholder='Ask about a Pokémon...'
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
            />
            <Button onClick={handleSend} disabled={isSending || uploading} aria-busy={isSending}>{isSending ? 'Sending…' : 'Send'}</Button>
            {(isSending || uploading) && (
              <Button variant='outline' onClick={handleAbort} aria-label='Cancel current request' aria-keyshortcuts='Esc'>Cancel</Button>
            )}
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}



'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface NewsletterEditorProps {
  initialContent: any
  onUpdate: (html: string) => void
  template?: string
}

export default function NewsletterEditor({ initialContent, onUpdate, template = 'modern' }: NewsletterEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    immediatelyRender: false,
    editorProps: {
        attributes: {
            class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-8 ${
                template === 'classic' ? 'font-serif' : 
                template === 'minimal' ? 'font-mono' : 
                'font-sans'
            }`,
        },
    }
  })

  const addImage = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (event: any) => {
        const file = event.target.files[0]
        if (!file) return

        if (!supabase) {
            alert('Supabase 클라이언트가 초기화되지 않았습니다.')
            return
        }

        try {
            const fileName = `${Date.now()}-${file.name}`
            const { data, error } = await supabase
                .storage
                .from('newsletter-images')
                .upload(fileName, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase
                .storage
                .from('newsletter-images')
                .getPublicUrl(fileName)

            if (editor) {
                editor.chain().focus().setImage({ src: publicUrl }).run()
            }
        } catch (error: any) {
            console.error('이미지 업로드 중 오류 발생:', error)
            alert('이미지 업로드 실패: ' + error.message)
        }
    }

    input.click()
  }, [editor])

  // 초기 콘텐츠가 있고 에디터가 준비되면 콘텐츠 로드
  useEffect(() => {
    if (editor && initialContent) {
        // Tiptap을 위해 JSON 구조에서 HTML 생성
        // 단순화된 변환 방식입니다.
        // 이상적으로는 섹션을 HTML 문자열로 매핑해야 합니다.
        
        let htmlContent = `<h1>${initialContent.title}</h1>`;
        
        if (initialContent.summary && initialContent.summary.length > 0) {
            htmlContent += `<blockquote><ul>`;
            initialContent.summary.forEach((item: string) => {
                htmlContent += `<li>${item}</li>`;
            });
            htmlContent += `</ul></blockquote>`;
        }

        if (initialContent.sections) {
            initialContent.sections.forEach((section: any) => {
                htmlContent += `<h2>${section.heading}</h2>`;
                htmlContent += `<p>${section.content}</p>`;
            });
        }
        
        if (initialContent.insights) {
             htmlContent += `<h3>💡 Insight</h3><p>${initialContent.insights}</p>`;
        }

        editor.commands.setContent(htmlContent)
    }
  }, [editor, initialContent])

  if (!editor) {
    return null
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
        <div className="mb-2 flex gap-2 border-b pb-2">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            >
                Bold
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            >
                Italic
            </button>
             <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
            >
                H2
            </button>
             <button
                onClick={addImage}
                className="px-2 py-1 rounded hover:bg-gray-200"
            >
                📷 이미지 추가
            </button>
        </div>
      <EditorContent editor={editor} />
    </div>
  )
}

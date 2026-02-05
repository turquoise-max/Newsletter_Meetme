'use client'

import { useState } from 'react'
import { Trash, ArrowUp, ArrowDown, Plus, Type, Image as ImageIcon, Link as LinkIcon, Minus, Quote, BarChart, Info } from 'lucide-react'
import { 
  HeaderBlock, 
  ChapterHeaderBlock,
  QuickSummaryBlock,
  ShortNewsBlock,
  MainStoryBlock, 
  DeepDiveBlock, 
  ToolSpotlightBlock, 
  BridgeBlock, 
  InsightBlock 
} from './blocks/BlockComponents'
import { commonMarkdownRenderer } from '../lib/html-exporter'

interface Block {
  type: string
  content: any
}

interface BlockEditorProps {
  initialBlocks: Block[]
  onChange: (blocks: Block[]) => void
  template: string
}

export default function BlockEditor({ initialBlocks, onChange, template }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks || [])
  const [editingBlock, setEditingBlock] = useState<number | null>(null)
  const [activeAddMenu, setActiveAddMenu] = useState<number | null>(null) // index of the block *after* which to add

  const updateBlock = (index: number, newContent: any) => {
    const newBlocks = [...blocks]
    newBlocks[index] = { ...newBlocks[index], content: newContent }
    setBlocks(newBlocks)
    onChange(newBlocks)
  }

  const addBlock = (index: number, type: string) => {
    const newBlock = {
        type,
        content: type === 'text' ? { text: '새로운 텍스트 블록입니다.' } :
                 type === 'image' ? { image_url: '', caption: '' } :
                 type === 'divider' ? {} :
                 type === 'button' ? { text: '버튼 텍스트', link: '#' } :
                 type === 'quote' ? { text: '인용구 내용', author: '작성자' } :
                 type === 'stat_box' ? { value: '00%', label: '통계 라벨', description: '설명' } : 
                 type === 'callout' ? { title: '알림', text: '내용을 입력하세요.' } : 
                 type === 'chapter_header' ? { title: '새로운 챕터' } :
                 type === 'quick_summary' ? { items: ['요약 1', '요약 2', '요약 3'] } :
                 type === 'short_news' ? { title: 'News Briefs', news_items: [] } : {}
    }
    const newBlocks = [...blocks]
    newBlocks.splice(index + 1, 0, newBlock)
    setBlocks(newBlocks)
    onChange(newBlocks)
    setActiveAddMenu(null)
    setEditingBlock(index + 1) // Auto-focus new block
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newBlocks[targetIndex]
    newBlocks[targetIndex] = newBlocks[index]
    newBlocks[index] = temp
    setBlocks(newBlocks)
    onChange(newBlocks)
    setEditingBlock(targetIndex) // Follow the moved block
  }

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index)
    setBlocks(newBlocks)
    onChange(newBlocks)
    setEditingBlock(null)
  }

  // 테마별 스타일 설정
  const getThemeStyles = () => {
    switch (template) {
        case 'classic': return 'font-serif bg-[#fdfbf7] text-stone-800'
        case 'dark': return 'font-sans bg-slate-900 text-slate-100'
        default: return 'font-sans bg-white text-slate-900' // modern
    }
  }

  const themeClass = getThemeStyles()
  const isDark = template === 'dark'

  // 챕터 번호 계산 로직
  let chapterIndex = 0;

  return (
    <div className={`space-y-0 max-w-3xl mx-auto min-h-[800px] shadow-2xl transition-colors duration-300 ${themeClass}`}>
      {blocks.map((block, index) => {
        if (block.type === 'chapter_header') chapterIndex++;
        
        return (
        <div key={index} className="relative group">
            {/* Add Block Button (Top of each block) - Popover style */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActiveAddMenu(activeAddMenu === index - 1 ? null : index - 1) }}
                        className="bg-blue-500 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
                    >
                        <Plus size={16} />
                    </button>
                    {activeAddMenu === index - 1 && (
                        <AddBlockMenu onSelect={(type) => addBlock(index - 1, type)} onClose={() => setActiveAddMenu(null)} />
                    )}
                </div>
            </div>

            <div 
                className={`relative transition-all w-full ${
                    block.type === 'chapter_header' ? '' : 'px-12 py-6'
                } ${
                    editingBlock === index 
                    ? 'ring-4 ring-blue-500/30 ring-inset z-10 bg-blue-50/10' 
                    : 'hover:bg-slate-50/50'
                }`}
                onClick={() => setEditingBlock(index)}
            >
                {/* Block Controls */}
                {editingBlock === index && (
                    <div className="absolute right-0 top-0 -mt-12 bg-white shadow-lg rounded-lg flex items-center p-1 border border-slate-200 z-20 text-slate-700">
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up') }} className="p-2 hover:bg-slate-100 rounded"><ArrowUp size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down') }} className="p-2 hover:bg-slate-100 rounded"><ArrowDown size={16} /></button>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <button onClick={(e) => { e.stopPropagation(); deleteBlock(index) }} className="p-2 hover:bg-red-50 text-red-500 rounded"><Trash size={16} /></button>
                    </div>
                )}

                {/* Block Renderer */}
                <div className="p-2">
                    {block.type === 'header' && (
                        <HeaderBlock 
                            content={block.content} 
                            isDark={isDark} 
                            isEditing={editingBlock === index} 
                            updateBlock={(newContent: any) => updateBlock(index, newContent)} 
                        />
                    )}

                    {block.type === 'chapter_header' && (
                        <ChapterHeaderBlock 
                            content={block.content} 
                            isDark={isDark} 
                            isEditing={editingBlock === index} 
                            updateBlock={(newContent: any) => updateBlock(index, newContent)} 
                            index={chapterIndex}
                        />
                    )}

                    {block.type === 'quick_summary' && (
                        <QuickSummaryBlock content={block.content} isDark={isDark} />
                    )}

                    {block.type === 'short_news' && (
                        <ShortNewsBlock content={block.content} isDark={isDark} />
                    )}

                    {(block.type === 'main_story' || block.type === 'image') && (
                        <MainStoryBlock 
                            content={block.content} 
                            isDark={isDark} 
                            isEditing={editingBlock === index} 
                            updateBlock={(newContent: any) => updateBlock(index, newContent)} 
                        />
                    )}

                    {(block.type === 'deep_dive' || block.type === 'text') && (
                        <DeepDiveBlock 
                            content={block.content} 
                            isDark={isDark} 
                            isEditing={editingBlock === index} 
                            updateBlock={(newContent: any) => updateBlock(index, newContent)} 
                            chapterNumber={block.type === 'deep_dive' ? chapterIndex : null}
                        />
                    )}

                    {block.type === 'tool_spotlight' && (
                        <ToolSpotlightBlock content={block.content} isDark={isDark} />
                    )}

                    {block.type === 'bridge' && (
                        <BridgeBlock 
                            content={block.content} 
                            isDark={isDark} 
                            isEditing={editingBlock === index} 
                            updateBlock={(newContent: any) => updateBlock(index, newContent)} 
                        />
                    )}

                    {block.type === 'insight' && (
                        <InsightBlock 
                            content={block.content} 
                            isEditing={editingBlock === index} 
                            updateBlock={(newContent: any) => updateBlock(index, newContent)} 
                        />
                    )}

                    {/* Simple blocks remain inline for now or can be extracted further */}
                    {block.type === 'quote' && (
                        <div className="py-6 px-8 mb-8 text-center">
                            <Quote className="mx-auto mb-4 text-blue-300 opacity-50" size={32} />
                            {editingBlock === index ? (
                                <>
                                    <textarea 
                                        value={block.content.text} 
                                        onChange={(e) => updateBlock(index, { ...block.content, text: e.target.value })}
                                        className={`w-full text-center text-xl italic font-serif bg-transparent border-b border-blue-200 focus:outline-none resize-none mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}
                                    />
                                    <input 
                                        value={block.content.author} 
                                        onChange={(e) => updateBlock(index, { ...block.content, author: e.target.value })}
                                        className={`text-center w-full bg-transparent border-b border-blue-200 focus:outline-none text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                                    />
                                </>
                            ) : (
                                <>
                                    <p className={`text-xl italic font-serif mb-3 leading-relaxed ${isDark ? 'text-white' : 'text-slate-800'}`}>"{block.content.text}"</p>
                                    <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>— {block.content.author}</p>
                                </>
                            )}
                        </div>
                    )}

                    {block.type === 'divider' && (
                        <hr className={`my-8 border-t-2 ${isDark ? 'border-slate-700' : 'border-slate-100'}`} />
                    )}
                </div>
            </div>
        </div>
      )})}
      
      {/* Add Block Button (Bottom) - Popover style */}
      <div className="relative pb-12 text-center">
        <div className="relative inline-block">
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveAddMenu(activeAddMenu === blocks.length - 1 ? null : blocks.length - 1) }}
                className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
                <Plus size={18} /> 블록 추가
            </button>
            {activeAddMenu === blocks.length - 1 && (
                <AddBlockMenu onSelect={(type) => addBlock(blocks.length - 1, type)} onClose={() => setActiveAddMenu(null)} />
            )}
        </div>
      </div>
    </div>
  )
}

function AddBlockMenu({ onSelect, onClose }: { onSelect: (type: string) => void, onClose: () => void }) {
    const menuItems = [
        { type: 'chapter_header', label: '챕터 헤더', icon: Type },
        { type: 'quick_summary', label: '퀵 서머리', icon: BarChart },
        { type: 'short_news', label: '단신 뉴스', icon: Quote },
        { type: 'text', label: '텍스트', icon: Type },
        { type: 'image', label: '이미지', icon: ImageIcon },
        { type: 'bridge', label: '브릿지', icon: Minus },
        { type: 'callout', label: '콜아웃', icon: Info },
        { type: 'divider', label: '구분선', icon: Minus },
        { type: 'button', label: '버튼', icon: LinkIcon },
    ];

    return (
        <>
            <div className="fixed inset-0 z-30" onClick={onClose} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40 bg-white shadow-xl rounded-xl border border-slate-200 p-2 grid grid-cols-2 gap-2 w-64">
                {menuItems.map((item) => (
                    <button
                        key={item.type}
                        onClick={() => onSelect(item.type)}
                        className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        <item.icon size={20} className="mb-1" />
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

'use client'

import { useState } from 'react'
import { Trash, ArrowUp, ArrowDown, Plus, Image as ImageIcon, Type, Link as LinkIcon, Minus, Quote, BarChart, Info } from 'lucide-react'

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
                 type === 'callout' ? { title: '알림', text: '내용을 입력하세요.' } : {}
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

  return (
    <div className={`space-y-6 max-w-2xl mx-auto py-12 px-8 min-h-[800px] shadow-sm transition-colors duration-300 ${themeClass}`}>
      {blocks.map((block, index) => (
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
                className={`relative rounded-xl transition-all ${
                    editingBlock === index 
                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                    : 'hover:ring-1 hover:ring-slate-300 hover:ring-offset-2'
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
                    {/* Header Block */}
                    {block.type === 'header' && (
                        <div className="text-center py-8 border-b border-slate-200 mb-8">
                            {editingBlock === index ? (
                                <div className="space-y-2">
                                    <input 
                                        value={block.content.title} 
                                        onChange={(e) => updateBlock(index, { ...block.content, title: e.target.value })}
                                        className={`text-3xl font-bold text-center w-full bg-transparent border-b border-blue-200 focus:outline-none pb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
                                    />
                                    <input 
                                        value={block.content.intro} 
                                        onChange={(e) => updateBlock(index, { ...block.content, intro: e.target.value })}
                                        className={`text-center w-full bg-transparent border-b border-blue-200 focus:outline-none pb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{block.content.title}</h1>
                                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{block.content.date} · {block.content.intro}</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Main Story & Image Block */}
                    {(block.type === 'main_story' || block.type === 'image') && (
                        <div className={`rounded-xl overflow-hidden mb-8 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                            <div 
                                className={`aspect-video flex items-center justify-center mb-4 rounded-lg relative overflow-hidden transition-colors ${isDark ? 'bg-slate-700' : 'bg-slate-100'} ${!block.content.image_url ? 'border-2 border-dashed border-slate-300' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const imageUrl = e.dataTransfer.getData('text/plain');
                                    if (imageUrl) {
                                        updateBlock(index, { ...block.content, image_url: imageUrl });
                                    }
                                }}
                            >
                                {block.content.image_url ? (
                                    <img src={block.content.image_url} className="w-full h-full object-cover" alt="Content" />
                                ) : (
                                    <div className="text-center p-4 text-slate-400">
                                        <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
                                        <p className="text-sm font-medium">이미지를 여기에 드래그하세요</p>
                                        <p className="text-xs mt-1 opacity-70">프롬프트: {block.content.image_prompt}</p>
                                    </div>
                                )}
                            </div>

                            {block.type === 'main_story' && (
                                editingBlock === index ? (
                                    <div className="space-y-2">
                                        <input 
                                            value={block.content.title} 
                                            onChange={(e) => updateBlock(index, { ...block.content, title: e.target.value })}
                                            className={`text-2xl font-bold w-full bg-transparent border-b border-blue-200 focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
                                        />
                                        <textarea 
                                            value={block.content.body} 
                                            onChange={(e) => updateBlock(index, { ...block.content, body: e.target.value })}
                                            className={`w-full h-32 bg-transparent border border-blue-200 rounded p-2 focus:outline-none leading-relaxed resize-none ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{block.content.title}</h2>
                                        <p className={`leading-relaxed mb-4 whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{block.content.body}</p>
                                        {block.content.link && (
                                            <a href={block.content.link} className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors">
                                                {block.content.link_text || "자세히 보기"}
                                            </a>
                                        )}
                                    </>
                                )
                            )}
                        </div>
                    )}

                    {/* Deep Dive & Text Block */}
                    {(block.type === 'deep_dive' || block.type === 'text') && (
                        <div className={`p-6 rounded-xl mb-8 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            {block.type === 'deep_dive' && (
                                <div className="flex items-center gap-2 mb-4 text-blue-500 font-bold uppercase text-xs tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Deep Dive
                                </div>
                            )}
                            {editingBlock === index ? (
                                <div className="space-y-2">
                                    {block.type === 'deep_dive' && (
                                        <input 
                                            value={block.content.title} 
                                            onChange={(e) => updateBlock(index, { ...block.content, title: e.target.value })}
                                            className={`text-xl font-bold w-full bg-transparent border-b border-blue-200 focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
                                        />
                                    )}
                                    <textarea 
                                        value={block.content.text || block.content.body} 
                                        onChange={(e) => updateBlock(index, { ...block.content, [block.type === 'text' ? 'text' : 'body']: e.target.value })}
                                        className={`w-full h-48 bg-transparent border border-blue-200 rounded p-2 focus:outline-none leading-relaxed resize-none ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                                    />
                                </div>
                            ) : (
                                <>
                                    {block.type === 'deep_dive' && <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{block.content.title}</h3>}
                                    <div className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{block.content.text || block.content.body}</div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Tool Spotlight Block */}
                    {block.type === 'tool_spotlight' && (
                        <div className={`flex gap-4 p-4 rounded-xl mb-8 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-indigo-500 uppercase mb-1">Tool Spotlight</h4>
                                <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{block.content.name}</h3>
                                <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{block.content.description}</p>
                                <a href={block.content.link} className="text-sm font-medium text-indigo-600 hover:underline">사용해보기 →</a>
                            </div>
                        </div>
                    )}

                    {/* Quick Hits Block */}
                    {block.type === 'quick_hits' && (
                        <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                                {block.content.title}
                            </h3>
                            <ul className="space-y-3">
                                {block.content.items?.map((item: any, i: number) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-blue-500 font-bold">•</span>
                                        {editingBlock === index ? (
                                            <input 
                                                value={item.text}
                                                onChange={(e) => {
                                                    const newItems = [...block.content.items]
                                                    newItems[i] = { ...item, text: e.target.value }
                                                    updateBlock(index, { ...block.content, items: newItems })
                                                }}
                                                className={`bg-transparent border-b border-blue-200 focus:outline-none w-full ${isDark ? 'text-white' : 'text-slate-700'}`}
                                            />
                                        ) : (
                                            <a href={item.link} className={`hover:text-blue-600 hover:underline transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                {item.text}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Quote Block */}
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

                    {/* Stat Box Block */}
                    {block.type === 'stat_box' && (
                        <div className={`p-6 rounded-xl mb-8 flex items-center justify-between border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
                            <div>
                                <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{block.content.label}</h4>
                                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{block.content.description}</p>
                            </div>
                            <div className="text-4xl font-black text-blue-600 tracking-tighter">
                                {block.content.value}
                            </div>
                        </div>
                    )}

                    {/* Callout Block */}
                    {block.type === 'callout' && (
                        <div className={`p-4 rounded-lg mb-8 flex gap-3 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-yellow-50 border border-yellow-100'}`}>
                            <Info className={`shrink-0 ${isDark ? 'text-blue-400' : 'text-yellow-600'}`} />
                            <div>
                                {editingBlock === index ? (
                                    <>
                                        <input 
                                            value={block.content.title}
                                            onChange={(e) => updateBlock(index, { ...block.content, title: e.target.value })}
                                            className={`font-bold w-full bg-transparent border-b border-blue-200 focus:outline-none mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
                                        />
                                        <textarea 
                                            value={block.content.text}
                                            onChange={(e) => updateBlock(index, { ...block.content, text: e.target.value })}
                                            className={`w-full bg-transparent border-b border-blue-200 focus:outline-none resize-none ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{block.content.title}</h4>
                                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{block.content.text}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Insight Block */}
                    {block.type === 'insight' && (
                        <div className="border-l-4 border-blue-500 pl-6 py-2 mb-8 bg-blue-50 rounded-r-lg">
                            <h3 className="font-bold text-blue-800 mb-1">💡 Insight</h3>
                            {editingBlock === index ? (
                                <textarea 
                                    value={block.content.text} 
                                    onChange={(e) => updateBlock(index, { ...block.content, text: e.target.value })}
                                    className="w-full bg-transparent border-b border-blue-200 focus:outline-none text-blue-900 leading-relaxed resize-none"
                                />
                            ) : (
                                <p className="text-blue-900 italic leading-relaxed">{block.content.text}</p>
                            )}
                        </div>
                    )}

                    {/* Button Block */}
                    {block.type === 'button' && (
                        <div className="text-center mb-8">
                            {editingBlock === index ? (
                                <div className="space-y-2">
                                    <input 
                                        value={block.content.text} 
                                        onChange={(e) => updateBlock(index, { ...block.content, text: e.target.value })}
                                        className="text-center bg-transparent border-b border-blue-200 focus:outline-none"
                                        placeholder="버튼 텍스트"
                                    />
                                    <input 
                                        value={block.content.link} 
                                        onChange={(e) => updateBlock(index, { ...block.content, link: e.target.value })}
                                        className="text-center text-sm text-slate-400 bg-transparent border-b border-blue-200 focus:outline-none"
                                        placeholder="링크 URL"
                                    />
                                </div>
                            ) : (
                                <a href={block.content.link} className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-md">
                                    {block.content.text}
                                </a>
                            )}
                        </div>
                    )}

                    {/* Divider Block */}
                    {block.type === 'divider' && (
                        <hr className={`my-8 border-t-2 ${isDark ? 'border-slate-700' : 'border-slate-100'}`} />
                    )}
                </div>
            </div>
        </div>
      ))}
      
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
        { type: 'text', label: '텍스트', icon: Type },
        { type: 'image', label: '이미지', icon: ImageIcon },
        { type: 'quote', label: '인용구', icon: Quote },
        { type: 'stat_box', label: '통계', icon: BarChart },
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

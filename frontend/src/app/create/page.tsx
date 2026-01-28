'use client'

import { useState, useRef } from 'react'
import BlockEditor from '@/components/BlockEditor'
import { exportToHtml } from '@/lib/html-exporter'
import { Loader2, Send, ChevronLeft, ChevronRight, Image as ImageIcon, FileText, Layout, Eye, X, Download } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// 템플릿 정의
const TEMPLATES = [
  { id: 'modern', name: '모던', color: 'bg-slate-100', style: 'font-sans' },
  { id: 'classic', name: '클래식', color: 'bg-[#fdfbf7]', style: 'font-serif' },
  { id: 'dark', name: '다크모드', color: 'bg-slate-900', style: 'font-sans' },
]

export default function CreatePage() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('professional')
  const [modelType, setModelType] = useState('gemini') // 'gemini' | 'gpt'
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [publishStatus, setPublishStatus] = useState('')
  
  // UI 상태
  const [showSources, setShowSources] = useState(true)
  const [showTemplates, setShowTemplates] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState('modern')
  const [showPreview, setShowPreview] = useState(false)

  const handleGenerate = async () => {
    if (!topic) return
    setLoading(true)
    setGeneratedContent(null)
    setPublishStatus('')
    
    // 단계별 메시지 업데이트 시뮬레이션 (Playwright 수집 단계 반영)
    const steps = [
      { step: 10, message: '주제를 분석하여 리서치 키워드를 생성 중입니다...' },
      { step: 20, message: '웹 전반에서 최신 관련 자료를 검색하고 있습니다...' },
      { step: 40, message: 'Playwright 브라우저를 실행하여 각 기사의 고품질 이미지를 정밀 추출 중입니다...' },
      { step: 60, message: '수집된 이미지의 해상도와 유효성을 지능형으로 검증하고 있습니다...' },
      { step: 75, message: 'AI 에디터가 수집된 자료를 분석하여 뉴스레터 초안을 작성 중입니다...' },
      { step: 90, message: '블록별로 최적의 이미지를 매핑하고 레이아웃을 정리 중입니다...' },
      { step: 98, message: '최종 결과물을 생성하고 있습니다...' },
    ]

    let currentStepIdx = 0
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setLoadingStep(steps[currentStepIdx].step)
        setLoadingMessage(steps[currentStepIdx].message)
        currentStepIdx++
      }
    }, 2500)

    try {
      setLoadingStep(10)
      setLoadingMessage('AI 뉴스레터 생성을 시작합니다...')

      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, model_type: modelType }),
      })
      
      if (!response.ok) {
        throw new Error('생성에 실패했습니다')
      }
      
      const data = await response.json()
      clearInterval(interval)
      setLoadingStep(100)
      setLoadingMessage('생성이 완료되었습니다!')
      setTimeout(() => setGeneratedContent(data), 500)
    } catch (error) {
      clearInterval(interval)
      console.error(error)
      alert('뉴스레터 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!generatedContent || !generatedContent.blocks) return
    setPublishStatus('발행 중...')
    
    // 템플릿이 적용된 실제 HTML 생성
    const htmlContent = exportToHtml(generatedContent.blocks, activeTemplate)

    try {
      const response = await fetch(`${API_BASE_URL}/api/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedContent.title,
          html: htmlContent
        }),
      })

      if (!response.ok) {
        throw new Error('발행에 실패했습니다')
      }
      
      setPublishStatus('스티비로 성공적으로 발행되었습니다!')
    } catch (error) {
        console.error(error)
        setPublishStatus('발행에 실패했습니다')
    }
  }

  const handleDownload = () => {
    if (!generatedContent || !generatedContent.blocks) return
    
    const html = exportToHtml(generatedContent.blocks, activeTemplate)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 생성 전 입력 폼
  if (!generatedContent) {
    return (
        <div className="p-8 max-w-5xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">뉴스레터 제작</h1>
        </header>
        
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">주제</label>
                        <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="주제를 입력하세요 (예: 2026 AI 트렌드)"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                        disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">어투 및 스타일</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'professional', label: '전문적인', desc: '격식 있고 권위 있는' },
                                { id: 'friendly', label: '친근한', desc: '따뜻하고 접근하기 쉬운' },
                                { id: 'witty', label: '재치있는', desc: '재미있고 활기찬' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTone(t.id)}
                                    className={`p-4 rounded-lg border text-left transition-all ${
                                        tone === t.id 
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="font-medium text-slate-900">{t.label}</div>
                                    <div className="text-xs text-slate-500">{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">AI 모델 선택</label>
                    <div className="flex gap-4">
                        {[
                            { id: 'gemini', label: 'Gemini 2.5 Flash', desc: '초고속 및 멀티모달 최적화' },
                            { id: 'gpt', label: 'GPT-4o', desc: '논리적이고 자연스러운 문장' }
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setModelType(m.id)}
                                className={`flex-1 p-4 rounded-lg border text-left transition-all ${
                                    modelType === m.id 
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="font-medium text-slate-900">{m.label}</div>
                                <div className="text-xs text-slate-500">{m.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                    {loading ? (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={16} /> {loadingMessage}
                                </span>
                                <span className="text-sm font-bold text-blue-700">{loadingStep}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                <div 
                                    className="bg-blue-600 h-full transition-all duration-700 ease-out" 
                                    style={{ width: `${loadingStep}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleGenerate}
                            disabled={!topic}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all shadow-sm active:scale-[0.98]"
                        >
                            <Sparkles size={20} /> 뉴스레터 생성하기
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
  }

  // 생성 후 3단 레이아웃 에디터
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Preview Modal */}
        {showPreview && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Eye size={18} /> 이메일 미리보기
                        </h3>
                        <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
                        {/* Preview Content Reuse BlockEditor (Read-only ideally, but using interactive for now) */}
                        <div className="bg-white shadow-lg min-h-[600px] pointer-events-none select-none transform scale-90 origin-top">
                             <BlockEditor 
                                initialBlocks={generatedContent.blocks}
                                onChange={() => {}} // Read-only in preview
                                template={activeTemplate}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Left Panel: Sources & Images */}
        <div className={`transition-all duration-300 border-r border-slate-200 bg-white flex flex-col ${showSources ? 'w-80' : 'w-0 overflow-hidden'}`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <FileText size={18} /> 자료 및 이미지
                </h2>
                <button onClick={() => setShowSources(false)} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {/* Sources & Grouped Images Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-1">
                        <FileText size={14} /> 소스별 이미지 라이브러리
                    </h3>
                    
                    <div className="space-y-6">
                        {generatedContent.sources && generatedContent.sources.length > 0 ? (
                            generatedContent.sources.map((source: any, sIdx: number) => (
                                <div key={sIdx} className="space-y-3">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-2 mb-2">
                                            <div className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">S{sIdx + 1}</div>
                                            <a href={source.url} target="_blank" rel="noreferrer" className="text-[11px] leading-tight font-semibold text-slate-800 hover:text-blue-600 hover:underline line-clamp-2">
                                                {source.title || "제목 없음"}
                                            </a>
                                        </div>
                                        
                                        {/* Images for this specific source (Optimized Layout) */}
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            {source.associated_images && source.associated_images.length > 0 ? (
                                                source.associated_images.map((img: string, iIdx: number) => (
                                                    <div 
                                                        key={iIdx} 
                                                        draggable 
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('text/plain', img);
                                                            e.dataTransfer.effectAllowed = 'copy';
                                                        }}
                                                        className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-100 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 transition-all group relative"
                                                    >
                                                        <img src={img} alt={`Img ${iIdx}`} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                                            <span className="text-[9px] text-white font-bold tracking-tighter">DRAG</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-3 text-[10px] text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">No images found</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">수집된 자료가 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* Global Image Pool (Fallback) */}
                {generatedContent.images && generatedContent.images.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                            <ImageIcon size={14} /> 전체 이미지 풀
                        </h3>
                        <div className="grid grid-cols-4 gap-1.5">
                            {generatedContent.images.map((img: string, idx: number) => (
                                <div 
                                    key={idx} 
                                    draggable 
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', img);
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                    className="aspect-square bg-slate-100 rounded border border-slate-200 cursor-move hover:ring-1 hover:ring-blue-300 transition-all"
                                >
                                    <img src={img} alt={`Global ${idx}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Center Panel: Editor */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Toggle Buttons */}
            {!showSources && (
                <button 
                    onClick={() => setShowSources(true)} 
                    className="absolute left-4 top-4 z-20 bg-white p-2 rounded-full shadow border border-slate-200 text-slate-500 hover:text-slate-800"
                >
                    <ChevronRight size={18} />
                </button>
            )}
            {!showTemplates && (
                <button 
                    onClick={() => setShowTemplates(true)} 
                    className="absolute right-4 top-4 z-20 bg-white p-2 rounded-full shadow border border-slate-200 text-slate-500 hover:text-slate-800"
                >
                    <ChevronLeft size={18} />
                </button>
            )}

            {/* Editor Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
                <button 
                    onClick={() => setGeneratedContent(null)}
                    className="text-slate-500 hover:text-slate-800 font-medium text-sm"
                >
                    ← 처음으로
                </button>
                <div className="flex items-center gap-3">
                    {publishStatus && (
                        <span className={`text-sm font-medium ${
                            publishStatus.includes('성공') ? 'text-green-600' : 'text-blue-600'
                        }`}>
                            {publishStatus}
                        </span>
                    )}
                    <button 
                        onClick={handleDownload}
                        className="text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium text-sm transition-colors"
                    >
                        <Download size={18} /> HTML 다운로드
                    </button>
                    <button 
                        onClick={() => setShowPreview(true)}
                        className="text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium text-sm transition-colors"
                    >
                        <Eye size={18} /> 미리보기
                    </button>
                    <button 
                        onClick={handlePublish}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium text-sm shadow-sm transition-colors"
                    >
                        <Send size={16} /> 발행하기
                    </button>
                </div>
            </div>

            {/* Editor Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
                <div className={`w-full max-w-2xl bg-white shadow-lg min-h-[800px] transition-all duration-300 ${
                    activeTemplate === 'modern' ? 'rounded-xl' : activeTemplate === 'classic' ? 'rounded-none' : 'rounded-sm border-2 border-black'
                }`}>
                    {generatedContent.blocks ? (
                        <BlockEditor 
                            initialBlocks={generatedContent.blocks}
                            onChange={(newBlocks) => setGeneratedContent({ ...generatedContent, blocks: newBlocks })}
                            template={activeTemplate}
                        />
                    ) : (
                        <div className="p-10 text-center text-slate-400">
                            블록 데이터를 불러올 수 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Panel: Templates */}
        <div className={`transition-all duration-300 border-l border-slate-200 bg-white flex flex-col ${showTemplates ? 'w-72' : 'w-0 overflow-hidden'}`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Layout size={18} /> 템플릿
                </h2>
                <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-slate-600">
                    <ChevronRight size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {TEMPLATES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTemplate(t.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all group relative overflow-hidden ${
                            activeTemplate === t.id 
                            ? 'border-blue-500 ring-2 ring-blue-100' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <div className={`h-24 w-full mb-3 rounded-lg ${t.color} flex items-center justify-center text-slate-400`}>
                            <div className={`w-3/4 h-3/4 bg-white shadow-sm p-2 text-[8px] overflow-hidden ${t.style}`}>
                                <div className="h-2 w-1/2 bg-slate-200 mb-2 rounded-sm" />
                                <div className="space-y-1">
                                    <div className="h-1 w-full bg-slate-100 rounded-sm" />
                                    <div className="h-1 w-full bg-slate-100 rounded-sm" />
                                    <div className="h-1 w-3/4 bg-slate-100 rounded-sm" />
                                </div>
                            </div>
                        </div>
                        <span className="font-medium text-slate-800">{t.name}</span>
                        {activeTemplate === t.id && (
                            <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    </div>
  )
}
import { Sparkles } from 'lucide-react'
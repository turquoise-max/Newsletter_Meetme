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
    
    // 단계별 메시지 업데이트 시뮬레이션
    const steps = [
      { step: 10, message: '주제를 분석하여 세부 리서치 키워드를 생성 중입니다...' },
      { step: 30, message: '다각도에서 최신 관련 자료를 수집하고 있습니다...' },
      { step: 50, message: '수집된 아티클의 연관성을 분석하고 정제 중입니다...' },
      { step: 70, message: '수석 편집장이 핵심 테마를 설정하고 있습니다...' },
      { step: 85, message: '뉴스레터 본문 블록을 생성하고 이미지를 매핑 중입니다...' },
      { step: 95, message: '최종 결과물을 정리하고 있습니다...' },
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
    if (!generatedContent) return
    setPublishStatus('발행 중...')
    
    const htmlBody = JSON.stringify(generatedContent.blocks)

    try {
      const response = await fetch(`${API_BASE_URL}/api/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedContent.title,
          html_body: htmlBody
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
                            { id: 'gemini', label: 'Gemini 2.0 Flash', desc: '빠르고 최신 정보에 강함' },
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
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Images Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                        <ImageIcon size={14} /> 수집된 이미지
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {generatedContent.images && generatedContent.images.length > 0 ? (
                            generatedContent.images.map((img: string, idx: number) => (
                                <div 
                                    key={idx} 
                                    draggable 
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', img);
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                    className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-move hover:ring-2 hover:ring-blue-400 transition-all relative group"
                                >
                                    <img src={img} alt={`Source ${idx}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs text-white font-medium bg-black/50 px-2 py-1 rounded">드래그</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 col-span-2 text-center py-4">이미지가 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* Sources Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                        <FileText size={14} /> 참고 아티클
                    </h3>
                    <div className="space-y-3">
                        {generatedContent.sources && generatedContent.sources.length > 0 ? (
                            generatedContent.sources.map((source: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                                    <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline line-clamp-1 block mb-1">
                                        {source.title || "제목 없음"}
                                    </a>
                                    <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                                        {source.content || "내용 없음"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">참고 자료가 없습니다.</p>
                        )}
                    </div>
                </div>
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
import Link from 'next/link'
import { ArrowRight, PenTool, Sparkles } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">대시보드</h1>
        <p className="text-slate-500">환영합니다! 오늘도 멋진 뉴스레터를 만들어보세요.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 제작 카드 */}
        <Link href="/create" className="group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-500 transition-all cursor-pointer h-full">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <PenTool size={24} />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">새 뉴스레터 만들기</h2>
            <p className="text-slate-500 mb-4">AI 기반 콘텐츠 생성으로 새로운 초안을 시작하세요.</p>
            <div className="flex items-center text-blue-600 font-medium">
              제작 시작하기 <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* 통계 카드 (예시) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
          <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">주간 요약</h2>
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-slate-500">생성됨</span>
                <span className="font-bold text-slate-800">12</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-slate-500">발행됨</span>
                <span className="font-bold text-slate-800">8</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

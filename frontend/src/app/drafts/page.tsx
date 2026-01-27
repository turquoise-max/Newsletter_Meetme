'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Calendar, ArrowRight } from 'lucide-react'

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDrafts() {
      if (!supabase) return
      
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching drafts:', error)
      } else {
        setDrafts(data || [])
      }
      setLoading(false)
    }

    fetchDrafts()
  }, [])

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">보관함</h1>
        <p className="text-slate-500">제작된 뉴스레터를 관리하세요.</p>
      </header>

      {loading ? (
        <div className="text-center py-12 text-slate-500">초안 로딩 중...</div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">보관된 초안이 없습니다</h3>
          <p className="text-slate-500">첫 번째 뉴스레터를 만들어보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold uppercase">
                  {draft.status}
                </div>
                <div className="text-slate-400 text-sm flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(draft.created_at).toLocaleDateString()}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">{draft.topic}</h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                 {draft.title || "제목 없음"}
              </p>
              <button className="w-full mt-auto flex items-center justify-center gap-2 text-blue-600 font-medium hover:bg-blue-50 py-2 rounded-lg transition-colors">
                에디터 열기 <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

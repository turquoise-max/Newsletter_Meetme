'use client'

import { Save, User, Key } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">설정</h1>
        <p className="text-slate-500">계정 정보와 API 키를 관리하세요.</p>
      </header>

      <div className="space-y-8">
        {/* 계정 섹션 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <User size={24} />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">계정 프로필</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">이름</label>
                    <input type="text" className="w-full p-3 border border-slate-300 rounded-lg" defaultValue="관리자" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">이메일 주소</label>
                    <input type="email" className="w-full p-3 border border-slate-300 rounded-lg" defaultValue="admin@example.com" disabled />
                </div>
            </div>
        </div>

        {/* API 키 섹션 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Key size={24} />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">API 설정</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gemini API 키</label>
                    <input type="password" className="w-full p-3 border border-slate-300 rounded-lg font-mono text-sm" placeholder="sk-..." />
                    <p className="text-xs text-slate-500 mt-1">AI 콘텐츠 생성에 사용됩니다.</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tavily API 키</label>
                    <input type="password" className="w-full p-3 border border-slate-300 rounded-lg font-mono text-sm" placeholder="tvly-..." />
                    <p className="text-xs text-slate-500 mt-1">웹 검색 및 문맥 수집에 사용됩니다.</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Stibee API 키</label>
                    <input type="password" className="w-full p-3 border border-slate-300 rounded-lg font-mono text-sm" placeholder="STIBEE-..." />
                    <p className="text-xs text-slate-500 mt-1">이메일 발행에 사용됩니다.</p>
                </div>
            </div>
        </div>

        <div className="flex justify-end">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
                <Save size={20} /> 변경사항 저장
            </button>
        </div>
      </div>
    </div>
  )
}

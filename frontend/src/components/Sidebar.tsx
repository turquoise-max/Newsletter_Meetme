'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  PenTool, 
  FileText, 
  Settings, 
  LogOut 
} from 'lucide-react'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/create', label: '뉴스레터 제작', icon: PenTool },
  { href: '/drafts', label: '보관함', icon: FileText },
  { href: '/settings', label: '설정', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-screen w-64 bg-slate-900 text-white border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          뉴스레터 AI
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <LogOut size={20} />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>
    </div>
  )
}

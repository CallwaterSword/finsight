import { TrendingUp, Search, BarChart3, Wallet, LayoutDashboard } from 'lucide-react'

type Tab = 'dashboard' | 'screener' | 'portfolio'

interface NavbarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const TABS: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: '行情总览', icon: LayoutDashboard },
  { id: 'screener', label: '智能选股', icon: Search },
  { id: 'portfolio', label: '投资组合', icon: Wallet },
]

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white tracking-tight">FinSight</span>
              <span className="hidden sm:inline ml-2 text-xs text-gray-500 font-medium">智能投研平台</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-900/80 rounded-lg p-1 border border-gray-800/50">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
            <span className="hidden sm:inline">已连接</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { 
  LayoutDashboard, Users, QrCode, Calendar, FileText, 
  Settings, LogOut, Menu, X, AlertTriangle, ClipboardList, ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const Layout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['admin', 'manager', 'employee'] },
    { path: '/qr-display', icon: QrCode, label: 'QR Code Live', roles: ['admin', 'manager'] },
    { path: '/employees', icon: Users, label: 'Employés', roles: ['admin', 'manager'] },
    { path: '/attendance', icon: ClipboardList, label: 'Présences', roles: ['admin', 'manager'] },
    { path: '/my-attendance', icon: Calendar, label: 'Mes pointages', roles: ['employee', 'manager', 'admin'] },
    { path: '/leaves', icon: FileText, label: 'Congés', roles: ['admin', 'manager', 'employee'] },
    { path: '/disciplinary', icon: AlertTriangle, label: 'Discipline', roles: ['admin', 'manager', 'employee'] },
    { path: '/settings', icon: Settings, label: 'Paramètres', roles: ['admin'] },
  ]

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <div className="min-h-screen mesh-bg grain-bg flex">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed lg:sticky top-0 left-0 h-screen w-72 z-40 bg-ink-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col"
          >
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-accent-lime rounded-xl flex items-center justify-center font-bold text-ink-950 text-xl">
                    P
                  </div>
                  <div className="absolute -inset-1 bg-accent-lime/30 rounded-xl blur-md group-hover:blur-lg transition-all -z-10" />
                </div>
                <div>
                  <div className="font-display text-xl font-bold tracking-tight">PointCheck</div>
                  <div className="font-mono text-[10px] uppercase text-white/40 tracking-wider">v1.0 — Beta</div>
                </div>
              </Link>
            </div>

            {/* User info */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center font-bold uppercase text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{user?.first_name} {user?.last_name}</div>
                  <div className="text-xs text-white/50 capitalize">{user?.role_display || user?.role}</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                      isActive
                        ? 'bg-accent-lime text-ink-950 font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-sm">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={16} className="ml-auto" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-accent-coral hover:bg-accent-coral/10 transition-all"
              >
                <LogOut size={18} />
                <span className="text-sm">Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-ink-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="font-display font-bold">PointCheck</div>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout

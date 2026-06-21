import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, UserCheck, Clock, TrendingUp, Calendar, 
  AlertTriangle, ArrowUpRight, Activity
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts'
import { reportsAPI, attendanceAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import AIAssistant from '../components/AIAssistant'
import HRSynthesis from '../components/HRSynthesis'

const StatCard = ({ icon: Icon, label, value, trend, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card p-6 relative overflow-hidden group cursor-default"
  >
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color}/10 border ${color}/20 flex items-center justify-center`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        {trend && (
          <span className={`badge ${trend > 0 ? 'badge-success' : 'badge-warning'}`}>
            <ArrowUpRight size={12} />
            {trend}%
          </span>
        )}
      </div>
      <div className="font-mono text-xs text-white/50 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-4xl font-bold">{value}</div>
    </div>
  </motion.div>
)

const DashboardPage = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [todayLive, setTodayLive] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh toutes les 30s
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, liveRes] = await Promise.all([
        reportsAPI.dashboard(),
        attendanceAPI.todayLive(),
      ])
      setStats(statsRes.data)
      setTodayLive(liveRes.data.results || liveRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="shimmer h-32 rounded-2xl" />
        ))}
      </div>
    )
  }

  const isEmployee = user?.role === 'employee'
  const today = new Date()

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">
          {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold mb-2">
          Bonjour, <span className="heading-display text-accent-lime">{user?.first_name}</span> 👋
        </h1>
        <p className="text-white/50">
          {isEmployee ? 'Voici votre aperçu personnel' : "Voici l'état de votre entreprise en temps réel"}
        </p>
      </motion.div>

      {!isEmployee && stats && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard 
              icon={Users} label="Total employés" value={stats.total_employees} 
              color="bg-accent-violet" delay={0.05} 
            />
            <StatCard 
              icon={UserCheck} label="Présents aujourd'hui" value={stats.today.present} 
              color="bg-accent-lime" delay={0.1} 
            />
            <StatCard 
              icon={Clock} label="Retards" value={stats.today.late} 
              color="bg-accent-coral" delay={0.15} 
            />
            <StatCard 
              icon={TrendingUp} label="Taux présence" value={`${stats.today.attendance_rate}%`} 
              color="bg-accent-cyan" delay={0.2} 
            />
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.25 }}
              className="card p-6 lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-mono text-xs text-white/50 uppercase mb-1">Tendance hebdomadaire</div>
                  <h3 className="font-display text-xl font-bold">Présences sur 7 jours</h3>
                </div>
                <Activity size={20} className="text-accent-lime" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.trend_7days}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4ff3a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d4ff3a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b4a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff6b4a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1c1c26', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="present" stroke="#d4ff3a" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} />
                  <Area type="monotone" dataKey="late" stroke="#ff6b4a" fillOpacity={1} fill="url(#colorLate)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <div className="font-mono text-xs text-white/50 uppercase mb-1">Par département</div>
              <h3 className="font-display text-xl font-bold mb-6">Aujourd'hui</h3>
              {stats.by_department.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.by_department}
                      dataKey="count"
                      nameKey="user__department__name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {stats.by_department.map((entry, i) => (
                        <Cell key={i} fill={entry.user__department__color || '#7c5cff'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1c1c26', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-white/40 text-sm">
                  Aucune donnée
                </div>
              )}
              <div className="space-y-2 mt-4">
                {stats.by_department.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.user__department__color }} />
                      <span className="text-white/70">{d.user__department__name || 'Sans dept.'}</span>
                    </div>
                    <span className="font-mono text-white/90">{d.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Live activity + Top late */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.35 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-mono text-xs text-white/50 uppercase mb-1">Activité Live</div>
                  <h3 className="font-display text-xl font-bold flex items-center gap-2">
                    Pointages d'aujourd'hui
                    <span className="w-2 h-2 bg-accent-lime rounded-full animate-pulse" />
                  </h3>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayLive.length === 0 ? (
                  <div className="text-center py-12 text-white/40 text-sm">
                    Aucun pointage pour le moment
                  </div>
                ) : todayLive.slice(0, 10).map(record => (
                  <div key={record.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 hover:bg-ink-800 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center font-bold text-sm uppercase">
                      {record.user_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{record.user_name}</div>
                      <div className="text-xs text-white/50">{record.department_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-white/70">
                        {new Date(record.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className={`badge ${record.status === 'late' ? 'badge-warning' : 'badge-success'} text-xs`}>
                        {record.check_type_display}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-mono text-xs text-white/50 uppercase mb-1">Discipline</div>
                  <h3 className="font-display text-xl font-bold">Top retards ce mois</h3>
                </div>
                <AlertTriangle size={20} className="text-accent-coral" />
              </div>
              <div className="space-y-3">
                {stats.top_late_employees.length === 0 ? (
                  <div className="text-center py-12 text-white/40 text-sm">
                    Aucun retard ce mois 🎉
                  </div>
                ) : stats.top_late_employees.map((emp, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50">
                    <div className="font-display text-2xl font-bold text-accent-coral w-8">
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{emp.user__first_name} {emp.user__last_name}</div>
                      <div className="text-xs text-white/50">{emp.late_count} retard{emp.late_count > 1 ? 's' : ''} · {emp.total_minutes} min total</div>
                    </div>
                    <div className="font-mono text-xl font-bold text-accent-coral">
                      {emp.late_count}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Section Analyse IA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="font-mono text-xs text-accent-violet tracking-widest">→ INTELLIGENCE ARTIFICIELLE</div>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              <AIAssistant />
              <HRSynthesis />
            </div>
          </motion.div>
        </>
      )}

      {isEmployee && (
        <EmployeeDashboard userId={user.id} />
      )}
    </div>
  )
}

const EmployeeDashboard = ({ userId }) => {
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    reportsAPI.employee(userId).then(res => setStats(res.data)).catch(console.error)
  }, [userId])

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatCard icon={UserCheck} label="Jours présents" value={stats.month.present_days} color="bg-accent-lime" delay={0.05} />
      <StatCard icon={Clock} label="Retards (mois)" value={stats.month.late_days} color="bg-accent-coral" delay={0.1} />
      <StatCard icon={Calendar} label="Heures totales" value={`${stats.month.total_hours}h`} color="bg-accent-violet" delay={0.15} />
      <StatCard icon={TrendingUp} label="Taux assiduité" value={`${stats.month.attendance_rate}%`} color="bg-accent-cyan" delay={0.2} />
    </div>
  )
}

export default DashboardPage

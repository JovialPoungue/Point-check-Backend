import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { attendanceAPI, reportsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const MyAttendancePage = () => {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      attendanceAPI.myHistory(),
      reportsAPI.employee(user.id),
    ]).then(([recRes, statRes]) => {
      setRecords(recRes.data.results || recRes.data)
      setStats(statRes.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [user])

  const groupedByDate = records.reduce((acc, r) => {
    const date = new Date(r.timestamp).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(r)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">→ MON HISTORIQUE</div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold">
          Mes <span className="heading-display text-accent-lime">pointages</span>
        </h1>
        <p className="text-white/50 mt-2">Historique complet de votre présence</p>
      </div>

      {/* Stats du mois */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
            <CheckCircle2 size={20} className="text-accent-lime mb-3" />
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Présent (mois)</div>
            <div className="font-display text-3xl font-bold">{stats.month.present_days}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
            <Clock size={20} className="text-accent-coral mb-3" />
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Retards</div>
            <div className="font-display text-3xl font-bold">{stats.month.late_days}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
            <Calendar size={20} className="text-accent-violet mb-3" />
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Heures totales</div>
            <div className="font-display text-3xl font-bold">{stats.month.total_hours}<span className="text-lg text-white/50">h</span></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
            <div className="text-accent-cyan text-xl font-mono mb-3">%</div>
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Taux assiduité</div>
            <div className="font-display text-3xl font-bold">{stats.month.attendance_rate}%</div>
          </motion.div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-20 rounded-xl" />)}
        </div>
      ) : Object.keys(groupedByDate).length === 0 ? (
        <div className="card p-12 text-center text-white/40">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          Aucun pointage enregistré
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, recs], idx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="font-mono text-xs text-white/50 uppercase tracking-wider mb-3">
                {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="card p-4 space-y-2">
                {recs.map(r => (
                  <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-ink-800/50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      r.check_type === 'check_in' ? 'bg-accent-lime/15 text-accent-lime' : 
                      r.check_type === 'check_out' ? 'bg-accent-coral/15 text-accent-coral' :
                      'bg-accent-violet/15 text-accent-violet'
                    }`}>
                      {r.check_type === 'check_in' ? '↓' : r.check_type === 'check_out' ? '↑' : '⏸'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{r.check_type_display}</div>
                      {r.minutes_late > 0 && (
                        <div className="text-xs text-accent-coral">+{r.minutes_late}min de retard</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        {new Date(r.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {r.is_within_geofence && r.latitude && (
                        <div className="flex items-center gap-1 text-xs text-white/40">
                          <MapPin size={10} /> Sur site
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyAttendancePage

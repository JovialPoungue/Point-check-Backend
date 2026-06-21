import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Filter, Calendar as CalIcon, Search } from 'lucide-react'
import { attendanceAPI, reportsAPI } from '../services/api'
import toast from 'react-hot-toast'

const AttendancePage = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (filterStatus) params.status = filterStatus
      const res = await attendanceAPI.daily(params)
      setRecords(res.data.results || res.data)
    } catch (e) {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [dateFrom, dateTo, filterStatus])

  const filtered = records.filter(r => 
    !search || r.user_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = async () => {
    try {
      const params = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await reportsAPI.exportExcel(params)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `presences_${dateFrom || 'tout'}_${dateTo || 'tout'}.xlsx`
      a.click()
      toast.success('Export téléchargé')
    } catch (e) {
      toast.error('Erreur export')
    }
  }

  const statusColor = (status) => ({
    present: 'badge-success',
    late: 'badge-warning',
    absent: 'badge-danger',
    on_leave: 'badge-info',
  }[status] || 'badge-info')

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">→ PRÉSENCES</div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold">
            Tous les <span className="heading-display text-accent-lime">pointages</span>
          </h1>
          <p className="text-white/50 mt-2">{filtered.length} enregistrement{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={handleExport} className="btn-primary">
          <Download size={18} /> Export Excel
        </button>
      </div>

      {/* Filtres */}
      <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..." className="input-field pl-11"
          />
        </div>
        <div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" placeholder="De" />
        </div>
        <div>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" placeholder="À" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field">
          <option value="">Tous statuts</option>
          <option value="present">Présent</option>
          <option value="late">Retard</option>
          <option value="absent">Absent</option>
          <option value="on_leave">En congé</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-white/40">
          <CalIcon size={48} className="mx-auto mb-4 opacity-50" />
          Aucun pointage pour cette période
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-800/50 border-b border-white/5">
                <tr>
                  <th className="text-left p-4 heading-mono">Date</th>
                  <th className="text-left p-4 heading-mono">Employé</th>
                  <th className="text-left p-4 heading-mono">Département</th>
                  <th className="text-left p-4 heading-mono">Arrivée</th>
                  <th className="text-left p-4 heading-mono">Sortie</th>
                  <th className="text-left p-4 heading-mono">Heures</th>
                  <th className="text-left p-4 heading-mono">Retard</th>
                  <th className="text-left p-4 heading-mono">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr 
                    key={r.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-ink-800/30 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm">
                      {new Date(r.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center text-xs font-bold uppercase">
                          {r.user_name?.split(' ').map(n => n[0]).slice(0,2).join('')}
                        </div>
                        <span className="text-sm">{r.user_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {r.department_name && (
                        <span className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 rounded-full" style={{ background: r.department_color }} />
                          {r.department_name}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-4 font-mono text-sm">{r.total_hours}h</td>
                    <td className="p-4">
                      {r.minutes_late > 0 ? (
                        <span className="text-accent-coral font-mono text-sm">+{r.minutes_late}min</span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${statusColor(r.status)}`}>{r.status_display}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendancePage

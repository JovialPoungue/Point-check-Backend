import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, FileText, Calendar } from 'lucide-react'
import { attendanceAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const LeavesPage = () => {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await attendanceAPI.leaves()
      setLeaves(res.data.results || res.data)
    } catch (e) {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const filtered = leaves.filter(l => filter === 'all' || l.status === filter)
  const isManager = user?.role !== 'employee'

  const handleApprove = async (id) => {
    try {
      await attendanceAPI.approveLeave(id, '')
      toast.success('Approuvé')
      fetch()
    } catch (e) { toast.error('Erreur') }
  }

  const handleReject = async (id) => {
    const comment = prompt('Motif du refus (optionnel):')
    try {
      await attendanceAPI.rejectLeave(id, comment || '')
      toast.success('Refusé')
      fetch()
    } catch (e) { toast.error('Erreur') }
  }

  const statusBadge = (s) => ({
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-danger',
    cancelled: 'badge-info',
  }[s] || 'badge-info')

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">→ ABSENCES</div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold">
            Demandes de <span className="heading-display text-accent-lime">congés</span>
          </h1>
          <p className="text-white/50 mt-2">{filtered.length} demande{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={18} /> Nouvelle demande
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { val: 'all', label: 'Toutes' },
          { val: 'pending', label: 'En attente' },
          { val: 'approved', label: 'Approuvées' },
          { val: 'rejected', label: 'Refusées' },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === f.val ? 'bg-accent-lime text-ink-950 font-bold' : 'bg-ink-800/50 text-white/60 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-white/40">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          Aucune demande
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center font-bold uppercase text-sm">
                    {l.user_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="font-medium">{l.user_name}</div>
                    <div className="text-xs text-white/50">{l.leave_type_display}</div>
                  </div>
                </div>
                <span className={`badge ${statusBadge(l.status)}`}>{l.status_display}</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="font-mono text-xs text-white/50 uppercase mb-1">Du</div>
                  <div className="font-mono">{new Date(l.start_date).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <div className="font-mono text-xs text-white/50 uppercase mb-1">Au</div>
                  <div className="font-mono">{new Date(l.end_date).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <div className="font-mono text-xs text-white/50 uppercase mb-1">Durée</div>
                  <div className="font-mono">{l.days_count} jour{l.days_count > 1 ? 's' : ''}</div>
                </div>
              </div>

              {l.reason && (
                <div className="p-3 rounded-xl bg-ink-800/50 text-sm text-white/70 mb-3">
                  "{l.reason}"
                </div>
              )}

              {isManager && l.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button onClick={() => handleApprove(l.id)} className="btn-primary flex-1 justify-center text-sm">
                    <Check size={16} /> Approuver
                  </button>
                  <button onClick={() => handleReject(l.id)} className="btn-secondary flex-1 justify-center text-sm">
                    <X size={16} /> Refuser
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <NewLeaveModal onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetch() }} />
        )}
      </AnimatePresence>
    </div>
  )
}

const NewLeaveModal = ({ onClose, onSaved }) => {
  const [data, setData] = useState({
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await attendanceAPI.createLeave(data)
      toast.success('Demande envoyée')
      onSaved()
    } catch (e) {
      toast.error('Erreur')
    } finally { setSaving(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="card max-w-md w-full p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-xs text-accent-lime mb-1 tracking-widest">→ NOUVELLE DEMANDE</div>
            <h2 className="font-display text-2xl font-bold">Demander un congé</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="heading-mono mb-2 block">Type *</label>
            <select value={data.leave_type} onChange={e => setData({...data, leave_type: e.target.value})} className="input-field" required>
              <option value="vacation">Congés payés</option>
              <option value="sick">Maladie</option>
              <option value="personal">Personnel</option>
              <option value="unpaid">Sans solde</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="heading-mono mb-2 block">Du *</label>
              <input type="date" value={data.start_date} onChange={e => setData({...data, start_date: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Au *</label>
              <input type="date" value={data.end_date} onChange={e => setData({...data, end_date: e.target.value})} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="heading-mono mb-2 block">Motif *</label>
            <textarea value={data.reason} onChange={e => setData({...data, reason: e.target.value})} className="input-field min-h-[100px]" required />
          </div>
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default LeavesPage

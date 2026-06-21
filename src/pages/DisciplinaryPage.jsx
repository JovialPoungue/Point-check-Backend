import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, AlertTriangle, X, Check, ShieldCheck } from 'lucide-react'
import { attendanceAPI, usersAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const DisciplinaryPage = () => {
  const { user } = useAuth()
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await attendanceAPI.disciplinary()
      setActions(res.data.results || res.data)
    } catch (e) {
      toast.error('Erreur')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const isManager = user?.role !== 'employee'

  const handleAcknowledge = async (id) => {
    try {
      await attendanceAPI.disciplinary({ id })
      // utiliser l'endpoint dédié
      const api = (await import('../services/api')).default
      await api.post(`/attendance/disciplinary/${id}/acknowledge/`)
      toast.success('Pris en compte')
      fetch()
    } catch (e) { toast.error('Erreur') }
  }

  const severityStyles = {
    low: 'border-yellow-500/30 bg-yellow-500/5',
    medium: 'border-orange-500/30 bg-orange-500/5',
    high: 'border-red-500/30 bg-red-500/5',
  }

  const severityBadge = {
    low: 'badge-warning',
    medium: 'badge-warning',
    high: 'badge-danger',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-accent-coral mb-2 tracking-widest">→ DISCIPLINE</div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold">
            Actions <span className="heading-display text-accent-coral">disciplinaires</span>
          </h1>
          <p className="text-white/50 mt-2">{actions.length} action{actions.length > 1 ? 's' : ''} enregistrée{actions.length > 1 ? 's' : ''}</p>
        </div>
        {isManager && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={18} /> Nouvelle action
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
      ) : actions.length === 0 ? (
        <div className="card p-12 text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-accent-lime opacity-50" />
          <p className="text-white/40">Aucune action disciplinaire — bravo à votre équipe ! 🎉</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {actions.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-5 border ${severityStyles[a.severity]}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    a.severity === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'
                  }`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="font-medium">{a.user_name}</div>
                    <div className="text-xs text-white/50">
                      {a.action_type_display} · Émis par {a.issued_by_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${severityBadge[a.severity]}`}>{a.severity_display}</span>
                  {a.is_acknowledged && (
                    <span className="badge badge-success"><Check size={12} /> Vu</span>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <div className="font-mono text-xs text-white/50 uppercase mb-1">Motif</div>
                <div className="text-sm">{a.reason}</div>
              </div>

              {a.description && (
                <div className="p-3 rounded-xl bg-ink-800/50 text-sm text-white/70 mt-2">
                  {a.description}
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="font-mono text-xs text-white/40">
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                </div>
                {!a.is_acknowledged && a.user === user?.id && (
                  <button onClick={() => handleAcknowledge(a.id)} className="btn-secondary text-xs py-2">
                    J'ai pris connaissance
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <NewActionModal onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetch() }} />
        )}
      </AnimatePresence>
    </div>
  )
}

const NewActionModal = ({ onClose, onSaved }) => {
  const [users, setUsers] = useState([])
  const [data, setData] = useState({
    user: '', action_type: 'warning', severity: 'low',
    reason: '', description: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    usersAPI.list({ role: 'employee' }).then(res => 
      setUsers(res.data.results || res.data)
    )
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await attendanceAPI.createDisciplinary(data)
      toast.success('Action créée')
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
        className="card max-w-lg w-full p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-xs text-accent-coral mb-1 tracking-widest">→ NOUVELLE ACTION</div>
            <h2 className="font-display text-2xl font-bold">Action disciplinaire</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="heading-mono mb-2 block">Employé concerné *</label>
            <select value={data.user} onChange={e => setData({...data, user: e.target.value})} className="input-field" required>
              <option value="">Sélectionner...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.employee_id})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="heading-mono mb-2 block">Type *</label>
              <select value={data.action_type} onChange={e => setData({...data, action_type: e.target.value})} className="input-field">
                <option value="warning">Avertissement</option>
                <option value="notice">Notification</option>
                <option value="suspension">Suspension</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="heading-mono mb-2 block">Sévérité *</label>
              <select value={data.severity} onChange={e => setData({...data, severity: e.target.value})} className="input-field">
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
            </div>
          </div>
          <div>
            <label className="heading-mono mb-2 block">Motif *</label>
            <input type="text" value={data.reason} onChange={e => setData({...data, reason: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="heading-mono mb-2 block">Description détaillée</label>
            <textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} className="input-field min-h-[100px]" />
          </div>
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Envoi...' : 'Émettre'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default DisciplinaryPage

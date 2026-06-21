import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Plus, Search, Edit2, Power, Key, X, 
  Briefcase, Filter, Trash2 
} from 'lucide-react'
import { usersAPI, departmentsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const EmployeesPage = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deptModalOpen, setDeptModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        usersAPI.list(),
        departmentsAPI.list(),
      ])
      setUsers(usersRes.data.results || usersRes.data)
      setDepartments(deptsRes.data.results || deptsRes.data)
    } catch (e) {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = users.filter(u => {
    const matchSearch = !search || 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchDept = !filterDept || u.department === filterDept
    const matchRole = !filterRole || u.role === filterRole
    return matchSearch && matchDept && matchRole
  })

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await usersAPI.delete(id)
      toast.success('Utilisateur supprimé')
      fetchData()
    } catch (e) {
      toast.error('Erreur')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await usersAPI.toggleActive(id)
      toast.success('Statut modifié')
      fetchData()
    } catch (e) {
      toast.error('Erreur')
    }
  }

  const handleResetPassword = async (id) => {
    const password = prompt('Nouveau mot de passe (min 6 caractères):', 'pointcheck123')
    if (!password) return
    try {
      await usersAPI.resetPassword(id, password)
      toast.success('Mot de passe réinitialisé')
    } catch (e) {
      toast.error('Erreur')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">→ ÉQUIPE</div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold">
            Vos <span className="heading-display text-accent-lime">employés</span>
          </h1>
          <p className="text-white/50 mt-2">{users.length} membre{users.length > 1 ? 's' : ''} dans votre équipe</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setDeptModalOpen(true)} className="btn-secondary">
            <Briefcase size={16} /> Départements
          </button>
          <button onClick={() => { setEditingUser(null); setModalOpen(true) }} className="btn-primary">
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, matricule, email..."
            className="input-field pl-11"
          />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="input-field lg:w-56">
          <option value="">Tous les départements</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-field lg:w-48">
          <option value="">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employé</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-white/40">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          Aucun employé trouvé
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-4 flex items-center gap-4 hover:bg-ink-800/80 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center font-bold uppercase flex-shrink-0">
                {u.first_name?.[0]}{u.last_name?.[0]}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{u.full_name}</span>
                  {!u.is_active_employee && <span className="badge badge-danger">Inactif</span>}
                  {u.role === 'admin' && <span className="badge badge-info">Admin</span>}
                  {u.role === 'manager' && <span className="badge badge-info">Manager</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50 mt-1 flex-wrap">
                  <span className="font-mono">{u.employee_id || '—'}</span>
                  <span>·</span>
                  <span>{u.email}</span>
                  {u.department_name && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: u.department_color }} />
                        {u.department_name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleResetPassword(u.id)}
                  className="btn-ghost p-2"
                  title="Réinitialiser MDP"
                >
                  <Key size={16} />
                </button>
                <button 
                  onClick={() => handleToggleActive(u.id)}
                  className="btn-ghost p-2"
                  title="Activer/Désactiver"
                >
                  <Power size={16} className={u.is_active_employee ? 'text-accent-lime' : 'text-accent-coral'} />
                </button>
                <button 
                  onClick={() => { setEditingUser(u); setModalOpen(true) }}
                  className="btn-ghost p-2"
                >
                  <Edit2 size={16} />
                </button>
                {currentUser.id !== u.id && (
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="btn-ghost p-2 hover:text-accent-coral"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <UserModal 
            user={editingUser} 
            departments={departments}
            onClose={() => setModalOpen(false)}
            onSaved={() => { setModalOpen(false); fetchData() }}
          />
        )}
        {deptModalOpen && (
          <DepartmentModal 
            departments={departments}
            onClose={() => setDeptModalOpen(false)}
            onSaved={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const UserModal = ({ user, departments, onClose, onSaved }) => {
  const [data, setData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    password: '',
    role: user?.role || 'employee',
    employee_id: user?.employee_id || '',
    pin_code: user?.pin_code || '',
    phone: user?.phone || '',
    department: user?.department || '',
    contract_type: user?.contract_type || 'full_time',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...data }
      if (!payload.department) payload.department = null
      if (!payload.password) delete payload.password

      if (user) {
        // En modification, le PIN se met à jour via l'action dédiée (stockage hashé).
        const newPin = (payload.pin_code || '').trim()
        delete payload.pin_code
        await usersAPI.update(user.id, payload)
        if (newPin) await usersAPI.setPin(user.id, newPin)
        toast.success('Employé modifié')
      } else {
        await usersAPI.create(payload)
        toast.success('Employé créé')
      }
      onSaved()
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.entries(errors).forEach(([k, v]) => 
          toast.error(`${k}: ${Array.isArray(v) ? v[0] : v}`)
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="card max-w-2xl w-full p-8 my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-xs text-accent-lime mb-1 tracking-widest">
              {user ? '→ MODIFIER' : '→ NOUVEAU'}
            </div>
            <h2 className="font-display text-2xl font-bold">
              {user ? user.full_name : 'Nouvel employé'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="heading-mono mb-2 block">Prénom *</label>
              <input type="text" value={data.first_name} onChange={e => setData({...data, first_name: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Nom *</label>
              <input type="text" value={data.last_name} onChange={e => setData({...data, last_name: e.target.value})} className="input-field" required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="heading-mono mb-2 block">Username *</label>
              <input type="text" value={data.username} onChange={e => setData({...data, username: e.target.value})} className="input-field font-mono" required />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Email</label>
              <input type="email" value={data.email} onChange={e => setData({...data, email: e.target.value})} className="input-field" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="heading-mono mb-2 block">Matricule</label>
              <input type="text" value={data.employee_id} onChange={e => setData({...data, employee_id: e.target.value.toUpperCase()})} className="input-field font-mono uppercase" />
            </div>
            <div>
              <label className="heading-mono mb-2 block">
                Code PIN (4-6 chiffres){user ? <span className="text-white/40 normal-case"> — laisser vide pour conserver</span> : null}
              </label>
              <input type="text" inputMode="numeric" value={data.pin_code} onChange={e => setData({...data, pin_code: e.target.value.replace(/\D/g, '').slice(0,6)})} className="input-field font-mono" maxLength={6} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="heading-mono mb-2 block">Rôle *</label>
              <select value={data.role} onChange={e => setData({...data, role: e.target.value})} className="input-field" required>
                <option value="employee">Employé</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="heading-mono mb-2 block">Département</label>
              <select value={data.department} onChange={e => setData({...data, department: e.target.value})} className="input-field">
                <option value="">Aucun</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="heading-mono mb-2 block">Contrat</label>
              <select value={data.contract_type} onChange={e => setData({...data, contract_type: e.target.value})} className="input-field">
                <option value="full_time">Temps plein</option>
                <option value="part_time">Temps partiel</option>
                <option value="intern">Stagiaire</option>
                <option value="contractor">Prestataire</option>
              </select>
            </div>
          </div>

          <div>
            <label className="heading-mono mb-2 block">Téléphone</label>
            <input type="text" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="input-field" placeholder="+237..." />
          </div>

          {!user && (
            <div>
              <label className="heading-mono mb-2 block">Mot de passe (laisser vide = "pointcheck123")</label>
              <input type="text" value={data.password} onChange={e => setData({...data, password: e.target.value})} className="input-field" placeholder="pointcheck123" />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Enregistrement...' : user ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

const DepartmentModal = ({ departments, onClose, onSaved }) => {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#7c5cff')
  const [list, setList] = useState(departments)

  const refresh = async () => {
    const res = await departmentsAPI.list()
    const d = res.data.results || res.data
    setList(d)
    onSaved()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name) return
    try {
      await departmentsAPI.create({ name, color })
      toast.success('Département créé')
      setName('')
      refresh()
    } catch (e) {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce département ?')) return
    try {
      await departmentsAPI.delete(id)
      toast.success('Supprimé')
      refresh()
    } catch (e) {
      toast.error('Erreur')
    }
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
            <div className="font-mono text-xs text-accent-lime mb-1 tracking-widest">→ DÉPARTEMENTS</div>
            <h2 className="font-display text-2xl font-bold">Gérer les départements</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={20} /></button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Nom du département" className="input-field flex-1"
          />
          <input
            type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-12 h-12 rounded-xl bg-ink-800 border border-white/10 cursor-pointer"
          />
          <button type="submit" className="btn-primary"><Plus size={18} /></button>
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {list.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50">
              <div className="w-4 h-4 rounded" style={{ background: d.color }} />
              <span className="flex-1">{d.name}</span>
              <span className="text-xs text-white/50">{d.employees_count} membres</span>
              <button onClick={() => handleDelete(d.id)} className="btn-ghost p-2 hover:text-accent-coral">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default EmployeesPage

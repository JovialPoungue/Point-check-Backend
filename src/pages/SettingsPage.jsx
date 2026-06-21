import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, MapPin, Clock, Building2, Crosshair } from 'lucide-react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authAPI.myCompany().then(res => {
      setCompany(res.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authAPI.updateCompany({
        name: company.name,
        address: company.address,
        phone: company.phone,
        email: company.email,
        latitude: company.latitude,
        longitude: company.longitude,
        geofence_radius: company.geofence_radius,
        default_start_time: company.default_start_time,
        default_end_time: company.default_end_time,
        late_tolerance_minutes: company.late_tolerance_minutes,
      })
      setCompany(res.data)
      toast.success('Paramètres enregistrés')
    } catch (e) {
      toast.error('Erreur de sauvegarde')
    } finally { setSaving(false) }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Géolocalisation non supportée')
    toast.loading('Localisation...')
    navigator.geolocation.getCurrentPosition(
      pos => {
        toast.dismiss()
        setCompany(c => ({ ...c, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
        toast.success('Position détectée')
      },
      () => { toast.dismiss(); toast.error('Erreur de localisation') }
    )
  }

  if (loading) return <div className="shimmer h-96 rounded-2xl" />
  if (!company) return <div className="text-white/50">Aucune entreprise</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">→ CONFIGURATION</div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold">
          <span className="heading-display text-accent-lime">Paramètres</span> entreprise
        </h1>
        <p className="text-white/50 mt-2">Configurez votre organisation et les règles de pointage</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Infos générales */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Building2 size={20} className="text-accent-lime" />
            <h2 className="font-display text-xl font-bold">Informations générales</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="heading-mono mb-2 block">Nom de l'entreprise</label>
              <input type="text" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="heading-mono mb-2 block">Adresse</label>
              <input type="text" value={company.address || ''} onChange={e => setCompany({...company, address: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Téléphone</label>
              <input type="text" value={company.phone || ''} onChange={e => setCompany({...company, phone: e.target.value})} className="input-field" placeholder="+237..." />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Email</label>
              <input type="email" value={company.email || ''} onChange={e => setCompany({...company, email: e.target.value})} className="input-field" />
            </div>
          </div>
        </motion.section>

        {/* Géolocalisation */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-accent-violet" />
              <h2 className="font-display text-xl font-bold">Géolocalisation du siège</h2>
            </div>
            <button type="button" onClick={detectLocation} className="btn-secondary text-sm">
              <Crosshair size={14} /> Détecter
            </button>
          </div>
          <p className="text-sm text-white/50 mb-4">
            Les pointages ne seront acceptés que depuis cette zone. Le rayon définit la tolérance autour du siège.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="heading-mono mb-2 block">Latitude</label>
              <input type="number" step="any" value={company.latitude || ''} onChange={e => setCompany({...company, latitude: parseFloat(e.target.value)})} className="input-field font-mono" placeholder="4.0511" />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Longitude</label>
              <input type="number" step="any" value={company.longitude || ''} onChange={e => setCompany({...company, longitude: parseFloat(e.target.value)})} className="input-field font-mono" placeholder="9.7679" />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Rayon (mètres)</label>
              <input type="number" value={company.geofence_radius || 100} onChange={e => setCompany({...company, geofence_radius: parseInt(e.target.value)})} className="input-field font-mono" min="10" max="5000" />
            </div>
          </div>
        </motion.section>

        {/* Horaires */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock size={20} className="text-accent-coral" />
            <h2 className="font-display text-xl font-bold">Horaires & Tolérance</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="heading-mono mb-2 block">Heure d'arrivée</label>
              <input type="time" value={company.default_start_time?.slice(0,5)} onChange={e => setCompany({...company, default_start_time: e.target.value})} className="input-field font-mono" />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Heure de départ</label>
              <input type="time" value={company.default_end_time?.slice(0,5)} onChange={e => setCompany({...company, default_end_time: e.target.value})} className="input-field font-mono" />
            </div>
            <div>
              <label className="heading-mono mb-2 block">Tolérance retard (min)</label>
              <input type="number" value={company.late_tolerance_minutes || 5} onChange={e => setCompany({...company, late_tolerance_minutes: parseInt(e.target.value)})} className="input-field font-mono" min="0" max="60" />
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Employés</div>
            <div className="font-display text-2xl font-bold">{company.employees_count}</div>
          </div>
          <div className="card p-4">
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Départements</div>
            <div className="font-display text-2xl font-bold">{company.departments_count}</div>
          </div>
          <div className="card p-4">
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Slug</div>
            <div className="font-mono text-sm">{company.slug}</div>
          </div>
          <div className="card p-4">
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Statut</div>
            <span className="badge badge-success">Actif</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={18} /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SettingsPage

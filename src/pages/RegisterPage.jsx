import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

const RegisterPage = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    company_name: '',
    company_slug: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_username: '',
    admin_password: '',
  })
  const navigate = useNavigate()

  const handleChange = (field) => (e) => {
    let value = e.target.value
    if (field === 'company_slug') {
      value = value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    }
    setData({ ...data, [field]: value })
    if (field === 'company_name' && !data.company_slug) {
      setData(d => ({ ...d, company_slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) {
      if (!data.company_name || !data.company_slug) {
        toast.error('Remplissez tous les champs')
        return
      }
      setStep(2)
      return
    }
    
    setLoading(true)
    try {
      await authAPI.register(data)
      toast.success('Compte créé ! Connectez-vous maintenant.')
      navigate('/login')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.values(errors).forEach(msg => toast.error(Array.isArray(msg) ? msg[0] : msg))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen mesh-bg grain-bg flex items-center justify-center p-4 lg:p-8">
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-accent-coral/15 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 lg:p-10 max-w-2xl w-full relative z-10"
      >
        <Link to="/" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent-lime rounded-xl flex items-center justify-center font-bold text-ink-950">P</div>
          <span className="font-display font-bold text-xl">PointCheck</span>
        </Link>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-accent-lime' : 'text-white/30'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-xs ${
              step >= 1 ? 'border-accent-lime bg-accent-lime text-ink-950' : 'border-white/30'
            }`}>1</div>
            <span className="font-mono text-xs uppercase">Entreprise</span>
          </div>
          <div className={`flex-1 h-px ${step >= 2 ? 'bg-accent-lime' : 'bg-white/10'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-accent-lime' : 'text-white/30'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-xs ${
              step >= 2 ? 'border-accent-lime bg-accent-lime text-ink-950' : 'border-white/30'
            }`}>2</div>
            <span className="font-mono text-xs uppercase">Admin</span>
          </div>
        </div>

        <h2 className="font-display text-3xl font-bold mb-2">
          {step === 1 ? 'Votre entreprise' : 'Compte administrateur'}
        </h2>
        <p className="text-white/50 mb-8">
          {step === 1 ? "Commencez par configurer votre organisation" : "Créez votre identifiant principal"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 ? (
            <>
              <div>
                <label className="heading-mono mb-2 block">Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={data.company_name}
                  onChange={handleChange('company_name')}
                  className="input-field"
                  placeholder="Ex: TechCorp Cameroun"
                  required
                />
              </div>
              <div>
                <label className="heading-mono mb-2 block">Identifiant unique *</label>
                <input
                  type="text"
                  value={data.company_slug}
                  onChange={handleChange('company_slug')}
                  className="input-field font-mono"
                  placeholder="techcorp-cmr"
                  required
                />
                <p className="text-xs text-white/40 mt-1">Lettres, chiffres et tirets uniquement</p>
              </div>
            </>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="heading-mono mb-2 block">Prénom *</label>
                  <input type="text" value={data.admin_first_name} onChange={handleChange('admin_first_name')} className="input-field" required />
                </div>
                <div>
                  <label className="heading-mono mb-2 block">Nom *</label>
                  <input type="text" value={data.admin_last_name} onChange={handleChange('admin_last_name')} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="heading-mono mb-2 block">Email *</label>
                <input type="email" value={data.admin_email} onChange={handleChange('admin_email')} className="input-field" required />
              </div>
              <div>
                <label className="heading-mono mb-2 block">Nom d'utilisateur *</label>
                <input type="text" value={data.admin_username} onChange={handleChange('admin_username')} className="input-field" required />
              </div>
              <div>
                <label className="heading-mono mb-2 block">Mot de passe * (min. 6 car.)</label>
                <input type="password" value={data.admin_password} onChange={handleChange('admin_password')} className="input-field" minLength={6} required />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                Retour
              </button>
            )}
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-4">
              {loading ? 'Création...' : step === 1 ? <>Continuer <ArrowRight size={18} /></> : 'Créer mon compte'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-white/50">
          Déjà un compte ? <Link to="/login" className="text-accent-lime hover:underline">Se connecter</Link>
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterPage

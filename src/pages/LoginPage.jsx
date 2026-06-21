import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
      toast.success('Bienvenue !')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen mesh-bg grain-bg flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-violet/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-lime/15 rounded-full blur-3xl" />

      <div className="relative z-10 grid lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <Link to="/" className="inline-flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-accent-lime rounded-xl flex items-center justify-center font-bold text-ink-950 text-2xl">P</div>
            <span className="font-display font-bold text-2xl">PointCheck</span>
          </Link>

          <h1 className="font-display text-5xl xl:text-6xl font-bold leading-tight mb-6">
            Bon retour.<br />
            <span className="heading-display text-accent-lime">Connectez-vous</span><br />
            à votre espace.
          </h1>

          <p className="text-white/50 text-lg mb-8 max-w-md">
            Accédez à votre tableau de bord et gérez vos équipes en temps réel.
          </p>

          <div className="card p-6 max-w-md">
            <div className="font-mono text-xs text-accent-lime mb-3 tracking-widest">COMPTES DE DÉMO</div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Admin</span>
                <span className="text-white/90">admin / admin123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Manager</span>
                <span className="text-white/90">manager / manager123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Employé</span>
                <span className="text-white/90">emp001 / employee123</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-8 lg:p-10"
        >
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent-lime rounded-xl flex items-center justify-center font-bold text-ink-950">P</div>
            <span className="font-display font-bold text-xl">PointCheck</span>
          </Link>

          <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">→ CONNEXION</div>
          <h2 className="font-display text-3xl font-bold mb-8">Identifiez-vous</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="heading-mono mb-2 block">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="votre.nom"
                required
              />
            </div>

            <div>
              <label className="heading-mono mb-2 block">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-4 text-base disabled:opacity-50"
            >
              {loading ? 'Connexion...' : <>Se connecter <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-white/50">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-accent-lime hover:underline font-medium">
              Créer mon entreprise
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage

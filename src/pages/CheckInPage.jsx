import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, MapPin, Loader2, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { attendanceAPI } from '../services/api'

const CheckInPage = () => {
  const [searchParams] = useSearchParams()
  const companyId = searchParams.get('company')
  const token = searchParams.get('token')
  
  const [step, setStep] = useState('init') // init, form, locating, submitting, success, error
  const [employeeId, setEmployeeId] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [location, setLocation] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!companyId || !token) {
      setError('Lien invalide. Demandez à votre administrateur le QR code à jour.')
      setStep('error')
    } else {
      setStep('form')
    }
  }, [companyId, token])

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return resolve({ latitude: null, longitude: null })
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employeeId.trim()) {
      setError('Saisissez votre matricule')
      return
    }
    
    setStep('locating')
    setError(null)
    
    try {
      const loc = await getLocation()
      setLocation(loc)
      setStep('submitting')
      
      const res = await attendanceAPI.publicCheckIn({
        qr_token: token,
        company_id: companyId,
        employee_id: employeeId.trim(),
        pin_code: pinCode.trim(),
        latitude: loc.latitude,
        longitude: loc.longitude,
        device_info: navigator.userAgent.slice(0, 200),
      })
      
      setResult(res.data)
      setStep('success')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur lors du pointage'
      setError(detail)
      setStep('error')
    }
  }

  const reset = () => {
    setStep('form')
    setError(null)
    setResult(null)
  }

  return (
    <div className="min-h-screen mesh-bg grain-bg flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-violet/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-lime/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-accent-lime rounded-xl flex items-center justify-center font-bold text-ink-950 text-2xl">P</div>
          <span className="font-display font-bold text-2xl">PointCheck</span>
        </Link>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-8"
            >
              <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">→ POINTAGE</div>
              <h1 className="font-display text-3xl font-bold mb-2">Identifiez-vous</h1>
              <p className="text-white/50 mb-8 text-sm">
                Saisissez votre matricule et code PIN pour valider votre pointage.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="heading-mono mb-2 block">Matricule *</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value.toUpperCase())}
                    className="input-field font-mono text-lg uppercase tracking-wider"
                    placeholder="EMP001"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="heading-mono mb-2 block">Code PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pinCode}
                    onChange={e => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field font-mono text-lg tracking-[0.5em] text-center"
                    placeholder="••••"
                    maxLength={6}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-violet/10 border border-accent-violet/20">
                  <MapPin size={16} className="text-accent-violet flex-shrink-0" />
                  <p className="text-xs text-white/70">
                    Votre position sera vérifiée pour confirmer votre présence sur site.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-coral/10 border border-accent-coral/20 text-sm text-accent-coral">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full justify-center py-4 text-base">
                  Valider le pointage <ArrowRight size={18} />
                </button>
              </form>
            </motion.div>
          )}

          {(step === 'locating' || step === 'submitting') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="card p-12 text-center"
            >
              <Loader2 size={48} className="text-accent-lime animate-spin mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">
                {step === 'locating' ? 'Localisation...' : 'Validation...'}
              </h2>
              <p className="text-white/50 text-sm">
                {step === 'locating' ? 'Vérification de votre position' : 'Enregistrement de votre pointage'}
              </p>
            </motion.div>
          )}

          {step === 'success' && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="card p-8 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 diagonal-stripes opacity-20" />
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="inline-flex w-20 h-20 rounded-full bg-accent-lime items-center justify-center mb-6 glow-lime"
                >
                  <CheckCircle2 size={48} className="text-ink-950" strokeWidth={2.5} />
                </motion.div>

                <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">✓ POINTAGE ENREGISTRÉ</div>
                <h2 className="heading-display text-4xl mb-2">Bienvenue,</h2>
                <h3 className="font-display text-2xl font-bold mb-6">{result.user_name}</h3>

                <div className="card p-4 bg-ink-800/50 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <div className="font-mono text-xs text-white/50 uppercase mb-1">Type</div>
                      <div className="font-medium">{result.check_type_display}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs text-white/50 uppercase mb-1">Heure</div>
                      <div className="font-mono">
                        {new Date(result.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

                {result.minutes_late > 0 && (
                  <div className="flex items-center gap-2 justify-center p-3 rounded-xl bg-accent-coral/10 border border-accent-coral/20 mb-4">
                    <Clock size={16} className="text-accent-coral" />
                    <span className="text-sm text-accent-coral">
                      {result.minutes_late} minute{result.minutes_late > 1 ? 's' : ''} de retard
                    </span>
                  </div>
                )}

                <button onClick={reset} className="btn-secondary w-full justify-center mt-4">
                  Nouveau pointage
                </button>
              </div>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="card p-8 text-center"
            >
              <div className="inline-flex w-20 h-20 rounded-full bg-accent-coral/20 border-2 border-accent-coral items-center justify-center mb-6">
                <XCircle size={48} className="text-accent-coral" />
              </div>
              <div className="font-mono text-xs text-accent-coral mb-2 tracking-widest">✗ ERREUR</div>
              <h2 className="font-display text-2xl font-bold mb-3">Pointage refusé</h2>
              <p className="text-white/70 text-sm mb-6">{error}</p>
              <button onClick={reset} className="btn-primary w-full justify-center">
                Réessayer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CheckInPage

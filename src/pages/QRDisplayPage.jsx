import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, RefreshCw, QrCode } from 'lucide-react'
import { attendanceAPI } from '../services/api'
import toast from 'react-hot-toast'

const QRDisplayPage = () => {
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef(null)

  const fetchQR = async () => {

    try {
      const res = await attendanceAPI.getCurrentQR()
      setQrData(res.data)
      setCountdown(res.data.expires_in_seconds)
    } catch (e) {
      toast.error('Erreur de chargement du QR code')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQR()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchQR()        // recharge le QR ; expires_in_seconds mettra à jour le compteur
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setFullscreen(!fullscreen)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="text-accent-lime font-mono">Génération du QR code...</div>
    </div>
  }

  return (
    <div ref={containerRef} className={`${fullscreen ? 'fixed inset-0 z-50 bg-ink-950 mesh-bg p-8' : ''}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="font-mono text-xs text-accent-lime mb-2 tracking-widest">→ QR CODE LIVE</div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold mb-2">
              Pointage <span className="heading-display text-accent-lime">en direct</span>
            </h1>
            <p className="text-white/50">Affichez ce QR à l'entrée — vos employés le scannent pour pointer.</p>
          </div>
          <button onClick={toggleFullscreen} className="btn-secondary">
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            {fullscreen ? 'Quitter' : 'Plein écran'}
          </button>
        </div>

        {/* QR Display */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="card p-8 lg:p-12 relative overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-lime/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-violet/20 rounded-full blur-3xl" />

          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            {/* QR Code */}
            <div className="flex justify-center">
              <motion.div 
                key={qrData?.token}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="bg-white p-6 rounded-3xl glow-lime">
                  <img 
                    src={qrData?.qr_image} 
                    alt="QR Code" 
                    className="w-80 h-80 lg:w-96 lg:h-96"
                  />
                </div>
                
                {/* Countdown ring */}
                <div className="absolute -bottom-6 -right-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="rgba(10,10,15,0.9)" />
                      <circle 
                        cx="50" cy="50" r="45" 
                        stroke={countdown < 10 ? '#ff6b4a' : '#d4ff3a'}
                        strokeWidth="6" fill="none"
                        strokeDasharray={`${(countdown / 60) * 283} 283`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="font-display text-2xl font-bold">{countdown}</div>
                        <div className="font-mono text-[8px] uppercase text-white/50">sec</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Instructions */}
            <div>
              <div className="font-mono text-xs text-accent-lime mb-3 tracking-widest">INSTRUCTIONS</div>
              <h2 className="heading-display text-3xl mb-6">Comment ça marche ?</h2>
              <ol className="space-y-4">
                {[
                  { num: '01', text: "Ouvrez l'appareil photo de votre téléphone" },
                  { num: '02', text: 'Pointez vers le QR code ci-contre' },
                  { num: '03', text: 'Cliquez sur la notification qui apparaît' },
                  { num: '04', text: 'Saisissez votre matricule + code PIN' },
                  { num: '05', text: 'Pointage validé ✓' },
                ].map(step => (
                  <li key={step.num} className="flex gap-4">
                    <div className="font-mono text-accent-lime text-sm font-bold">{step.num}</div>
                    <div className="text-white/80 flex-1">{step.text}</div>
                  </li>
                ))}
              </ol>

              <div className="mt-8 p-4 rounded-xl bg-accent-lime/5 border border-accent-lime/20">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw size={14} className="text-accent-lime animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="font-mono text-xs text-accent-lime uppercase tracking-wider">Sécurité Active</span>
                </div>
                <p className="text-sm text-white/70">
                  Le QR code change toutes les 60 secondes pour empêcher la fraude. 
                  Une capture d'écran ne fonctionnera pas.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info bar */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Entreprise</div>
            <div className="font-medium truncate">{qrData?.company_name}</div>
          </div>
          <div className="card p-4">
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Token actuel</div>
            <div className="font-mono text-xs truncate">{qrData?.token?.slice(0, 12)}...</div>
          </div>
          <div className="card p-4">
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Validité</div>
            <div className="font-medium">{qrData?.validity_seconds} secondes</div>
          </div>
          <div className="card p-4">
            <div className="font-mono text-xs text-white/50 uppercase mb-1">Statut</div>
            <span className="badge badge-success"><span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" /> Actif</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRDisplayPage

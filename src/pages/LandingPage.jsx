import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QrCode, Shield, Zap, BarChart3, ArrowRight, Check } from 'lucide-react'

const LandingPage = () => {
  return (
    <div className="min-h-screen mesh-bg grain-bg overflow-hidden">
      {/* Header */}
      <header className="relative z-20 px-6 lg:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-lime rounded-xl flex items-center justify-center font-bold text-ink-950 text-xl">P</div>
          <span className="font-display font-bold text-xl">PointCheck</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">Connexion</Link>
          <Link to="/register" className="btn-primary">
            Démarrer <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 lg:px-12 pt-12 lg:pt-20 pb-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-lime/10 border border-accent-lime/20 mb-8">
              <span className="w-2 h-2 bg-accent-lime rounded-full animate-pulse" />
              <span className="font-mono text-xs text-accent-lime">PRÉSENCE INTELLIGENTE PAR QR CODE</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8">
              Le pointage,<br />
              <span className="heading-display text-accent-lime">réinventé</span> par<br />
              le QR code.
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12">
              Vos employés scannent. Vous savez tout. Aucune application à installer, 
              aucun matériel coûteux. Juste un QR code et leurs téléphones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register" className="btn-primary text-base px-8 py-4">
                Créer mon entreprise
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-4">
                Tester la démo
              </Link>
            </div>
          </motion.div>

          {/* Mockup illustration */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-20 relative"
          >
            <div className="card max-w-4xl mx-auto p-8 lg:p-12 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-violet/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-lime/10 rounded-full blur-3xl" />
              
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="font-mono text-xs text-accent-lime mb-3 tracking-widest">→ ÉTAPE 01</div>
                  <h3 className="heading-display text-3xl mb-4">Scannez. Pointez. Partez.</h3>
                  <p className="text-white/60 mb-6">
                    L'employé arrive, ouvre son appareil photo, scanne le QR code 
                    affiché à l'entrée, valide son identité — pointage enregistré.
                  </p>
                  <ul className="space-y-2 text-sm">
                    {['QR dynamique anti-fraude', 'Géolocalisation obligatoire', 'Code PIN personnel'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-white/70">
                        <Check size={14} className="text-accent-lime" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-48 h-48 bg-white rounded-2xl p-4 glow-lime">
                      <div className="w-full h-full bg-gradient-to-br from-ink-950 to-ink-800 rounded-lg flex items-center justify-center">
                        <QrCode size={120} className="text-accent-lime" />
                      </div>
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-accent-coral px-3 py-1 rounded-full text-xs font-mono font-bold text-ink-950">
                      LIVE 60s
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 lg:px-12 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="font-mono text-xs text-accent-lime mb-3 tracking-widest">FONCTIONNALITÉS</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold">Tout ce qu'il faut. Rien de superflu.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Sécurité maximale',
                desc: 'QR codes dynamiques qui changent chaque minute, géofencing GPS, codes PIN, IP tracking.',
                color: 'text-accent-lime'
              },
              {
                icon: Zap,
                title: 'Zéro friction',
                desc: 'Aucune app à installer pour vos employés. Le navigateur de leur téléphone suffit.',
                color: 'text-accent-coral'
              },
              {
                icon: BarChart3,
                title: 'Analytics avancés',
                desc: 'Tableaux de bord temps réel, exports Excel, rapports automatisés, alertes de retard.',
                color: 'text-accent-cyan'
              }
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card p-8 card-glow"
                >
                  <Icon size={36} className={`${f.color} mb-4`} />
                  <h3 className="font-display text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-white/60 text-sm">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-4xl mx-auto card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 diagonal-stripes opacity-30" />
          <div className="relative">
            <h2 className="heading-display text-4xl md:text-5xl mb-6">
              Prêt à transformer votre <span className="text-accent-lime not-italic font-display font-bold">gestion de présence ?</span>
            </h2>
            <Link to="/register" className="btn-primary text-base px-8 py-4">
              Créer mon compte gratuitement <ArrowRight size={18} />
            </Link>
            <p className="font-mono text-xs text-white/40 mt-6">
              ✦ Pas de carte bancaire requise &nbsp;·&nbsp; Configuration en 2 minutes
            </p>
          </div>
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-8 border-t border-white/5 text-center text-sm text-white/40">
        © 2026 PointCheck — Conçu pour les entreprises africaines
      </footer>
    </div>
  )
}

export default LandingPage

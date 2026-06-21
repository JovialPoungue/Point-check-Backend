import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, Copy, Download, Check, RefreshCw, Cpu } from 'lucide-react'
import { insightsAPI } from '../services/api'
import toast from 'react-hot-toast'

const fmt = (d) => d.toISOString().slice(0, 10)

const periodRange = (key) => {
  const now = new Date()
  if (key === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { date_from: fmt(start), date_to: fmt(end) }
  }
  // mois en cours par défaut
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { date_from: fmt(start), date_to: fmt(now) }
}

const PERIODS = [
  { key: 'this_month', label: 'Ce mois' },
  { key: 'last_month', label: 'Mois dernier' },
]

const HRSynthesis = () => {
  const [period, setPeriod] = useState('this_month')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await insightsAPI.hrSynthesis(periodRange(period))
      setResult(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!result?.synthesis) return
    await navigator.clipboard.writeText(result.synthesis)
    setCopied(true)
    toast.success('Synthèse copiée')
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    if (!result?.synthesis) return
    const blob = new Blob([result.synthesis], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `synthese-rh-${result.period.debut}_${result.period.fin}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
            <FileText size={18} className="text-accent-cyan" />
          </div>
          <div>
            <div className="font-mono text-xs text-white/50 uppercase tracking-wider">Synthèse RH</div>
            <h3 className="font-display text-lg font-bold">Rapport généré automatiquement</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-ink-800/50 p-1 border border-white/5">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p.key ? 'bg-accent-cyan text-ink-950' : 'text-white/60 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Génération…</>
              : result
                ? <><RefreshCw size={15} /> Régénérer</>
                : <><FileText size={15} /> Générer</>}
          </button>
        </div>
      </div>

      {/* Body */}
      {!result && !loading && (
        <div className="text-center py-12 text-white/40 text-sm">
          Cliquez sur « Générer » pour produire une synthèse RH de la période choisie.
        </div>
      )}

      {loading && !result && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-4 rounded" style={{ width: `${90 - i * 8}%` }} />)}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`badge ${result.source === 'ia' ? 'badge-success' : 'badge-warning'} text-xs`}>
              <Cpu size={12} /> {result.source === 'ia' ? 'Rédigé par IA' : 'Modèle automatique'}
            </span>
            <span className="font-mono text-xs text-white/40">
              {result.period.debut} → {result.period.fin}
            </span>
            <div className="ml-auto flex gap-2">
              <button onClick={copy} className="btn-ghost text-xs px-2 py-1">
                {copied ? <Check size={14} className="text-accent-lime" /> : <Copy size={14} />}
              </button>
              <button onClick={download} className="btn-ghost text-xs px-2 py-1"><Download size={14} /></button>
            </div>
          </div>
          <div className="rounded-xl bg-ink-800/40 border border-white/5 p-5 max-h-[420px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm text-white/85 leading-relaxed">
              {result.synthesis}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default HRSynthesis

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, User, Bot, AlertCircle } from 'lucide-react'
import { insightsAPI } from '../services/api'

const SUGGESTIONS = [
  "Quels employés ont été en retard plus de 3 fois ce mois ?",
  "Quel est le taux de présence par département ?",
  "Résume la ponctualité de l'équipe cette semaine.",
  "Qui a cumulé le plus de minutes de retard ?",
]

const AIAssistant = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [notConfigured, setNotConfigured] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async (question) => {
    const q = (question ?? input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    try {
      const res = await insightsAPI.ask(q)
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }])
    } catch (err) {
      const code = err.response?.data?.code
      if (err.response?.status === 503 || code === 'AI_NOT_CONFIGURED') {
        setNotConfigured(true)
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: "L'assistant IA n'est pas encore activé sur le serveur. Configurez la clé AI_API_KEY pour l'utiliser.",
          error: true,
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: err.response?.data?.detail || "Une erreur est survenue.",
          error: true,
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="card p-6 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center">
            <Sparkles size={18} className="text-accent-violet" />
          </div>
          <div>
            <div className="font-mono text-xs text-white/50 uppercase tracking-wider">Assistant IA</div>
            <h3 className="font-display text-lg font-bold">Posez une question</h3>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <p className="text-white/40 text-sm max-w-xs">
              Interrogez vos données de présence en langage naturel.
            </p>
            <div className="flex flex-col gap-2 w-full">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="text-left text-sm px-4 py-2.5 rounded-xl bg-ink-800/50 hover:bg-ink-800 border border-white/5 text-white/70 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-accent-lime text-ink-950'
                  : m.error ? 'bg-accent-coral/15 text-accent-coral' : 'bg-accent-violet/15 text-accent-violet'
              }`}>
                {m.role === 'user' ? <User size={15} /> : m.error ? <AlertCircle size={15} /> : <Bot size={15} />}
              </div>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'user'
                  ? 'bg-accent-lime/10 text-white rounded-tr-sm'
                  : m.error ? 'bg-accent-coral/10 text-white/90 rounded-tl-sm' : 'bg-ink-800/70 text-white/90 rounded-tl-sm'
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-violet/15 text-accent-violet flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-ink-800/70">
              <Loader2 size={16} className="animate-spin text-accent-violet" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 flex items-end gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={loading || notConfigured}
          placeholder={notConfigured ? "Assistant IA non configuré" : "Votre question…"}
          className="input-field resize-none flex-1 text-sm py-3 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim() || notConfigured}
          className="btn-primary px-4 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  )
}

export default AIAssistant

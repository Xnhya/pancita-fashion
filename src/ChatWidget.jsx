import { useEffect, useRef, useState } from 'react'
import { sendChatMessage } from './api'
import { store } from './data/store'

const BUSINESS_OFFTOPIC_REFUSAL =
  'Solo puedo responder preguntas sobre Pancita Fashion, nuestras prendas de maternidad, catálogo, horarios y pedidos. ¿En qué te puedo asesorar sobre nuestra tienda?'

function isOffTopicQuery(text) {
  const q = (text ?? '').toLowerCase().trim()
  // Operaciones matemáticas como "1+1", "cuanto es 1+1", "uno mas uno"
  if (
    /^\s*\d+\s*[+\-*/xX÷=]\s*\d+/.test(q) ||
    /^(cu[aá]nto\s+es|cu[aá]nto\s+da)\s+(\d+|uno|dos|tres)/i.test(q) ||
    q.includes('uno mas uno') ||
    q.includes('uno más uno') ||
    q.includes('cuanto es 1') ||
    q.includes('cuánto es 1')
  ) {
    return true
  }
  // Consultas ajenas a la tienda
  if (
    q.includes('chiste') ||
    q.includes('poema') ||
    q.startsWith('haz mi tarea') ||
    q.startsWith('quién es el presidente') ||
    q.startsWith('quien es el presidente')
  ) {
    return true
  }
  return false
}

const initialMessages = [{
  role: 'assistant',
  content: `¡Hola! Soy el asistente oficial de ${store.name}. Estoy para responderte exclusivamente sobre nuestras prendas de maternidad, catálogo, tallas, horarios y pedidos en tienda. ¿En qué te puedo asesorar hoy?`,
  welcome: true,
}]

const QUICK_QUESTIONS = [
  '👗 ¿Qué vestidos tienen?',
  '🤱 Ropa de lactancia',
  '📍 ¿Dónde queda la tienda?',
  '🛍️ ¿Cómo comprar y pagar?',
]

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [lastFailedMessage, setLastFailedMessage] = useState(null)
  const endOfMessages = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isOpen, isSending])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function sendQuery(queryText) {
    const content = (queryText ?? '').trim()
    if (!content || isSending) return

    const userMessage = { role: 'user', content }

    if (isOffTopicQuery(content)) {
      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: 'assistant',
          content: BUSINESS_OFFTOPIC_REFUSAL,
        },
      ].slice(-8))
      setInput('')
      return
    }

    const conversation = [...messages.filter((message) => !message.welcome), userMessage]
      .slice(-6)
    if (conversation[0]?.role === 'assistant') conversation.shift()
    const requestMessages = conversation
      .map(({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      }))

    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsSending(true)
    setShowWhatsApp(false)
    setLastFailedMessage(null)

    try {
      const response = await sendChatMessage(requestMessages)
      setMessages((current) => [...current, {
        role: 'assistant',
        content: response.reply,
      }].slice(-8))
      setLastFailedMessage(null)
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        content: error.message,
      }].slice(-8))
      setLastFailedMessage(content)
      setShowWhatsApp(true)
    } finally {
      setIsSending(false)
    }
  }

  function submit(event) {
    event.preventDefault()
    sendQuery(input)
  }

  const phone = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
  const contactMessage = encodeURIComponent(`Hola, ${store.name}. Tengo una consulta sobre la tienda.`)
  const whatsappUrl = `https://wa.me/${phone}?text=${contactMessage}`

  return (
    <aside className="store-chat">
      {isOpen && (
        <section className="store-chat-panel" aria-label="Chat de ayuda">
          <header className="store-chat-header">
            <span className="store-chat-avatar" aria-hidden="true">♡</span>
            <span className="store-chat-title">
              <strong>Ayuda de {store.name}</strong>
              <small>Asistente virtual ágil</small>
            </span>
            <button
              className="store-chat-close"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </header>
          <div className="store-chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <p
                className={`store-chat-message ${message.role === 'user' ? 'from-customer' : 'from-store'}`}
                key={`${index}-${message.role}`}
              >
                {message.content}
              </p>
            ))}
            {isSending && (
              <div className="store-chat-message from-store store-chat-typing" role="status" aria-label="El asistente está respondiendo">
                <span className="typing-dots" aria-hidden="true">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
                <span className="typing-label">Consultando catálogo…</span>
              </div>
            )}
            <div ref={endOfMessages} />
          </div>
          <div className="store-chat-quick-replies" aria-label="Preguntas rápidas">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                className="quick-reply-chip"
                disabled={isSending}
                onClick={() => sendQuery(question)}
              >
                {question}
              </button>
            ))}
          </div>
          {showWhatsApp && (
            <div className="store-chat-actions">
              {lastFailedMessage && (
                <button
                  type="button"
                  className="store-chat-retry-btn"
                  disabled={isSending}
                  onClick={() => sendQuery(lastFailedMessage)}
                >
                  ↻ Reintentar pregunta
                </button>
              )}
              <a className="store-chat-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
                Consultar por WhatsApp
              </a>
            </div>
          )}
          <form className="store-chat-form" onSubmit={submit}>
            <label className="visually-hidden" htmlFor="store-chat-input">Escribe tu pregunta</label>
            <textarea
              ref={inputRef}
              id="store-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu pregunta…"
              maxLength={1200}
              rows={2}
              disabled={isSending}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form.requestSubmit()
                }
              }}
            />
            <button type="submit" disabled={!input.trim() || isSending} aria-label="Enviar mensaje">
              {isSending ? '…' : 'Enviar'}
            </button>
          </form>
          <p className="store-chat-note">Asistente exclusivo de Pancita Fashion. Solo responde consultas sobre la tienda, prendas y pedidos.</p>
        </section>
      )}
      <button
        className="store-chat-launcher"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{isOpen ? '×' : '♡'}</span>
        {isOpen ? 'Cerrar' : '¿Te ayudamos?'}
      </button>
    </aside>
  )
}

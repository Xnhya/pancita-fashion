import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { categories, products as demoProducts } from './data/products'
import { store } from './data/store'
import { createOrder, getProducts } from './api'
import ChatWidget from './ChatWidget'

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

const CART_STORAGE_KEY = 'pancita_cart'
const CUSTOMER_NAME_STORAGE_KEY = 'pancita_customer_name'
const CUSTOMER_NOTE_STORAGE_KEY = 'pancita_customer_note'
const THEME_STORAGE_KEY = 'pancita-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function getInitialCart() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => (
      item &&
      typeof item.productId === 'string' &&
      typeof item.size === 'string' &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
    ))
  } catch {
    return []
  }
}

function getInitialCustomerName() {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(CUSTOMER_NAME_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function getInitialCustomerNote() {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(CUSTOMER_NOTE_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

const KNOWN_COLORS = {
  arena: '#d7c6b0',
  negro: '#383737',
  rosa: '#f7b2c4',
  blanco: '#ffffff',
  beige: '#f5f0e6',
  celeste: '#a8d5e5',
  azul: '#3b5998',
  verde: '#7ca982',
  gris: '#a0a0a0',
  marino: '#1b2a4a',
  perla: '#eae6df',
  lavanda: '#c5b4e3',
  lila: '#d8b4e2',
  menta: '#a8e6cf',
  mostaza: '#e1ad01',
  terracota: '#b35d49',
  vino: '#5c1d24',
  rojo: '#c0392b',
  crema: '#fffdd0',
}

function getColorStyle(colorName) {
  if (!colorName || typeof colorName !== 'string') return {}
  const normalized = colorName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (KNOWN_COLORS[normalized]) {
    return { backgroundColor: KNOWN_COLORS[normalized] }
  }
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return { backgroundColor: `hsl(${hue}, 45%, 72%)` }
}

const MATERNITY_STAGES = [
  { id: 'trim1', label: '1er Trimestre (1-3 meses)' },
  { id: 'trim2', label: '2do Trimestre (4-6 meses)' },
  { id: 'trim3', label: '3er Trimestre (7-9 meses)' },
  { id: 'post', label: 'Postparto / Lactancia' },
]

const PRE_PREGNANCY_SIZES = ['S', 'M', 'L', 'XL']

const FIT_PREFERENCES = [
  { id: 'comodo', label: 'Cómodo / Al cuerpo' },
  { id: 'holgado', label: 'Holgado / Para que crezca más' },
]

function calculateMaternityFit({ stage, preSize, preference, availableSizes = [] }) {
  const SIZE_LADDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  const wantsSizeUp = stage === 'trim3' || preference === 'holgado'
  const currentIndex = SIZE_LADDER.indexOf(preSize)

  if (wantsSizeUp && currentIndex >= 0 && currentIndex < SIZE_LADDER.length - 1) {
    const nextSize = SIZE_LADDER[currentIndex + 1]
    if (availableSizes.includes(nextSize)) {
      return {
        size: nextSize,
        reason: `Te recomendamos la talla ${nextSize} para acompañarte con total comodidad y holgura en esta etapa de tu embarazo.`,
      }
    }
  }

  if (availableSizes.includes(preSize)) {
    const reason = wantsSizeUp
      ? `Te sugerimos tu talla habitual (${preSize}): el corte evolutivo de esta prenda ya incorpora elasticidad y holgura natural para adaptarse a tu pancita.`
      : `Te recomendamos tu talla habitual (${preSize}): el corte materno anatómico de la prenda se amolda suavemente a los cambios de tu figura.`
    return { size: preSize, reason }
  }

  const nearest = [...availableSizes].sort((a, b) => {
    const idxA = SIZE_LADDER.indexOf(a)
    const idxB = SIZE_LADDER.indexOf(b)
    const distA = idxA >= 0 ? Math.abs(idxA - currentIndex) : 99
    const distB = idxB >= 0 ? Math.abs(idxB - currentIndex) : 99
    return distA - distB
  })[0]

  const fallbackSize = nearest || availableSizes[0] || 'M'
  return {
    size: fallbackSize,
    reason: `Para este modelo te sugerimos la talla ${fallbackSize} (la más adecuada disponible), confeccionada para brindarte confort durante tu maternidad.`,
  }
}

const iconPaths = {
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  bag: (
    <>
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  close: (
    <>
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  store: (
    <>
      <path d="M3 10h18" />
      <path d="m4 10 1-6h14l1 6" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: (
    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1Z" />
  ),
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  navigation: (
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  copy: (
    <>
      <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </>
  ),
}

function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Header({ itemCount, onNavigate, theme, onToggleTheme, activeView }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            type="button"
            onClick={() => onNavigate('catalog')}
            aria-label="Ir al catálogo de Pancita Fashion"
          >
            <span className="brand-mark">
              <Icon name="heart" size={23} />
            </span>
            <span className="brand-copy">
              <span className="brand-name">Pancita Fashion</span>
              <span className="brand-tagline">CONTIGO EN CADA ETAPA</span>
            </span>
          </button>

          <nav className="main-nav" aria-label="Navegación principal">
            <button
              className={`nav-link ${activeView === 'catalog' ? 'active' : ''}`}
              type="button"
              onClick={() => onNavigate('catalog')}
              aria-current={activeView === 'catalog' ? 'page' : undefined}
            >
              Catálogo
            </button>
            <button
              className={`nav-link ${activeView === 'how-to-buy' ? 'active' : ''}`}
              type="button"
              onClick={() => onNavigate('how-to-buy')}
              aria-current={activeView === 'how-to-buy' ? 'page' : undefined}
            >
              Cómo comprar
            </button>
            <button
              className={`nav-link ${activeView === 'store-info' ? 'active' : ''}`}
              type="button"
              onClick={() => onNavigate('store-info')}
              aria-current={activeView === 'store-info' ? 'page' : undefined}
            >
              Nuestra tienda
            </button>
          </nav>

          <div className="header-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} className="theme-toggle-svg" />
            </button>

            <button
              className="order-link"
              type="button"
              onClick={() => onNavigate('cart')}
              aria-label={`Ver mi pedido con ${itemCount} ${itemCount === 1 ? 'prenda' : 'prendas'}`}
            >
              <Icon name="bag" size={19} />
              <span>Mi pedido</span>
              <span className="order-count" aria-live="polite">
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  )
}

function ProductCard({ product, onOpen }) {
  return (
    <article className="product-card">
      <button
        className="product-image-button"
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`Ver ${product.name}`}
      >
        <img src={product.image} alt={product.imageAlt} />
        <span className="image-action">Ver prenda</span>
      </button>
      <div className="product-info">
        <button className="product-name" type="button" onClick={() => onOpen(product)}>
          {product.name}
        </button>
        <p className="product-price">{currency.format(product.price)}</p>
        <p className="product-sizes">Tallas: {product.sizes.join(' · ')}</p>
        <button className="outline-button add-button" type="button" onClick={() => onOpen(product)}>
          Ver detalle
        </button>
      </div>
    </article>
  )
}

function ProductDetail({ product, products, onClose, onAdd, onOpenProduct }) {
  const [size, setSize] = useState(product.sizes[0])
  const [color, setColor] = useState(product.colors[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [showFitFinder, setShowFitFinder] = useState(false)
  const [fitStage, setFitStage] = useState('trim2')
  const [fitPreSize, setFitPreSize] = useState(() => (product.sizes.includes('M') ? 'M' : product.sizes[0] || 'S'))
  const [fitPreference, setFitPreference] = useState('comodo')
  const [fitResult, setFitResult] = useState(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function updateFitRecommendation(stage, preSize, preference) {
    const result = calculateMaternityFit({
      stage,
      preSize,
      preference,
      availableSizes: product.sizes,
    })
    setFitResult(result)
    setSize(result.size)
  }

  function handleToggleFitFinder() {
    setShowFitFinder((prev) => {
      const next = !prev
      if (next && !fitResult) {
        updateFitRecommendation(fitStage, fitPreSize, fitPreference)
      }
      return next
    })
  }

  function handleStageChange(newStage) {
    setFitStage(newStage)
    updateFitRecommendation(newStage, fitPreSize, fitPreference)
  }

  function handlePreSizeChange(newPreSize) {
    setFitPreSize(newPreSize)
    updateFitRecommendation(fitStage, newPreSize, fitPreference)
  }

  function handlePreferenceChange(newPref) {
    setFitPreference(newPref)
    updateFitRecommendation(fitStage, fitPreSize, newPref)
  }

  function submit(event) {
    event.preventDefault()
    onAdd(product, size, color, quantity)
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className="product-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
      >
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Cerrar">
          <Icon name="close" />
        </button>
        <div className="detail-layout">
          <div className="detail-image-wrap">
            <img className="detail-image" src={product.image} alt={product.imageAlt} />
          </div>
          <form className="detail-copy" onSubmit={submit}>
            <p className="eyebrow">ESENCIALES PARA TU EMBARAZO</p>
            <h2 id="product-dialog-title">{product.name}</h2>
            <div className="detail-price-row">
              <span className="detail-price">{currency.format(product.price)}</span>
              <span className="availability">Consulta disponibilidad en tienda</span>
            </div>
            <p className="detail-description">{product.description}</p>

            <fieldset className="option-group">
              <div className="option-group-header">
                <legend>Talla: <strong>{size}</strong></legend>
                <button
                  type="button"
                  className="fit-finder-trigger"
                  onClick={handleToggleFitFinder}
                  aria-expanded={showFitFinder}
                  aria-controls="fit-finder-panel"
                >
                  <span>✨ ¿Cuál es mi talla ideal?</span>
                </button>
              </div>

              {showFitFinder && (
                <div
                  id="fit-finder-panel"
                  className="fit-finder-card"
                  role="region"
                  aria-label="Recomendador de talla evolutiva materna"
                >
                  <div className="fit-finder-card-header">
                    <h4>
                      <span>♡</span> Asesor de Talla Materna (Fit Finder)
                    </h4>
                    <button
                      type="button"
                      className="fit-finder-close"
                      onClick={() => setShowFitFinder(false)}
                      aria-label="Cerrar asesor de talla"
                    >
                      ×
                    </button>
                  </div>
                  <p className="fit-finder-intro">
                    Selecciona tus datos para recomendarte la prenda perfecta según tu etapa:
                  </p>

                  <div className="fit-finder-row">
                    <span className="fit-finder-label">Etapa actual:</span>
                    <div className="fit-chips" role="radiogroup" aria-label="Etapa actual de gestación">
                      {MATERNITY_STAGES.map((stg) => (
                        <button
                          key={stg.id}
                          type="button"
                          className={`fit-chip ${fitStage === stg.id ? 'active' : ''}`}
                          role="radio"
                          aria-checked={fitStage === stg.id}
                          onClick={() => handleStageChange(stg.id)}
                        >
                          {stg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fit-finder-row">
                    <span className="fit-finder-label">Talla habitual antes del embarazo:</span>
                    <div className="fit-chips" role="radiogroup" aria-label="Talla habitual pre-embarazo">
                      {PRE_PREGNANCY_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`fit-chip fit-chip-size ${fitPreSize === sz ? 'active' : ''}`}
                          role="radio"
                          aria-checked={fitPreSize === sz}
                          onClick={() => handlePreSizeChange(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fit-finder-row">
                    <span className="fit-finder-label">Ajuste preferido:</span>
                    <div className="fit-chips" role="radiogroup" aria-label="Ajuste preferido">
                      {FIT_PREFERENCES.map((pref) => (
                        <button
                          key={pref.id}
                          type="button"
                          className={`fit-chip ${fitPreference === pref.id ? 'active' : ''}`}
                          role="radio"
                          aria-checked={fitPreference === pref.id}
                          onClick={() => handlePreferenceChange(pref.id)}
                        >
                          {pref.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {fitResult && (
                    <div className="fit-finder-result" role="status" aria-live="polite">
                      <div className="fit-result-badge">
                        <span>Talla recomendada:</span>
                        <strong>{fitResult.size}</strong>
                      </div>
                      <p className="fit-result-message">{fitResult.reason}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="option-buttons">
                {product.sizes.map((option) => (
                  <button
                    className={`size-option ${size === option ? 'selected' : ''}`}
                    key={option}
                    type="button"
                    aria-pressed={size === option}
                    onClick={() => setSize(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            {product.colors.length > 0 && (
              <fieldset className="option-group">
                <legend>Color: <strong>{color}</strong></legend>
                <div className="color-options">
                  {product.colors.map((option) => {
                    const slug = option.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
                    return (
                      <button
                        className={`color-option ${color === option ? 'selected' : ''}`}
                        key={option}
                        type="button"
                        aria-label={option}
                        aria-pressed={color === option}
                        title={option}
                        onClick={() => setColor(option)}
                      >
                        <span
                          className={`color-dot color-${slug}`}
                          style={getColorStyle(option)}
                        />
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )}

            <div className="detail-actions">
              <div className="quantity-control" aria-label="Cantidad">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Quitar una unidad">
                  <Icon name="minus" size={16} />
                </button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Agregar una unidad">
                  <Icon name="plus" size={16} />
                </button>
              </div>
              <button className="primary-button detail-add" type="submit">
                Agregar al pedido
              </button>
            </div>
            <p className="pickup-note"><Icon name="store" size={17} /> Separa por WhatsApp. Recoge y paga en tienda.</p>
          </form>
        </div>
        <div className="related-products">
          <div className="related-heading">
            <h3>También te puede gustar</h3>
            <button type="button" onClick={onClose}>Volver al catálogo</button>
          </div>
          <div className="related-list">
            {products.filter((item) => item.id !== product.id).slice(0, 3).map((item) => (
              <button
                className="related-item"
                key={item.id}
                type="button"
                onClick={() => onOpenProduct(item)}
              >
                <img src={item.image} alt="" />
                <span>
                  <span className="related-name">{item.name}</span>
                  <span className="related-price">{currency.format(item.price)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function OrderSummary({
  total,
  itemCount,
  name,
  onNameChange,
  note,
  onNoteChange,
  onComplete,
  onRetryOrder,
  onContinueWithoutSaving,
  isSaving,
  orderError,
}) {
  return (
    <aside className="order-summary">
      <p className="eyebrow">TU PEDIDO, CON CARIÑO</p>
      <h2>Resumen</h2>
      <div className="summary-line">
        <span>Prendas ({itemCount})</span>
        <span>{currency.format(total)}</span>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{currency.format(total)}</strong>
      </div>
      <label className="name-field">
        Tu nombre <span>(opcional)</span>
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="¿Cómo te llamas?"
          maxLength={70}
        />
      </label>
      <label className="name-field">
        Notas para la tienda <span>(opcional)</span>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Ej. trimestre de embarazo, horario estimado de recojo…"
          maxLength={500}
          rows={3}
        />
      </label>
      <button className="whatsapp-button" type="button" onClick={onComplete} disabled={itemCount === 0 || isSaving}>
        <span className="whatsapp-mark" aria-hidden="true">◉</span>
        {isSaving ? 'Guardando tu pedido…' : 'Completar pedido por WhatsApp'}
      </button>
      {orderError && (
        <div className="order-error" role="alert">
          <strong>No pudimos guardar tu pedido</strong>
          <p>{orderError}</p>
          <button type="button" onClick={onRetryOrder} disabled={isSaving}>
            Intentar guardar de nuevo
          </button>
          <button type="button" className="continue-without-saving" onClick={onContinueWithoutSaving} disabled={isSaving}>
            Continuar por WhatsApp sin guardarlo
          </button>
        </div>
      )}
      <p className="summary-note">
        El pago y el recojo se realizan en la tienda. Este catálogo no procesa pagos en línea.
      </p>
    </aside>
  )
}

function ApiNotice({ status, onRetry }) {
  if (status === 'online') return null

  if (status === 'loading') {
    return (
      <div className="api-notice loading" role="status">
        Conectando con el catálogo de la tienda…
      </div>
    )
  }

  return (
    <div className="api-notice error" role="alert">
      <div>
        <strong>Modo sin conexión</strong>
        <p>Mostrando el catálogo en modo de respaldo. Puedes seguir explorando nuestras prendas y reservar por WhatsApp.</p>
      </div>
      <button type="button" onClick={onRetry}>Volver a intentar</button>
    </div>
  )
}

function Catalog({ products, onOpenProduct, onNavigate, notice }) {
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === 'Todos' || product.categories.includes(activeCategory)
    const query = search.trim().toLocaleLowerCase('es')
    const matchesSearch = !query || `${product.name} ${product.description}`.toLocaleLowerCase('es').includes(query)
    return matchesCategory && matchesSearch
  }), [activeCategory, products, search])

  return (
    <>
      <main id="main-content">
        <section className="hero container">
          <div className="hero-copy">
            <p className="eyebrow">PARA TI Y TU NUEVA ETAPA</p>
            <h1>Ropa materna cómoda y con estilo.</h1>
            <p>Elige tus prendas y sepáralas por WhatsApp.</p>
            <button className="primary-button hero-button" type="button" onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}>
              Explorar catálogo <Icon name="arrow" size={18} />
            </button>
          </div>
          <img className="hero-image" src="/images/banner.jpg" alt="Dos mujeres embarazadas con ropa cómoda" />
        </section>

        <section className="catalog-section container" id="catalogo">
          <div className="catalog-controls">
            <div className="category-list" role="group" aria-label="Filtrar por categoría">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-chip ${activeCategory === category ? 'selected' : ''}`}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Icon name="search" size={19} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busca tu prenda favorita"
                aria-label="Buscar prendas"
              />
            </label>
          </div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">DESCUBRE LA COLECCIÓN</p>
              <h2>{activeCategory === 'Todos' ? 'Tus nuevos favoritos' : activeCategory}</h2>
            </div>
            <span className="product-count">{filteredProducts.length} {filteredProducts.length === 1 ? 'prenda' : 'prendas'}</span>
          </div>
          <p className="demo-notice">Prendas suaves y anatómicas pensadas para acompañarte con comodidad y elegancia en cada etapa.</p>
          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onOpen={onOpenProduct} />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <span className="empty-icon"><Icon name="search" size={24} /></span>
              <h3>No encontramos prendas</h3>
              <p>Prueba con otra búsqueda o elige una categoría distinta.</p>
              <button className="outline-button" type="button" onClick={() => { setSearch(''); setActiveCategory('Todos') }}>
                Ver todo el catálogo
              </button>
            </div>
          )}
          {notice && <p className="toast-message" role="status"><Icon name="check" size={17} /> {notice}</p>}
        </section>

        <section className="how-section" id="how-to-buy">
          <div className="container">
            <div className="centered-heading">
              <p className="eyebrow">ASÍ DE FÁCIL</p>
              <h2>Tu pedido, en tres pasos</h2>
              <p>Revisa las prendas con calma y coordina directamente con la tienda.</p>
            </div>
            <div className="steps-grid">
              <article className="step-card">
                <span className="step-number">01</span>
                <h3>Elige tus prendas</h3>
                <p>Explora el catálogo, selecciona tu talla y agrega lo que te guste al pedido.</p>
              </article>
              <article className="step-card">
                <span className="step-number">02</span>
                <h3>Revisa el resumen</h3>
                <p>Comprueba las cantidades y el monto total antes de enviar el mensaje.</p>
              </article>
              <article className="step-card">
                <span className="step-number">03</span>
                <h3>Coordina por WhatsApp</h3>
                <p>La tienda confirma la disponibilidad. Recoge y paga tus prendas en el local.</p>
              </article>
            </div>
          </div>
        </section>

        <StoreSection />
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  )
}

function StoreSection() {
  const [isCardOpen, setIsCardOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [mapProvider, setMapProvider] = useState('google') // 'google' | 'osm'
  const [mapKey, setMapKey] = useState(0)

  const lat = store.lat || -12.057778
  const lng = store.lng || -77.027222

  // Coordenadas exactas de la tienda en Lima (Av. Miguel Grau 533)
  const googleEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=17&t=m&output=embed`
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-77.0322%2C-12.0615%2C-77.0222%2C-12.0540&layer=mapnik&marker=${lat}%2C${lng}`

  const currentEmbedUrl = mapProvider === 'google' ? googleEmbedUrl : osmEmbedUrl
  const mapExternalUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(store.address || store.location)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  const handleCenterMap = () => {
    setMapKey((k) => k + 1)
  }

  return (
    <section className="store-section container" id="store-info" aria-label="Ubicación y tienda física">
      <div className="store-layout">
        {/* Columna de Información */}
        <div className="store-info-pane">
          <div className="store-heading-group">
            <span className="store-badge">
              <span className="live-dot" aria-hidden="true" />
              <span>TIENDA FÍSICA · SHOWROOM</span>
            </span>
            <p className="eyebrow">VEN A CONOCERNOS</p>
            <h2>Te esperamos en la tienda</h2>
            <p className="store-desc">
              Pruébate las prendas, siente la suavidad de las telas y recibe asesoría personalizada para tu trimestre de embarazo.
            </p>
          </div>

          <div className="store-highlights">
            <div className="store-highlight-item">
              <span className="highlight-icon" aria-hidden="true">
                <Icon name="mapPin" size={20} />
              </span>
              <div>
                <strong>Dirección principal</strong>
                <p>{store.address || store.location}</p>
                {store.reference && <small className="store-ref-text">{store.reference}</small>}
              </div>
            </div>

            <div className="store-highlight-item">
              <span className="highlight-icon" aria-hidden="true">
                <Icon name="clock" size={20} />
              </span>
              <div>
                <strong>Horario de atención</strong>
                <p>{store.schedule}</p>
              </div>
            </div>

            <div className="store-highlight-item">
              <span className="highlight-icon" aria-hidden="true">
                <Icon name="store" size={20} />
              </span>
              <div>
                <strong>Punto de recojo Fast Pickup</strong>
                <p>Presenta tu Pase Digital o confirmación por WhatsApp para recoger tus prendas.</p>
              </div>
            </div>
          </div>

          <div className="store-actions">
            <a
              className="primary-button directions-btn"
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="navigation" size={17} /> Cómo llegar al local
            </a>
            <a
              className="outline-button view-map-btn"
              href={mapExternalUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="mapPin" size={17} /> Abrir en Google Maps
            </a>
          </div>
        </div>

        {/* Columna del Mapa Visual con Pin Interactivo */}
        <div className="store-map-pane">
          <div className="store-map-wrapper">
            {/* Grid Vectorial de calles como respaldo visual de fondo */}
            <div className="map-vector-bg" aria-hidden="true">
              <svg className="map-streets-svg" viewBox="0 0 400 320" preserveAspectRatio="none">
                <rect width="100%" height="100%" fill="var(--map-water, #e8edf3)" />
                <rect x="20" y="20" width="85" height="60" rx="4" fill="var(--map-block, #f8f6f2)" />
                <rect x="125" y="20" width="115" height="60" rx="4" fill="var(--map-block, #f8f6f2)" />
                <rect x="260" y="20" width="120" height="60" rx="4" fill="var(--map-block, #f8f6f2)" />
                <rect x="20" y="100" width="85" height="95" rx="4" fill="var(--map-block, #f8f6f2)" />
                <rect x="125" y="100" width="115" height="95" rx="4" fill="var(--map-block, #f8f6f2)" />
                <rect x="260" y="100" width="120" height="95" rx="4" fill="var(--map-block, #f8f6f2)" />
                <rect x="20" y="215" width="85" height="85" rx="4" fill="var(--map-block, #f8f6f2)" />
                <rect x="125" y="215" width="115" height="85" rx="4" fill="var(--map-block, #f8f6f2)" />
                <rect x="260" y="215" width="120" height="85" rx="4" fill="var(--map-block, #f8f6f2)" />
                <path d="M 0,98 Q 200,92 400,100" stroke="var(--map-arterial, #ffdf85)" strokeWidth="15" fill="none" />
                <path d="M 0,212 Q 200,206 400,214" stroke="var(--map-road, #ffffff)" strokeWidth="10" fill="none" />
                <path d="M 115,0 L 115,320" stroke="var(--map-road, #ffffff)" strokeWidth="8" fill="none" />
                <path d="M 250,0 L 250,320" stroke="var(--map-road, #ffffff)" strokeWidth="8" fill="none" />
                <text x="135" y="92" fill="var(--map-text, #8c7355)" fontSize="9" fontWeight="700" letterSpacing="0.8">
                  AV. MIGUEL GRAU
                </text>
              </svg>
            </div>

            {/* iFrame del Mapa Interactivo (Google Maps o OpenStreetMap) */}
            <iframe
              key={mapKey}
              title={`Mapa de ubicación de ${store.name}`}
              className="store-map-iframe"
              src={currentEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* PIN INTERACTIVO UBICADO EXACTAMENTE EN EL CENTRO DEL MAPA */}
            <div className="store-map-pin-overlay">
              <div className="map-pin-center-anchor">
                {/* Radar pulsante que emite ondas desde el punto exacto de la tienda */}
                <div className="map-pin-radar-pulse" aria-hidden="true" />
                <div className="map-pin-ground-shadow" aria-hidden="true" />

                {/* Botón del Pin de la Tienda (Clicable, animado y con tooltip) */}
                <button
                  type="button"
                  className={`map-pin-trigger ${isCardOpen ? 'is-active' : ''}`}
                  onClick={() => setIsCardOpen((prev) => !prev)}
                  aria-label={`${store.name}. Clic para ${isCardOpen ? 'ocultar' : 'mostrar'} la tarjeta de ubicación`}
                  aria-expanded={isCardOpen}
                >
                  <svg
                    className="map-pin-svg"
                    width="44"
                    height="56"
                    viewBox="0 0 44 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="pinWarmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#eb8876" />
                        <stop offset="100%" stopColor="#cb5843" />
                      </linearGradient>
                      <filter id="pinGlowShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="rgba(0,0,0,0.35)" />
                      </filter>
                    </defs>
                    <path
                      d="M22 2C10.954 2 2 10.954 2 22C2 36.5 19.3 52.8 21.2 54.4C21.7 54.8 22.3 54.8 22.8 54.4C24.7 52.8 42 36.5 42 22C42 10.954 33.046 2 22 2Z"
                      fill="url(#pinWarmGradient)"
                      filter="url(#pinGlowShadow)"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle cx="22" cy="21" r="12" fill="#ffffff" />
                    <path
                      d="M22 27.5L20.8 26.4C16.7 22.7 14 20.2 14 17.2C14 14.8 15.8 13 18.2 13C19.5 13 20.8 13.6 21.6 14.5C22.4 13.6 23.7 13 25 13C27.4 13 29.2 14.8 29.2 17.2C29.2 20.2 26.5 22.7 22.4 26.4L22 27.5Z"
                      fill="#cb5843"
                    />
                  </svg>
                  <span className="map-pin-pulse-halo" aria-hidden="true" />
                </button>

                {/* Tarjeta interactiva flotante sobre el pin */}
                {isCardOpen && (
                  <div className="map-pin-popup-card" role="dialog" aria-label="Información de Pancita Fashion">
                    <div className="popup-card-header">
                      <span className="popup-card-badge">
                        <span className="popup-live-dot" aria-hidden="true" />
                        LOCAL OFICIAL
                      </span>
                      <button
                        type="button"
                        className="popup-close-btn"
                        onClick={() => setIsCardOpen(false)}
                        aria-label="Cerrar detalles del mapa"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>

                    <div className="popup-card-body">
                      <h4 className="popup-title">{store.name}</h4>
                      <p className="popup-address">
                        <Icon name="mapPin" size={14} />
                        <span>{store.address || store.location}</span>
                      </p>
                      {store.reference && (
                        <p className="popup-ref">{store.reference}</p>
                      )}
                      <p className="popup-schedule">
                        <Icon name="clock" size={13} />
                        <span>{store.schedule}</span>
                      </p>
                    </div>

                    <div className="popup-card-footer">
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="popup-action-btn primary"
                      >
                        <Icon name="navigation" size={13} /> Trazar ruta
                      </a>
                      <button
                        type="button"
                        className="popup-action-btn secondary"
                        onClick={handleCopyAddress}
                      >
                        <Icon name={copied ? 'check' : 'copy'} size={13} />
                        {copied ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    {/* Flecha/Caret apuntando al pin */}
                    <div className="popup-arrow" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>

            {/* Barra superior de herramientas y controles del mapa */}
            <div className="store-map-toolbar">
              <span className="map-status-chip">
                <span className="status-dot" aria-hidden="true" />
                <span>Av. Grau 533 · Lima</span>
              </span>

              <div className="map-toolbar-actions">
                <button
                  type="button"
                  className="map-tool-btn"
                  onClick={handleCenterMap}
                  title="Centrar mapa en la tienda"
                  aria-label="Centrar mapa en la tienda"
                >
                  <Icon name="crosshair" size={14} />
                  <span className="btn-label-desktop">Centrar</span>
                </button>

                <div className="map-provider-switch" role="group" aria-label="Proveedor del mapa">
                  <button
                    type="button"
                    className={`provider-tab ${mapProvider === 'google' ? 'active' : ''}`}
                    onClick={() => setMapProvider('google')}
                    title="Ver con Google Maps"
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    className={`provider-tab ${mapProvider === 'osm' ? 'active' : ''}`}
                    onClick={() => setMapProvider('osm')}
                    title="Ver con Calles OpenStreetMap"
                  >
                    Calles
                  </button>
                </div>

                <a
                  href={mapExternalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="map-fullscreen-btn"
                  title="Abrir mapa ampliado en Google Maps"
                  aria-label="Abrir mapa ampliado en Google Maps"
                >
                  ⛶
                </a>
              </div>
            </div>

            {/* Botón flotante para reabrir la tarjeta si se cerró */}
            {!isCardOpen && (
              <button
                type="button"
                className="reopen-pin-card-btn"
                onClick={() => setIsCardOpen(true)}
              >
                <Icon name="mapPin" size={14} />
                <span>Ver datos del local</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <button className="footer-brand" type="button" onClick={() => onNavigate('catalog')}>
          <Icon name="heart" size={20} /> {store.name}
        </button>
        <span>Contigo en cada etapa.</span>
        <span>Fronteras Unidas de Grau · Cercado de Lima</span>
      </div>
    </footer>
  )
}

function CartView({
  products,
  cart,
  onQuantityChange,
  onRemove,
  total,
  itemCount,
  name,
  onNameChange,
  note,
  onNoteChange,
  onComplete,
  onRetryOrder,
  onContinueWithoutSaving,
  isSaving,
  orderError,
  onNavigate,
}) {
  if (cart.length === 0) {
    return (
      <>
        <main id="main-content" className="container page-section empty-cart">
          <div className="empty-icon"><Icon name="bag" size={28} /></div>
          <p className="eyebrow">MI PEDIDO</p>
          <h1>Tu pedido está vacío</h1>
          <p>Cuando encuentres una prenda que te guste, agrégala aquí para ver el total.</p>
          <button className="primary-button" type="button" onClick={() => onNavigate('catalog')}>
            Explorar catálogo <Icon name="arrow" size={18} />
          </button>
        </main>
        <Footer onNavigate={onNavigate} />
      </>
    )
  }

  return (
    <>
      <main id="main-content" className="container page-section">
        <button className="back-link" type="button" onClick={() => onNavigate('catalog')}>
          <span aria-hidden="true">‹</span> Volver al catálogo
        </button>
        <div className="page-title">
          <p className="eyebrow">CASI LISTO</p>
          <h1>Mi pedido</h1>
          <p>Revisa las prendas y confirma el monto antes de continuar.</p>
        </div>
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => {
              const product = products.find((entry) => entry.id === item.productId)
              if (!product) return null
              const key = `${item.productId}-${item.size}-${item.color}`
              return (
                <article className="cart-item" key={key}>
                  <img src={product.image} alt={product.imageAlt} />
                  <div className="cart-item-info">
                    <h2>{product.name}</h2>
                    <p>Talla {item.size}{item.color ? ` · Color ${item.color}` : ''}</p>
                    <span className="cart-item-price">{currency.format(product.price)}</span>
                    <div className="cart-item-actions">
                      <div className="quantity-control small" aria-label={`Cantidad de ${product.name}`}>
                        <button type="button" onClick={() => onQuantityChange(item, Math.max(1, item.quantity - 1))} aria-label="Quitar una unidad">
                          <Icon name="minus" size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => onQuantityChange(item, item.quantity + 1)} aria-label="Agregar una unidad">
                          <Icon name="plus" size={14} />
                        </button>
                      </div>
                      <button className="remove-button" type="button" onClick={() => onRemove(item)}>
                        <Icon name="trash" size={16} /> Quitar
                      </button>
                    </div>
                  </div>
                  <strong className="cart-item-total">{currency.format(product.price * item.quantity)}</strong>
                </article>
              )
            })}
            <p className="cart-stock-note">Confirmación de tallas y disponibilidad directa por WhatsApp antes de tu recojo en tienda física.</p>
          </div>
          <OrderSummary
            total={total}
            itemCount={itemCount}
            name={name}
            onNameChange={onNameChange}
            note={note}
            onNoteChange={onNoteChange}
            onComplete={onComplete}
            onRetryOrder={onRetryOrder}
            onContinueWithoutSaving={onContinueWithoutSaving}
            isSaving={isSaving}
            orderError={orderError}
          />
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  )
}

function generateQRMatrix(value) {
  const size = 21
  const matrix = Array.from({ length: size }, () => Array(size).fill(null))

  const setFinder = (startRow, startCol) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[startRow + r][startCol + c] = 1
        } else {
          matrix[startRow + r][startCol + c] = 0
        }
      }
    }
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = startRow + r
        const nc = startCol + c
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && matrix[nr][nc] === null) {
          matrix[nr][nc] = 0
        }
      }
    }
  }

  setFinder(0, 0)
  setFinder(0, 14)
  setFinder(14, 0)

  for (let i = 8; i < 13; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0
    matrix[i][6] = i % 2 === 0 ? 1 : 0
  }

  matrix[13][8] = 1

  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === null) {
        const cellSeed = (hash ^ (r * 31 + c * 17)) >>> 0
        const bit = ((cellSeed ^ (cellSeed >> 3) ^ (cellSeed >> 7)) & 1) === 1 ? 1 : 0
        matrix[r][c] = bit
      }
    }
  }

  return matrix
}

function DigitalPassQR({ value, size = 120 }) {
  const matrix = useMemo(() => generateQRMatrix(value), [value])
  const cellSize = size / 21

  return (
    <div className="digital-pass-qr-box">
      <svg
        className="digital-pass-qr-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Código QR de reserva ${value}`}
      >
        <rect width={size} height={size} fill="#ffffff" rx="8" />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell === 1 ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#2d2422"
              />
            ) : null
          )
        )}
        <rect
          x={8.5 * cellSize}
          y={8.5 * cellSize}
          width={4 * cellSize}
          height={4 * cellSize}
          fill="#ffffff"
          rx="3"
        />
        <circle
          cx={10.5 * cellSize}
          cy={10.5 * cellSize}
          r={1.5 * cellSize}
          fill="var(--terracotta)"
        />
        <text
          x={10.5 * cellSize}
          y={10.5 * cellSize + 2.5}
          fill="#ffffff"
          fontSize={cellSize * 1.6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontWeight="bold"
        >
          ♡
        </text>
      </svg>
      <span className="qr-caption">Escaneo en caja</span>
    </div>
  )
}

function OrderMessage({ products = [], cart, total, name, note, order, unsaved, onNavigate }) {
  const savedItems = order?.items.map((item) => ({
    name: item.productName,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
  }))
  const cartItems = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.productId)
    if (!product) return null
    return {
      name: product.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: product.price * item.quantity,
    }
  }).filter(Boolean)
  const lines = (savedItems ?? cartItems).map((item) => {
    const colorText = item.color ? ` · Color ${item.color}` : ''
    return `• ${item.name} · Talla ${item.size}${colorText} · ${item.quantity} x ${currency.format(item.unitPrice)} = ${currency.format(item.subtotal)}`
  })
  const orderTotal = order?.total ?? total
  const noteText = (note ?? '').trim()

  const [tempId] = useState(() => Date.now().toString().slice(-4))
  const orderCode = order?.id ? `#${order.id}` : `TEMP-${tempId}`
  const items = savedItems ?? cartItems
  const totalItems = order?.itemCount ?? items.reduce((acc, it) => acc + (it.quantity || 1), 0)

  const qrData = JSON.stringify({
    code: orderCode,
    client: name.trim() || 'Clienta',
    items: totalItems,
    total: orderTotal,
    store: store.name,
    loc: store.location,
  })

  const message = [
    `Hola, ${store.name}.${name.trim() ? ` Soy ${name.trim()}.` : ''}`,
    order ? `Registré el pedido #${order.id} en el catálogo.` : '',
    'Quisiera consultar y separar estas prendas:',
    ...lines,
    `Total: ${currency.format(orderTotal)}`,
    ...(noteText ? [`Notas: ${noteText}`] : []),
    'Por favor, confirmen la disponibilidad. Recogeré y pagaré en la tienda.',
  ].filter(Boolean).join('\n')
  const phone = (import.meta.env.VITE_WHATSAPP_NUMBER || store.whatsapp || '').replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <>
      <main id="main-content" className="container page-section message-page">
        <button className="back-link" type="button" onClick={() => onNavigate('cart')}>
          <span aria-hidden="true">‹</span> Volver a mi pedido
        </button>
        <div className="message-heading">
          <span className="message-check"><Icon name="check" size={26} /></span>
          <p className="eyebrow">CLICK & COLLECT · PHYGITAL</p>
          <h1>Tu Reserva está Lista</h1>
          <p>Presenta tu Pase Digital en caja o envía el detalle por WhatsApp para coordinar el recojo.</p>
        </div>

        {order && (
          <p className="order-saved-notice" role="status">
            Tu pedido quedó registrado en el sistema con el número <strong>#{order.id}</strong>.
          </p>
        )}
        {unsaved && (
          <p className="order-unsaved-notice" role="alert">
            Modo reserva rápida: guarda o imprime este pase digital y envíalo por WhatsApp para que la tienda reserve tus prendas.
          </p>
        )}

        {/* Pase Digital de Reserva - Fast Pickup */}
        <section className="digital-pass-card" aria-label="Pase Digital de Reserva - Fast Pickup">
          <div className="digital-pass-top">
            <div className="digital-pass-badge">
              <span className="pass-bolt" aria-hidden="true">⚡</span>
              <span>PASE DIGITAL · FAST PICKUP</span>
            </div>
            <span className="digital-pass-status">Listo para recojo</span>
          </div>

          <div className="digital-pass-body">
            <div className="digital-pass-info">
              <p className="digital-pass-store">{store.name}</p>
              <h2 className="digital-pass-code">{orderCode}</h2>

              <div className="digital-pass-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Titular de reserva</span>
                  <strong className="meta-val">{name.trim() || 'Clienta Pancita'}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Prendas reservadas</span>
                  <strong className="meta-val">{totalItems} {totalItems === 1 ? 'prenda' : 'prendas'}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Total a pagar en tienda</span>
                  <strong className="meta-val price-val">{currency.format(orderTotal)}</strong>
                </div>
                <div className="meta-item location-item">
                  <span className="meta-label">Local de recojo</span>
                  <span className="meta-val-location">{store.location}</span>
                </div>
              </div>
            </div>

            <div className="digital-pass-qr-wrap">
              <DigitalPassQR value={qrData} size={118} />
            </div>
          </div>

          <div className="digital-pass-ticket-edge" aria-hidden="true">
            <div className="edge-notch left-notch" />
            <div className="edge-divider" />
            <div className="edge-notch right-notch" />
          </div>

          <div className="digital-pass-footer">
            <div className="digital-pass-notes">
              <p>📍 Muestra este pase digital o tu WhatsApp al llegar al local.</p>
              <p>🛍️ El pago y la prueba de prendas se realizan directamente en tienda.</p>
            </div>
            <button
              type="button"
              className="print-pass-btn"
              onClick={() => window.print()}
              aria-label="Imprimir o guardar pase digital"
            >
              <span aria-hidden="true">🖨️</span> Imprimir / Guardar Pase Digital
            </button>
          </div>
        </section>

        {/* Vista previa WhatsApp */}
        <section className="message-card" aria-label="Vista previa del mensaje">
          <div className="chat-header">
            <span className="chat-avatar"><Icon name="heart" size={18} /></span>
            <span><strong>{store.name}</strong><small>WhatsApp Oficial</small></span>
          </div>
          <pre className="chat-message">{message}</pre>
          <span className="chat-time">Ahora</span>
        </section>

        <p className="phone-notice">
          Al pulsar en Abrir WhatsApp, se enviará el detalle de tu reserva directamente a la tienda para coordinar el recojo.
        </p>

        <div className="message-actions">
          <a className="whatsapp-button send-button" href={whatsappUrl} target="_blank" rel="noreferrer">
            <span className="whatsapp-mark" aria-hidden="true">◉</span>
            Abrir WhatsApp
          </a>
          <p>El pago y el recojo se coordinan directamente con la tienda física.</p>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </>
  )
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [view, setView] = useState('catalog')
  const [cart, setCart] = useState(getInitialCart)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [notice, setNotice] = useState('')
  const [customerName, setCustomerName] = useState(getInitialCustomerName)
  const [customerNote, setCustomerNote] = useState(getInitialCustomerNote)
  const [products, setProducts] = useState(demoProducts)
  const [apiStatus, setApiStatus] = useState('loading')
  const [apiMessage, setApiMessage] = useState('')
  const [apiRequestVersion, setApiRequestVersion] = useState(0)
  const [orderError, setOrderError] = useState('')
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [unsavedOrder, setUnsavedOrder] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // Ignorar errores de cuota en almacenamiento local
    }
  }, [cart])

  useEffect(() => {
    try {
      window.localStorage.setItem(CUSTOMER_NAME_STORAGE_KEY, customerName)
    } catch {
      // Ignorar errores de almacenamiento local
    }
  }, [customerName])

  useEffect(() => {
    try {
      window.localStorage.setItem(CUSTOMER_NOTE_STORAGE_KEY, customerNote)
    } catch {
      // Ignorar errores de almacenamiento local
    }
  }, [customerNote])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignorar errores de almacenamiento local
    }
  }, [theme])

  function toggleTheme() {
    setTheme((curr) => (curr === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    let cancelled = false
    getProducts()
      .then((result) => {
        if (!Array.isArray(result)) {
          throw new Error('El catálogo recibió una respuesta inesperada del servidor.')
        }
        if (!cancelled) {
          setProducts(result)
          setApiMessage('')
          setApiStatus('online')
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProducts(demoProducts)
          setApiMessage(error.message)
          setApiStatus('offline')
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiRequestVersion])

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
  const total = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)

  function retryApi() {
    setApiStatus('loading')
    setApiRequestVersion((version) => version + 1)
  }

  function navigate(target) {
    if (target === 'catalog' || target === 'cart') {
      setView(target)
      setSelectedProduct(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setView('catalog')
    setSelectedProduct(null)
    window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  function addToCart(product, size, color, quantity) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.productId === product.id && item.size === size && item.color === color)
      if (existing) {
        return currentCart.map((item) => (
          item === existing ? { ...item, quantity: item.quantity + quantity } : item
        ))
      }
      return [...currentCart, { productId: product.id, size, color, quantity }]
    })
    setSelectedProduct(null)
    setNotice(`${product.name} se agregó a tu pedido.`)
    window.setTimeout(() => setNotice(''), 3200)
  }

  function changeQuantity(item, quantity) {
    setCart((currentCart) => currentCart.map((entry) => (
      entry.productId === item.productId && entry.size === item.size && entry.color === item.color
        ? { ...entry, quantity }
        : entry
    )))
  }

  function removeFromCart(item) {
    setCart((currentCart) => currentCart.filter((entry) => (
      entry.productId !== item.productId || entry.size !== item.size || entry.color !== item.color
    )))
  }

  async function completeOrder() {
    if (isSavingOrder) return
    setOrderError('')
    if (apiStatus !== 'online') {
      setOrderError(apiMessage || 'Conecta el servidor antes de registrar el pedido.')
      return
    }

    setIsSavingOrder(true)
    setCreatedOrder(null)
    setUnsavedOrder(false)
    try {
      const result = await createOrder({
        customerName: customerName.trim() || null,
        note: customerNote.trim() || null,
        customerNote: customerNote.trim() || null,
        items: cart.map((item) => ({
          productId: item.productId,
          size: item.size,
          color: item.color || null,
          quantity: item.quantity,
        })),
      })
      setCreatedOrder(result)
      setView('message')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setOrderError(error.message)
    } finally {
      setIsSavingOrder(false)
    }
  }

  function continueWithoutSaving() {
    setCreatedOrder(null)
    setUnsavedOrder(true)
    setView('message')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Header
        itemCount={itemCount}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeView={view}
      />
      <ApiNotice status={apiStatus} message={apiMessage} onRetry={retryApi} />
      {view === 'catalog' && (
        <Catalog
          products={products}
          onOpenProduct={setSelectedProduct}
          onNavigate={navigate}
          notice={notice}
        />
      )}
      {view === 'cart' && (
        <CartView
          products={products}
          cart={cart}
          onQuantityChange={changeQuantity}
          onRemove={removeFromCart}
          total={total}
          itemCount={itemCount}
          name={customerName}
          onNameChange={setCustomerName}
          note={customerNote}
          onNoteChange={setCustomerNote}
          onComplete={completeOrder}
          onRetryOrder={completeOrder}
          onContinueWithoutSaving={continueWithoutSaving}
          isSaving={isSavingOrder}
          orderError={orderError}
          onNavigate={navigate}
        />
      )}
      {view === 'message' && (
        <OrderMessage
          products={products}
          cart={cart}
          total={total}
          name={customerName}
          note={customerNote}
          order={createdOrder}
          unsaved={unsavedOrder}
          onNavigate={navigate}
        />
      )}
      {selectedProduct && (
        <ProductDetail
          key={selectedProduct.id}
          product={selectedProduct}
          products={products}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
          onOpenProduct={setSelectedProduct}
        />
      )}
      <ChatWidget />
    </>
  )
}

export default App

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api')
  .replace(/\/+$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('No pudimos conectar con el servidor. Revisa que el backend de Pancita Fashion esté iniciado.')
  }

  const body = await response.text()
  let data
  if (body) {
    try {
      data = JSON.parse(body)
    } catch {
      if (response.ok) {
        throw new Error('El servidor devolvió una respuesta que no pudimos leer.')
      }
    }
  }

  if (!response.ok) {
    throw new Error(data?.message ?? `El servidor respondió con el código ${response.status}.`)
  }

  return data
}

export function getProducts() {
  return request('/products')
}

export function createOrder(order) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

export function sendChatMessage(messages) {
  return request('/chat/reply', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}

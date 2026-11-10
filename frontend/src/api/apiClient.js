import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
let csrfToken = null

const apiClient = axios.create({
  baseURL: configuredBaseUrl.replace(/\/+$/, ''),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase()
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(method)) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('X-CSRF-Token', csrfToken)
    } else {
      config.headers['X-CSRF-Token'] = csrfToken
    }
  }

  return config
})

function setCsrfToken(token) {
  csrfToken = typeof token === 'string' ? token : null
}

function getApiErrorMessage(error, fallback) {
  const responseData = error.response?.data
  const details = responseData?.details

  if (details && typeof details === 'object') {
    const messages = Object.values(details).filter((message) => typeof message === 'string')
    if (messages.length > 0) return messages.join(' ')
  }

  if (typeof responseData?.error === 'string') return responseData.error
  if (axios.isAxiosError(error) && !error.response) {
    return 'Could not reach the DealFlow API. Check that the backend is running and VITE_API_BASE_URL is correct.'
  }

  return error.message || fallback
}

export { getApiErrorMessage, setCsrfToken }
export default apiClient

import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: configuredBaseUrl.replace(/\/+$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
})

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

export { getApiErrorMessage }
export default apiClient

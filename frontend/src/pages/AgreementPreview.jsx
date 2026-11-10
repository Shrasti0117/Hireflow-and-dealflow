import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleHelp,
  FileText,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import apiClient, { getApiErrorMessage } from '../api/apiClient.js'
import getMilestoneAmounts from '../utils/milestoneAmounts.js'

const allowedTimelines = ['1–2 weeks', '3–4 weeks', '4–6 weeks', '1–2 months', '3+ months']

const formatINR = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(amount)

const razorpayCheckoutUrl = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${razorpayCheckoutUrl}"]`)
    const script = existingScript ?? document.createElement('script')
    const handleLoad = () => {
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Razorpay Checkout could not be initialized.'))
    }
    const handleError = () => reject(new Error('Razorpay Checkout could not be loaded.'))

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (!existingScript) {
      script.src = razorpayCheckoutUrl
      script.async = true
      document.body.appendChild(script)
    }
  })
}

function getStoredAgreementId(projectId) {
  try {
    return window.localStorage.getItem(`dealflow:agreement:${projectId}`)
  } catch {
    return null
  }
}

function storeAgreementId(projectId, agreementId) {
  try {
    window.localStorage.setItem(`dealflow:agreement:${projectId}`, agreementId)
  } catch {
    return false
  }
  return true
}

function getDraftAttemptKey(projectId) {
  return `dealflow:agreement-attempt:${projectId}`
}

function hasPendingDraftAttempt(projectId) {
  try {
    return window.localStorage.getItem(getDraftAttemptKey(projectId)) === 'pending'
  } catch {
    return true
  }
}

function beginDraftAttempt(projectId) {
  try {
    const key = getDraftAttemptKey(projectId)
    if (window.localStorage.getItem(key)) return false
    window.localStorage.setItem(key, 'pending')
    return window.localStorage.getItem(key) === 'pending'
  } catch {
    return false
  }
}

function clearDraftAttempt(projectId) {
  try {
    window.localStorage.removeItem(getDraftAttemptKey(projectId))
  } catch {
    return false
  }
  return true
}

function removeStoredAgreementId(projectId) {
  try {
    window.localStorage.removeItem(`dealflow:agreement:${projectId}`)
  } catch {
    return false
  }
  return true
}

function getStoredPaymentId(agreementId) {
  try {
    return window.localStorage.getItem(`dealflow:payment:${agreementId}`)
  } catch {
    return null
  }
}

function storePaymentId(agreementId, paymentId) {
  try {
    window.localStorage.setItem(`dealflow:payment:${agreementId}`, paymentId)
  } catch {
    return false
  }
  return true
}

function isValidAgreementData(project, selectedProvider, terms) {
  if (
    !project
    || typeof project.title !== 'string'
    || !project.title.trim()
    || typeof project.category !== 'string'
    || !project.category.trim()
    || typeof project.description !== 'string'
    || !project.description.trim()
    || !Number.isFinite(Number(project.budget))
    || Number(project.budget) <= 0
    || !project.timeline
    || !Array.isArray(project.skills)
    || project.skills.length === 0
    || !project.skills.every((skill) => typeof skill === 'string' && skill.trim())
  ) {
    return false
  }

  if (
    !selectedProvider
    || typeof selectedProvider.displayName !== 'string'
    || !selectedProvider.displayName.trim()
    || typeof selectedProvider.specialty !== 'string'
    || !selectedProvider.specialty.trim()
    || typeof selectedProvider.profileStatus !== 'string'
    || !selectedProvider.profileStatus.trim()
    || !Number.isFinite(Number(selectedProvider.proposedBudget))
    || Number(selectedProvider.proposedBudget) <= 0
    || typeof selectedProvider.delivery !== 'string'
    || !selectedProvider.delivery.trim()
  ) {
    return false
  }

  if (
    !terms
    || !Number.isFinite(Number(terms.price))
    || Number(terms.price) <= 0
    || typeof terms.timeline !== 'string'
    || (!allowedTimelines.includes(terms.timeline) && terms.timeline !== selectedProvider.delivery)
    || !Array.isArray(terms.deliverables)
    || terms.deliverables.length === 0
    || !terms.deliverables.every((deliverable) => typeof deliverable === 'string' && deliverable.trim())
    || !Array.isArray(terms.milestones)
    || terms.milestones.length === 0
  ) {
    return false
  }

  const validMilestones = terms.milestones.every((milestone) => (
    milestone
    && typeof milestone.name === 'string'
    && milestone.name.trim()
    && typeof milestone.description === 'string'
    && milestone.description.trim()
    && milestone.percentage !== ''
    && Number.isFinite(Number(milestone.percentage))
    && Number(milestone.percentage) >= 0
    && Number(milestone.percentage) <= 100
  ))
  const percentageTotal = terms.milestones.reduce((total, milestone) => total + Number(milestone.percentage), 0)

  return validMilestones && Math.abs(percentageTotal - 100) < 0.0000001
}

function MissingAgreementState({ project, selectedProvider, terms }) {
  const previousState = { project, selectedProvider, terms }
  const hasProject = Boolean(project?.title)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c0b] px-4 py-12 text-center text-slate-100">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
        <CircleHelp size={22} aria-hidden="true" />
      </span>
      <p className="mt-5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#c7f36a]">PREVIEW ONLY · NOT SIGNED</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Agreement preview unavailable</h1>
      <p className="mt-2 max-w-md text-[11px] leading-5 text-slate-400">
        {project || selectedProvider || terms
          ? 'Some project, provider, or proposed terms are missing or invalid. Return to negotiation to review them; no agreement details have been created.'
          : 'Agreement details are not available. Return to negotiation with a selected demo provider and reviewed proposed terms.'}
      </p>
      <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
          to={hasProject && project?._id ? `/project/${project._id}/negotiation` : hasProject ? '/project/negotiation' : '/project/matching'}
          state={hasProject ? previousState : { project }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {hasProject ? 'Back to Negotiation' : 'Back to Provider Matching'}
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-[10px] font-medium text-slate-300 hover:bg-white/[0.04]"
          to="/dashboard"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  )
}

function LoadingAgreementState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0c0b] px-4 py-12 text-center text-[11px] text-slate-400" role="status" aria-busy="true">
      Loading saved agreement preview…
    </main>
  )
}

function AgreementLoadError({ message, onRetry }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c0b] px-4 py-12 text-center text-slate-100">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-red-300/15 bg-red-300/[0.04] text-red-200">
        <CircleHelp size={22} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-[-0.05em]">Agreement preview could not be loaded</h1>
      <p className="mt-2 max-w-md text-[11px] leading-5 text-slate-400">{message}</p>
      <button
        className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
        type="button"
        onClick={onRetry}
      >
        Retry loading agreement
      </button>
    </main>
  )
}

function MissingPersistedAgreementData({ project, hasProvider }) {
  const missingProvider = !hasProvider
  const heading = missingProvider
    ? 'No selected provider is available'
    : 'Negotiation terms are not available'
  const message = missingProvider
    ? 'Select a provider for this project before opening its agreement preview.'
    : 'Save valid negotiation terms before creating an agreement preview.'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c0b] px-4 py-12 text-center text-slate-100">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
        <CircleHelp size={22} aria-hidden="true" />
      </span>
      <p className="mt-5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#c7f36a]">PREVIEW ONLY · NOT SIGNED</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{heading}</h1>
      <p className="mt-2 max-w-md text-[11px] leading-5 text-slate-400">{message}</p>
      <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[10px] font-semibold text-[#171b12] hover:bg-[#d4ff7c]"
          to={missingProvider ? '/project/matching' : `/project/${project._id}/negotiation`}
          state={missingProvider ? { project } : undefined}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {missingProvider ? 'Back to Provider Matching' : 'Back to Negotiation'}
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-[10px] font-medium text-slate-300 hover:bg-white/[0.04]"
          to="/dashboard"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  )
}

function createPreviewSession() {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).slice(2, 7).toUpperCase()
  return {
    createdAt: new Date(timestamp),
    reference: `DF-DEMO-${timestamp.toString(36).toUpperCase()}-${randomSuffix}`,
  }
}

function AgreementPreview() {
  const location = useLocation()
  const { projectId } = useParams()
  const legacyState = location.state ?? {}
  const reduceMotion = useReducedMotion()
  const paymentOperation = useRef(false)
  const checkoutActive = useRef(false)
  const [persistedAgreement, setPersistedAgreement] = useState(null)
  const [agreementRecord, setAgreementRecord] = useState(null)
  const [paymentRecord, setPaymentRecord] = useState(null)
  const [isLoadingAgreement, setIsLoadingAgreement] = useState(Boolean(projectId))
  const [agreementLoadError, setAgreementLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentNotice, setPaymentNotice] = useState('')
  const [legacyPreviewSession] = useState(() => projectId ? null : createPreviewSession())

  useEffect(() => {
    if (!projectId) return undefined

    const controller = new AbortController()

    async function loadAgreement() {
      setIsLoadingAgreement(true)
      setAgreementLoadError('')

      try {
        const { data: projectResponse } = await apiClient.get(`/projects/${projectId}`, {
          signal: controller.signal,
        })
        if (!projectResponse?.success || !projectResponse.data?._id) {
          throw new Error('The API returned an unexpected project response.')
        }

        const projectData = projectResponse.data
        const selectedProvider = projectData.selectedProviderId
          && typeof projectData.selectedProviderId === 'object'
          ? projectData.selectedProviderId
          : null
        const negotiation = projectData.negotiation
          ? {
            ...projectData.negotiation,
            price: Number(projectData.negotiation.price),
            deliverables: [...projectData.negotiation.deliverables],
            milestones: projectData.negotiation.milestones.map((milestone) => ({
              ...milestone,
              percentage: Number(milestone.percentage),
            })),
          }
          : null

        if (!selectedProvider || !negotiation || !isValidAgreementData(projectData, selectedProvider, negotiation)) {
          setPersistedAgreement({
            project: projectData,
            selectedProvider,
            terms: negotiation,
            agreementPreview: null,
          })
          return
        }

        const { data: previewResponse } = await apiClient.patch(
          `/projects/${projectId}/agreement-preview`,
          {},
          { signal: controller.signal },
        )
        if (
          !previewResponse?.success
          || !previewResponse.data?.agreementPreview?.previewReference
          || !previewResponse.data.agreementPreview.previewedAt
        ) {
          throw new Error('The API did not return persisted agreement preview metadata.')
        }

        const previewProject = previewResponse.data
        const previewProvider = previewProject.selectedProviderId
          && typeof previewProject.selectedProviderId === 'object'
          ? previewProject.selectedProviderId
          : selectedProvider
        setPersistedAgreement({
          project: previewProject,
          selectedProvider: previewProvider,
          terms: negotiation,
          agreementPreview: previewProject.agreementPreview,
        })

        const storedAgreementId = getStoredAgreementId(projectId)
        if (storedAgreementId) {
          try {
            const { data: savedAgreement } = await apiClient.get(`/agreements/${storedAgreementId}`, {
              signal: controller.signal,
            })
            if (
              savedAgreement?.success
              && savedAgreement.data?._id === storedAgreementId
              && String(savedAgreement.data.project) === projectId
              && savedAgreement.data.status === 'draft'
            ) {
              setAgreementRecord(savedAgreement.data)
              const storedPaymentId = getStoredPaymentId(storedAgreementId)
              if (storedPaymentId) {
                const { data: paymentResponse } = await apiClient.get(`/payments/${storedPaymentId}`, {
                  signal: controller.signal,
                })
                if (paymentResponse?.success && paymentResponse.data?._id === storedPaymentId) {
                  setPaymentRecord(paymentResponse.data)
                }
              }
            } else {
              removeStoredAgreementId(projectId)
            }
          } catch (error) {
            if (controller.signal.aborted) return
            if (error.response?.status === 404) {
              removeStoredAgreementId(projectId)
            } else {
              throw error
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return
        setAgreementLoadError(getApiErrorMessage(error, error.message || 'The saved agreement preview could not be loaded. Please try again.'))
      } finally {
        if (!controller.signal.aborted) setIsLoadingAgreement(false)
      }
    }

    loadAgreement()
    return () => controller.abort()
  }, [projectId, retryCount])

  const project = projectId ? persistedAgreement?.project : legacyState.project
  const selectedProvider = projectId ? persistedAgreement?.selectedProvider : legacyState.selectedProvider
  const terms = projectId ? persistedAgreement?.terms : legacyState.terms
  const previewMetadata = projectId ? persistedAgreement?.agreementPreview : legacyPreviewSession

  async function getOrCreateAgreement() {
    if (agreementRecord?._id && agreementRecord.status === 'draft') return agreementRecord
    if (!projectId) throw new Error('A saved project is required before starting Test Mode Checkout.')

    const storedAgreementId = getStoredAgreementId(projectId)
    if (storedAgreementId) {
      try {
        const { data } = await apiClient.get(`/agreements/${storedAgreementId}`)
        if (
          data?.success
          && data.data?._id
          && data.data.status === 'draft'
          && String(data.data.project) === projectId
        ) {
          setAgreementRecord(data.data)
          return data.data
        }
        removeStoredAgreementId(projectId)
      } catch (error) {
        if (error.response?.status !== 404) throw error
        removeStoredAgreementId(projectId)
      }
    }

    if (hasPendingDraftAttempt(projectId)) {
      throw new Error('Agreement draft creation has an uncertain result. The app will not create another draft automatically; contact support to reconcile it before retrying.')
    }
    if (!beginDraftAttempt(projectId)) {
      throw new Error('Agreement draft creation could not be safely reserved in this browser. Check storage settings and try again.')
    }

    let response
    try {
      response = await apiClient.post(`/projects/${projectId}/agreements`, {})
    } catch (error) {
      if (error.response?.status >= 400 && error.response.status < 500) {
        clearDraftAttempt(projectId)
      }
      throw error
    }
    const { data } = response
    if (!data?.success || !data.data?._id || data.data.status !== 'draft') {
      throw new Error('The API did not return a persisted Agreement draft.')
    }
    if (!storeAgreementId(projectId, data.data._id) || !clearDraftAttempt(projectId)) {
      throw new Error('The Agreement draft was created but could not be safely saved in this browser. Do not retry draft creation; reload or contact support to reconcile it.')
    }
    setAgreementRecord(data.data)
    return data.data
  }

  async function refreshPaymentStatus(paymentId) {
    const { data } = await apiClient.get(`/payments/${paymentId}`)
    if (!data?.success || data.data?._id !== paymentId) {
      throw new Error('Payment status could not be confirmed by the backend.')
    }
    setPaymentRecord(data.data)
    return data.data
  }

  async function verifyCheckoutPayment(paymentId, checkoutResult) {
    setPaymentNotice('Verifying the Razorpay Test Mode payment with DealFlow…')
    const { data: verification } = await apiClient.post(
      `/payments/${paymentId}/razorpay/verify`,
      {
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_signature: checkoutResult.razorpay_signature,
      },
    )
    const payment = await refreshPaymentStatus(paymentId)
    if (payment.status === 'completed') {
      setPaymentError('')
      setPaymentNotice('Razorpay Test Mode payment verified. No real money was transferred; this does not represent provider acceptance.')
      return
    }
    if (verification?.data?.status === 'verification_pending' || payment.status === 'verification_pending') {
      setPaymentNotice('The payment is authorized but not captured yet. No payment success is being claimed.')
      return
    }
    setPaymentNotice('')
    setPaymentError('The backend has not confirmed a completed payment. Check status and retry verification if needed.')
  }

  async function startRazorpayCheckout() {
    if (paymentOperation.current || checkoutActive.current || isProcessingPayment || !projectId) return
    paymentOperation.current = true
    setIsProcessingPayment(true)
    setPaymentError('')
    setPaymentNotice('')

    try {
      const agreement = await getOrCreateAgreement()
      const { data: orderResponse } = await apiClient.post(
        `/agreements/${agreement._id}/payments/razorpay/order`,
        {},
      )
      const order = orderResponse?.data
      if (
        !orderResponse?.success
        || !order?.paymentId
        || !order?.keyId
        || !order?.orderId
        || order.currency !== 'INR'
        || !Number.isSafeInteger(order.amount)
        || order.amount <= 0
      ) {
        throw new Error(orderResponse?.message || 'The backend did not return a valid Razorpay Test Mode order.')
      }
      storePaymentId(agreement._id, order.paymentId)
      setPaymentRecord({
        _id: order.paymentId,
        status: 'order_created',
        amountMinor: order.amount,
        currency: order.currency,
        mode: 'razorpay_test_demo',
      })

      const Razorpay = await loadRazorpayCheckout()
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'DealFlow AI',
        description: 'Razorpay Test Mode demo transaction',
        order_id: order.orderId,
        handler: async (checkoutResult) => {
          paymentOperation.current = true
          try {
            await verifyCheckoutPayment(order.paymentId, checkoutResult)
          } catch (error) {
            setPaymentNotice('')
            setPaymentError(getApiErrorMessage(error, 'Payment verification failed. Check payment status before retrying.'))
            try {
              const payment = await refreshPaymentStatus(order.paymentId)
              if (payment.status === 'completed') {
                setPaymentError('')
                setPaymentNotice('Razorpay Test Mode payment verified. No real money was transferred; this does not represent provider acceptance.')
              }
            } catch {
              setPaymentError('Payment verification could not be confirmed. Retry safely; the backend will reconcile the existing payment.')
            }
          } finally {
            paymentOperation.current = false
            checkoutActive.current = false
            setIsProcessingPayment(false)
          }
        },
        modal: {
          ondismiss: () => {
            if (!paymentOperation.current) {
              checkoutActive.current = false
              setIsProcessingPayment(false)
              setPaymentNotice('Checkout was closed. No payment success has been confirmed.')
            }
          },
        },
        theme: { color: '#c7f36a' },
      })
      checkout.on('payment.failed', () => {
        setPaymentError('Razorpay did not complete the Test Mode payment. You can try again.')
        setPaymentNotice('')
        if (!paymentOperation.current) {
          checkoutActive.current = false
          setIsProcessingPayment(false)
        }
      })
      checkoutActive.current = true
      checkout.open()
    } catch (error) {
      checkoutActive.current = false
      setPaymentError(getApiErrorMessage(error, error.message || 'Razorpay Test Mode Checkout could not be started.'))
    } finally {
      paymentOperation.current = false
      setIsProcessingPayment(checkoutActive.current)
    }
  }

  async function retryPaymentStatus() {
    const paymentId = paymentRecord?._id
    if (!paymentId || paymentOperation.current || checkoutActive.current) return
    paymentOperation.current = true
    setIsProcessingPayment(true)
    setPaymentError('')
    try {
      const payment = await refreshPaymentStatus(paymentId)
      setPaymentNotice(payment.status === 'completed'
        ? 'Razorpay Test Mode payment verified. No real money was transferred; this does not represent provider acceptance.'
        : `Backend payment status: ${payment.status}.`)
    } catch (error) {
      setPaymentError(getApiErrorMessage(error, 'Payment status could not be refreshed.'))
    } finally {
      paymentOperation.current = false
      setIsProcessingPayment(false)
    }
  }

  if (projectId && isLoadingAgreement) return <LoadingAgreementState />
  if (projectId && agreementLoadError) {
    return <AgreementLoadError message={agreementLoadError} onRetry={() => setRetryCount((count) => count + 1)} />
  }
  if (projectId && persistedAgreement && (!selectedProvider || !terms)) {
    return (
      <MissingPersistedAgreementData
        project={project}
        hasProvider={Boolean(selectedProvider)}
      />
    )
  }

  if (!isValidAgreementData(project, selectedProvider, terms)) {
    return <MissingAgreementState project={project} selectedProvider={selectedProvider} terms={terms} />
  }

  if (!previewMetadata) return <LoadingAgreementState />

  const price = Number(terms.price)
  const milestoneAmounts = getMilestoneAmounts(terms.milestones, price)
  const previewedAt = new Date(previewMetadata.previewedAt ?? previewMetadata.createdAt)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0c0b] text-slate-100">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1080px] items-center px-4 sm:px-6 lg:px-8">
          <nav className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px]" aria-label="Breadcrumb">
            <Link className="text-slate-500 transition-colors hover:text-slate-200" to="/dashboard">Dashboard</Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <Link
              className="text-slate-500 transition-colors hover:text-slate-200"
              to="/project/matching"
              state={{ project }}
            >
              Provider Matching
            </Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <span className="truncate font-medium text-slate-200" aria-current="page">Agreement Preview</span>
          </nav>
        </div>
      </header>

      <motion.main
        className="mx-auto w-full max-w-[900px] px-4 pb-12 pt-7 sm:px-6 sm:pt-9 lg:px-8"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
      >
        <section className="mb-5">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-[#c7f36a]/20 bg-[#c7f36a]/[0.06] px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#d8f2a9]">
              <Sparkles size={11} aria-hidden="true" /> PREVIEW ONLY
            </span>
            <span className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-amber-300/20 bg-amber-300/[0.05] px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-100">
              <ShieldAlert size={11} aria-hidden="true" /> NOT SIGNED
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.055em] text-slate-100 sm:text-3xl">Agreement Preview</h1>
          <p className="mt-2 max-w-[680px] text-[10px] leading-5 text-slate-400 sm:text-[11px]">
            Review the project and proposed terms below. This preview is for discussion only and has not been accepted by the selected provider.
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#101411] shadow-[0_20px_70px_rgba(0,0,0,0.2)]" aria-labelledby="agreement-title">
          <div className="border-b border-white/[0.08] bg-white/[0.015] px-4 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[0.07] text-[#c7f36a]">
                  <FileText size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-slate-500">DEALFLOW AI · DEMO DOCUMENT</p>
                  <h2 className="mt-1 break-words text-lg font-semibold tracking-[-0.035em] text-slate-100 sm:text-xl" id="agreement-title">
                    Proposed Deal Summary
                  </h2>
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-[#0b0e0c] px-3 py-2 sm:text-right">
                <p className="text-[8px] text-slate-500">Preview reference · not a contract ID</p>
                <p className="mt-1 break-all font-mono text-[9px] text-slate-300">{previewMetadata.previewReference ?? previewMetadata.reference}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[8px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={12} aria-hidden="true" />
                Preview first created: {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(previewedAt)}
              </span>
              <span>No signing date or official record</span>
            </div>
          </div>

          <div className="space-y-6 px-4 py-5 sm:px-7 sm:py-6">
            <section aria-labelledby="project-details-heading">
              <SectionHeading id="project-details-heading" title="Project details" />
              <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Project title">{project.title}</InfoItem>
                <InfoItem label="Category">{project.category}</InfoItem>
                <InfoItem label="Client">Client details are not supplied in this demo.</InfoItem>
                <InfoItem label="Original project budget">{formatINR(Number(project.budget))} <span className="text-slate-600">(estimate)</span></InfoItem>
                <div className="sm:col-span-2">
                  <InfoItem label="Project description">
                    <span className="whitespace-pre-wrap">{project.description}</span>
                  </InfoItem>
                </div>
                <div className="sm:col-span-2">
                  <InfoItem label="Required skills">
                    <span className="flex flex-wrap gap-1.5">
                      {project.skills.map((skill) => (
                        <span className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1 text-[8px] text-slate-300" key={skill}>{skill}</span>
                      ))}
                    </span>
                  </InfoItem>
                </div>
              </dl>
            </section>

            <section className="border-t border-white/[0.07] pt-5" aria-labelledby="provider-details-heading">
              <SectionHeading id="provider-details-heading" title="Selected demo provider" />
              <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#0c100d] p-3.5 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-[12px] font-semibold text-slate-100">{selectedProvider.displayName}</p>
                    <p className="mt-1 break-words text-[9px] text-slate-400">{selectedProvider.specialty}</p>
                  </div>
                  <span className="self-start rounded-md border border-[#c7f36a]/15 bg-[#c7f36a]/[0.05] px-2 py-1 text-[8px] text-[#d8f2a9]">
                    {selectedProvider.profileStatus}
                  </span>
                </div>
                <p className="mt-3 text-[9px] leading-4 text-slate-500">
                  Illustrative profile quote: {formatINR(Number(selectedProvider.proposedBudget))} · illustrative delivery estimate: {selectedProvider.delivery}
                </p>
              </div>
            </section>

            <section className="border-t border-white/[0.07] pt-5" aria-labelledby="proposed-terms-heading">
              <SectionHeading id="proposed-terms-heading" title="Proposed terms · not accepted" />
              <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Proposed price">{formatINR(price)} <span className="text-slate-600">({terms.currency || 'INR'})</span></InfoItem>
                <InfoItem label="Proposed delivery timeline">{terms.timeline}</InfoItem>
              </dl>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <section className="rounded-lg border border-white/[0.07] bg-[#0c100d] p-3.5">
                  <h3 className="text-[9px] font-semibold text-slate-200">Proposed deliverables</h3>
                  <ul className="mt-2 space-y-2">
                    {terms.deliverables.map((deliverable, index) => (
                      <li className="flex gap-2 text-[9px] leading-4 text-slate-400" key={`${index}-${deliverable}`}>
                        <span className="text-[#bddf82]" aria-hidden="true">•</span><span className="break-words">{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-lg border border-white/[0.07] bg-[#0c100d] p-3.5">
                  <h3 className="text-[9px] font-semibold text-slate-200">Milestones and payment schedule</h3>
                  <p className="mt-1 text-[8px] leading-4 text-slate-600">Illustrative schedule based on the proposed milestone shares; no payments are scheduled or initiated.</p>
                  <ol className="mt-3 space-y-2.5">
                    {terms.milestones.map((milestone, index) => (
                      <li className="rounded-md border border-white/[0.06] bg-[#0a0c0b] p-2.5" key={`${index}-${milestone.name}`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="min-w-0 break-words text-[9px] font-medium text-slate-200">{milestone.name}</span>
                          <span className="shrink-0 rounded border border-white/[0.08] px-1.5 py-0.5 text-[8px] text-slate-400">{milestone.percentage}%</span>
                        </div>
                        <p className="mt-1 break-words text-[8px] leading-4 text-slate-500">{milestone.description}</p>
                        <p className="mt-1.5 text-[8px] text-[#d8f2a9]">Illustrative amount: {formatINR(milestoneAmounts[index])}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-right text-[8px] text-slate-500">
                    Total: {formatINR(milestoneAmounts.reduce((total, amount) => total + amount, 0))}
                  </p>
                </section>
              </div>
            </section>
          </div>

          <div className="border-t border-white/[0.08] bg-[#0c100d] px-4 py-4 sm:px-7 sm:py-5">
            {!confirmed ? (
              <div className="space-y-4">
                <p className="flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.035] px-3 py-2.5 text-[9px] leading-5 text-slate-400">
                  <ShieldAlert className="mt-0.5 shrink-0 text-amber-100/80" size={13} aria-hidden="true" />
                  This preview is not signed and has not been accepted by the other party. Confirming it does not create an Agreement draft or initiate a payment.
                </p>
                <label className="flex cursor-pointer items-start gap-2.5 text-[10px] leading-5 text-slate-300">
                  <input
                    className="mt-1 h-4 w-4 shrink-0 accent-[#c7f36a] focus-visible:outline-[#c7f36a]"
                    checked={hasReviewed}
                    onChange={(event) => setHasReviewed(event.target.checked)}
                    type="checkbox"
                  />
                  <span>I have reviewed these proposed terms. I understand this confirmation applies only to the frontend demo preview.</span>
                </label>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-[9px] font-medium text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                    to={project?._id ? `/project/${project._id}/negotiation` : '/project/negotiation'}
                    state={{ project, selectedProvider, terms }}
                  >
                    <ArrowLeft size={13} aria-hidden="true" /> Return to Negotiation to edit
                  </Link>
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#c7f36a] px-4 text-[9px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!hasReviewed}
                    onClick={() => setConfirmed(true)}
                    title={!hasReviewed ? 'Review the proposed terms before confirming this demo preview.' : undefined}
                    type="button"
                  >
                    <Check size={13} aria-hidden="true" /> Confirm Preview &amp; Continue
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#c7f36a]/20 bg-[#c7f36a]/[0.045] p-4" role="status">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#c7f36a]/20 bg-[#c7f36a]/[0.08] text-[#c7f36a]">
                    <Check size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-100">You reviewed the proposed terms</h3>
                    <p className="mt-1.5 text-[9px] leading-5 text-slate-400">
                      This confirmation is frontend demo state only. It is not a signature or provider acceptance. A persisted unsigned draft is created only if you choose to start the clearly labelled Test Mode payment.
                    </p>
                    <div className="mt-4 rounded-lg border border-sky-300/15 bg-sky-300/[0.035] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-sky-100">Razorpay Test Mode</p>
                          <p className="mt-1 text-[9px] text-slate-400">
                            {Number.isSafeInteger(paymentRecord?.amountMinor)
                              ? `Checkout amount: ${formatINR(paymentRecord.amountMinor / 100)}`
                              : `Proposed amount: ${formatINR(price)}; the backend determines the final checkout amount.`}
                          </p>
                        </div>
                        {projectId ? (
                          <button
                            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#c7f36a] px-3 text-[9px] font-semibold text-[#171b12] transition-colors hover:bg-[#d4ff7c] disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={isProcessingPayment || paymentRecord?.status === 'completed'}
                            onClick={startRazorpayCheckout}
                            type="button"
                          >
                            {isProcessingPayment
                              ? 'Preparing secure checkout…'
                              : paymentRecord?.status === 'completed'
                                ? 'Payment completed'
                                : 'Pay with Razorpay'}
                          </button>
                        ) : (
                          <p className="text-[9px] text-slate-400">Save this project to enable Test Mode Checkout.</p>
                        )}
                      </div>
                      <p className="mt-2 text-[8px] leading-4 text-slate-500">
                        Demo transaction only. Test Mode does not transfer real money and does not mean the provider accepted or signed the agreement.
                      </p>
                      {paymentRecord?.status === 'completed' && (
                        <p className="mt-2 text-[9px] font-medium text-[#d8f2a9]" role="status">
                          Backend-confirmed Test Mode payment. Provider acceptance and Agreement status remain unchanged.
                        </p>
                      )}
                      {paymentError && (
                        <p className="mt-2 text-[9px] leading-4 text-red-200" role="alert">{paymentError}</p>
                      )}
                      {paymentNotice && (
                        <p className="mt-2 text-[9px] leading-4 text-slate-300" role="status">{paymentNotice}</p>
                      )}
                      {paymentRecord && paymentRecord.status !== 'completed' && (
                        <button
                          className="mt-2 inline-flex min-h-8 items-center rounded-md border border-white/10 px-2.5 text-[8px] font-medium text-slate-300 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={isProcessingPayment}
                          onClick={retryPaymentStatus}
                          type="button"
                        >
                          Refresh payment status
                        </button>
                      )}
                    </div>
                    <button
                      className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-white/10 px-3 text-[9px] font-medium text-slate-300 hover:bg-white/[0.04]"
                      onClick={() => {
                        setConfirmed(false)
                        setHasReviewed(false)
                      }}
                      type="button"
                    >
                      Return to preview review
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <p className="mt-4 text-center text-[8px] leading-4 text-slate-600">
          Preview metadata is stored on this project. A Test Mode payment is separate and does not create a contract, signing record, or provider acceptance.
        </p>
      </motion.main>
    </div>
  )
}

function SectionHeading({ id, title }) {
  return <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300" id={id}>{title}</h3>
}

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8px] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-[9px] leading-5 text-slate-200">{children}</dd>
    </div>
  )
}

export default AgreementPreview

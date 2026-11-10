# Hireflow-and-dealflow

This repository contains the DealFlow AI frontend in [`frontend/`](./frontend/).

## Run locally

```sh
cd frontend
npm install
npm run dev
```

## Razorpay Test Mode demo backend

The backend payment endpoints are disabled when no Razorpay settings are present. To enable them, configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_MODE=test` in the backend process environment. Keep the Key Secret backend-only; do not commit credentials. Live Mode is rejected.

The existing agreement snapshots are INR-denominated. Razorpay orders use the snapshot amount in paise and INR without conversion. Payments are limited to unsigned agreements backed by fictional demo providers and do not represent provider acceptance or a signed contract.

The backend exposes order creation at `POST /api/agreements/:agreementId/payments/razorpay/order`, Checkout verification at `POST /api/payments/:paymentId/razorpay/verify`, and an owner-scoped status read at `GET /api/payments/:paymentId`. Mutations require the existing authenticated session, Origin, and CSRF protections.

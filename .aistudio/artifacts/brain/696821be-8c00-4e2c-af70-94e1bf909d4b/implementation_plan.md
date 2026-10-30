# 6-Digit Email OTP Verification for Gmail Login & Sign-Up

Implement secure 6-digit One-Time Password (OTP) verification for all Gmail sign-ins and registrations, verifying inbox ownership with a segmented 6-digit code UI, 60-second resend cooldown timer, and server-side verification tokens.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your answers during Phase 1:
> - **Verification Method**: Email OTP verification with 6-digit numeric code.
> - **Timing**: Triggered during both login and account sign-up.
> - **Account Integrity**: Once the 6-digit code is confirmed, the account is marked as `isEmailVerified: true` and logged into InfoAtlas.

- **Confirmed Decision 1**: All Gmail logins and registrations will require entering a 6-digit OTP code before access is granted.
- **Confirmed Decision 2**: Built-in 60-second resend cooldown timer and 10-minute code expiry to prevent spam and rate-limit attacks.
- **Confirmed Decision 3**: The Admin account (`admin@infoatlas.app` / `2368`) retains its dedicated super-admin verification bypass so platform administration is never locked out.

---

## 1. Overview & Core Concept

- **What It Does**: When any user signs in or creates an account with their Gmail address, InfoAtlas issues a secure 6-digit verification code. The user confirms their code on an authentic, segmented 6-digit input form before access is granted.
- **Target Audience / Persona**: Every user accessing InfoAtlas on mobile phones, tablets, or desktop browsers, ensuring only genuine owners of the Gmail account can log in.
- **Key Value**: Prevents unauthorized access, stops typo errors, protects account identity, and adds enterprise-grade trust to the platform.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Step 1: Enter Gmail**:
   - User inputs their Gmail address (`@gmail.com`) on the classic login form or clicks "Continue with Google / Gmail".
   - Clicks **"Send Verification Code"** or **"Continue"**.
2. **Step 2: 6-Digit Code Screen**:
   - The card transitions with a smooth slide-in into the OTP Verification screen.
   - Header shows: `Verify your Gmail` with the recipient email highlighted (e.g., `harshdex1@gmail.com`).
   - A clean segmented 6-box numeric input (`[ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]`) with automatic focus progression as numbers are typed or pasted.
   - 60-second countdown timer for **"Resend Code"** to prevent spamming.
   - Quick action to "Edit Email" if the user mistyped their address.
3. **Step 3: Verification & Session Entry**:
   - When all 6 digits are entered, the system validates the code against the server endpoint.
   - On success: High-contrast green checkmark confirmation (`Gmail Verified Successfully`), session initialized, and transition to the InfoAtlas home view.
   - In **Profile Modal**: The user's account card proudly displays a `Verified Gmail` green security badge.

### Visual Identity & Theme
- **Color Tokens**: Neutral canvas (`#030817` dark / `#F5F8FF` light), subtle borders (`#1E293B` dark / `#E0E9FA` light), high-intent accents (`#386BFF` and emerald `#10B981` for verified states).
- **Typography**: Tabular monospace numbers for the 6-digit boxes (`font-mono tabular-nums text-xl font-bold tracking-widest`) ensuring optimal touch and keyboard legibility.
- **Touch-First Ergonomics**: Each input box has at least $48 \times 56\text{px}$ touch target on mobile phones with `inputMode="numeric"` to summon the numeric keypad on iOS and Android.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Server-Side OTP Cache vs Third-Party SMS
- **Chosen Approach**: Lightweight in-memory server-side OTP store with rate limiting (max 5 verification attempts per code, 10-minute expiration window).
- **Why**: Zero external API billing dependency, instant dispatch latency, high reliability across mobile and desktop.
- **Alternatives Considered**: Paid SMS OTP (unnecessary cost and phone number privacy friction) or static tokens (insecure).

### Decision 2: Direct Development Preview Code Toast
- **Chosen Approach**: For seamless testing in AI Studio dev/preview environments without requiring external SMTP credentials, the server generates the cryptographic code and displays an optional interactive developer preview notification ("Verification Code: XXXXXX") alongside the standard verification flow. If real SMTP environment variables are configured, it routes directly to email.
- **Why**: Guarantees testers and users can immediately test and use the feature end-to-end without failing on missing email relay credentials.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────┐
│                     USER INTERACTION                     │
│    AuthPage.tsx  /  GoogleSignInModal.tsx                │
│    (Gmail Address -> "Send Verification Code")           │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   SERVER-SIDE ROUTE                      │
│    POST /api/auth/otp/send                               │
│    - Validates @gmail.com format                         │
│    - Generates 6-digit random code                       │
│    - Stores in activeOtps Map [email -> {code, expires}] │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                  SEGMENTED OTP SCREEN                    │
│    6 numeric input boxes (auto-focus, paste handler)     │
│    Countdown timer (60s resend cooldown)                 │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                VERIFICATION & PERSISTENCE                │
│    POST /api/auth/otp/verify                             │
│    - Checks code match and expiry                        │
│    - Sets isEmailVerified: true                          │
│    - Persists account to safeStorage & data/accounts.json│
└──────────────────────────────────────────────────────────┘
```

### Data Model & State
- `email`: string (verified `@gmail.com`)
- `code`: string (6-digit numeric string)
- `expiresAt`: number (timestamp)
- `attempts`: number (max 5)
- `isEmailVerified`: boolean (attached to `User` and `StoredUserAccount`)

### Interactive Component & State Mapping
- `AuthPage.tsx`: Handles `step: "credentials" | "otp"` state transition.
- `GoogleSignInModal.tsx`: Integrates OTP confirmation before completing sign-in.
- `AuthContext.tsx`: Exposes `sendOtp(email)`, `verifyOtp(email, code)`, and attaches verification flags to user sessions.
- `server.ts`: Houses `POST /api/auth/otp/send` and `POST /api/auth/otp/verify` endpoints.

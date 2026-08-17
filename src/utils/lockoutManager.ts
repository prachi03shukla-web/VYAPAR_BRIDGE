const LOCKOUT_KEY = 'Vyapar Bridge_app_lockout_until';
const ATTEMPTS_KEY = 'Vyapar Bridge_admin_failed_attempts';
const MAX_ATTEMPTS = 2;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Checks if the application is currently in stealth lockout state (15 minutes after 2 failed attempts)
 */
export function isAppLockedOut(): boolean {
  try {
    const until = Number(localStorage.getItem(LOCKOUT_KEY) || 0);
    if (!until) return false;
    if (Date.now() >= until) {
      // 15 minutes passed - automatically clear lockout
      clearLockout();
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Records a failed attempt to open or enter code in admin console.
 * Triggers 15-minute stealth lockout on 2nd failure.
 */
export function recordFailedAdminAttempt(): { isLockedOutNow: boolean; attemptsLeft: number } {
  try {
    const currentAttempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
    if (currentAttempts >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
      localStorage.setItem(ATTEMPTS_KEY, '0');
      return { isLockedOutNow: true, attemptsLeft: 0 };
    } else {
      localStorage.setItem(ATTEMPTS_KEY, String(currentAttempts));
      return { isLockedOutNow: false, attemptsLeft: MAX_ATTEMPTS - currentAttempts };
    }
  } catch (e) {
    return { isLockedOutNow: false, attemptsLeft: 1 };
  }
}

/**
 * Sets lockout manually (e.g. from backend response)
 */
export function setStealthLockout(durationMs = LOCKOUT_DURATION_MS): void {
  try {
    const lockoutUntil = Date.now() + durationMs;
    localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
    localStorage.setItem(ATTEMPTS_KEY, '0');
  } catch (e) {
    console.error(e);
  }
}

export function recordSuccessfulAdminLogin(): void {
  try {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  } catch (e) {
    console.error(e);
  }
}

export function clearLockout(): void {
  try {
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch (e) {
    console.error(e);
  }
}

```typescript
export type CheckStatus = 'up' | 'down' | 'unknown';
export type AlertType   = 'down' | 'recovery';
export type UserPlan    = 'free' | 'starter' | 'pro';

export interface User {
  id:               string;
  whatsapp_number:  string;
  plan:             UserPlan;
  checks_limit:     number;
  api_key:          string;
  otp_code:         string | null;
  otp_expires_at:   number | null;
  otp_attempts:     number;
  created_at:       number;
}

export interface Check {
  id:                    string;
  user_id:               string;
  url:                   string;
  name:                  string;
  interval_seconds:      number;
  timeout_ms:            number;
  status:                CheckStatus;
  consecutive_failures:  number;
  last_checked_at:       number | null;
  last_status_change_at: number | null;
  created_at:            number;
}

export interface CheckResult {
  id:               string;
  check_id:         string;
  is_up:            number; // SQLite integer: 0 | 1
  status_code:      number | null;
  response_time_ms: number;
  error:            string | null;
  checked_at:       number;
}

export interface Alert {
  id:           string;
  check_id:     string;
  type:         AlertType;
  message:      string;
  sent_at:      number | null;
  whatsapp_id:  string | null;
  created_at:   number;
}

export interface ProbeResult {
  is_up:            boolean;
  status_code:      number | null;
  response_time_ms: number;
  error:            string | null;
}
```
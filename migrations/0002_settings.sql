-- Admin-managed app settings (Resend sender, admin emails, site URL) so they can
-- be configured in-app instead of only via Worker secrets/vars. Admin-only access.
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,        -- resend_api_key | resend_from | admin_emails | site_url
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

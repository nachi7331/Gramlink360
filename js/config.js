/**
 * ============================================================================
 * GRAMLINK 360 - Environment & Static Deployment Configuration
 * ============================================================================
 *
 * STATIC SITE CONFIGURATION GUIDE:
 * Static HTML/CSS/JS applications hosted on Jamstack providers (GitHub Pages,
 * Netlify, Vercel, Cloudflare Pages, AWS S3, or local web servers) execute
 * directly in the user's browser. Browsers cannot read server-side .env files.
 *
 * CONFIGURATION APPROACHES SUPPORTED:
 * 1. Default Static Configuration (Current):
 *    Directly defined in this file. Reads publishable client credentials.
 * 2. CI/CD Environment Variable Injection (Netlify / Vercel / GitHub Actions):
 *    During automated deployment, build scripts can substitute variables:
 *      sed -i "s|__SUPABASE_URL__|$SUPABASE_URL|g" js/config.js
 *      sed -i "s|__SUPABASE_ANON_KEY__|$SUPABASE_ANON_KEY|g" js/config.js
 * 3. Runtime Window Injection:
 *    Hosting providers can inject <script>window.__ENV__ = { ... }</script> in <head>.
 * 4. Local Developer Override:
 *    Developers can override endpoint via localStorage:
 *      localStorage.setItem('GRAMLINK_SUPABASE_URL', 'https://custom.supabase.co');
 *      localStorage.setItem('GRAMLINK_SUPABASE_ANON_KEY', 'custom-anon-key');
 *
 * CRITICAL SECURITY DIRECTIVE:
 * - ONLY the publishable client key (anon key) is ever permitted here.
 * - NEVER use or expose the Supabase service_role key in this file or any
 *   client-side script! The service_role key bypasses Row Level Security.
 * - All table operations are protected at the database kernel level by
 *   PostgreSQL Row Level Security (RLS) policies.
 */

(function () {
  // 1. Check for runtime environment injection (window.__ENV__)
  const env = window.__ENV__ || {};

  // 2. Check for developer localStorage overrides
  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('GRAMLINK_SUPABASE_URL') : null;
  const localAnonKey = typeof localStorage !== 'undefined' ? localStorage.getItem('GRAMLINK_SUPABASE_ANON_KEY') : null;

  // 3. Defaults for Gramlink 360 project
  const DEFAULT_URL = 'https://xzjdrkzetidkvymrfluo.supabase.co';
  const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6amRya3pldGlka3Z5bXJmbHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTkwNzEsImV4cCI6MjEwNzEzNTA3MX0._nQU4DiBj0akKnc21xTAd6jPi4mn2iuEI4FJiEyPfX8';

  window.GRAMLINK_CONFIG = {
    // Supabase Project Endpoint
    SUPABASE_URL: localUrl || env.SUPABASE_URL || DEFAULT_URL,

    // Publishable Anon Key (Safe for browser under Row Level Security)
    SUPABASE_ANON_KEY: localAnonKey || env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY,

    // Application Settings
    APP_NAME: 'Gramlink 360',
    VILLAGE_NAME: 'Gram Panchayat Shivrajpur',
    DISTRICT: 'Pune, Maharashtra',
    DEFAULT_SLA_HOURS: 48,

    // Storage Bucket Names (for grievance photo uploads)
    STORAGE_BUCKETS: {
      GRIEVANCE_PROOFS: 'grievance-proofs',
      DOCUMENTS: 'panchayat-documents'
    }
  };

  // Diagnostic log (never logs secret keys)
  if (window.GRAMLINK_CONFIG.SUPABASE_URL) {
    console.log(`📡 Gramlink 360 Config: Configured for ${window.GRAMLINK_CONFIG.SUPABASE_URL}`);
  }
})();

export default function Footer() {
  return (
    <footer className="px-6 pt-14 pb-10" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--text-primary)',
              }}
            >
              Chronos
            </div>
            <p
              className="font-serif-i mt-2 text-secondary"
              style={{ maxWidth: 360, fontSize: 14, fontWeight: 500 }}
            >
              The calendar that does your homework&apos;s scheduling for you.
            </p>
          </div>
          <a
            href="#"
            aria-label="X / Twitter"
            className="footer-x text-secondary transition-colors inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-[13px]"
            style={{ alignSelf: 'flex-start' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.36-7.014L4.5 22H1.244l8.018-9.166L1 2h7.014l4.844 6.4L18.244 2zm-1.2 18h1.871L7.05 4H5.05l12.001 16z" />
            </svg>
          </a>
        </div>

        <div
          className="flex flex-col sm:flex-row justify-between gap-4 mt-10 pt-6"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex gap-6 text-[13px] text-secondary">
            <a
              href="/privacy"
              className="hover:text-primary inline-flex items-center min-h-[44px] -my-3"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="hover:text-primary inline-flex items-center min-h-[44px] -my-3"
            >
              Terms
            </a>
          </div>
          <div className="text-[13px] text-muted2">© 2026 Chronos Labs, Inc.</div>
        </div>
      </div>
    </footer>
  );
}

#!/usr/bin/env python3
"""Builds the static legal-docs site from the repo's markdown sources.
Run: python3 legal-site/build.py
"""
import markdown
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "legal-site"

DOC_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Chronos</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
  <div class="wrap">
    <div class="topnav">
      <a href="index.html" class="brand"><span class="brand-dot"></span>Chronos</a>
      <a href="index.html">← All documents</a>
    </div>
    <article class="doc">
{body}
    </article>
    <div class="footer-nav">
      <a href="privacy.html">Privacy Policy</a>
      <a href="terms.html">Terms of Service</a>
      <a href="index.html">Back to overview</a>
    </div>
  </div>
</body>
</html>
"""

INDEX_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chronos — Legal</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
  <div class="wrap">
    <div class="topnav">
      <span class="brand"><span class="brand-dot"></span>Chronos</span>
      <span>Legal Center</span>
    </div>

    <div class="hero-eyebrow">Chronos · Legal &amp; Compliance</div>
    <h1 class="hero-title">The calendar manages the&nbsp;student.<br>These pages manage the&nbsp;risk.</h1>
    <p class="hero-sub">
      Every policy governing Chronos, in one place. Open a branch below to
      read the full document — each is kept in sync with the actual app
      behavior (trial length, cancellation flow, AI processing, data
      sharing) rather than generic boilerplate.
    </p>

    <div class="branches">
      <a class="branch-card" href="privacy.html">
        <span class="branch-dot"></span>
        <span class="branch-body">
          <p class="branch-title">Privacy Policy</p>
          <p class="branch-desc">What we collect, why, who we share it with, COPPA &amp; FERPA handling, and your rights.</p>
        </span>
        <span class="branch-arrow">→</span>
      </a>
      <a class="branch-card" href="terms.html">
        <span class="branch-dot"></span>
        <span class="branch-body">
          <p class="branch-title">Terms of Service</p>
          <p class="branch-desc">Subscriptions &amp; cancellation, AI-feature disclaimers, liability cap, arbitration clause.</p>
        </span>
        <span class="branch-arrow">→</span>
      </a>
    </div>

    <div class="meta-row">
      <span><b>Last updated</b> — 2026-07-12</span>
      <span><b>Contact</b> — privacy@chronos-app.com</span>
      <span><b>Status</b> — drafted, pending attorney review</span>
    </div>
  </div>
</body>
</html>
"""

def render(md_path: pathlib.Path, title: str) -> str:
    text = md_path.read_text()
    html_body = markdown.markdown(
        text,
        extensions=["tables", "sane_lists", "nl2br"],
    )
    # Cross-doc links point at the repo's .md filenames (correct on GitHub);
    # rewrite them to the site's generated page names for in-browser nav.
    html_body = html_body.replace('href="./PRIVACY_POLICY.md"', 'href="privacy.html"')
    html_body = html_body.replace('href="PRIVACY_POLICY.md"', 'href="privacy.html"')
    html_body = html_body.replace('href="./TERMS_OF_SERVICE.md"', 'href="terms.html"')
    html_body = html_body.replace('href="TERMS_OF_SERVICE.md"', 'href="terms.html"')
    return DOC_PAGE.format(title=title, body=html_body)

def main():
    (SITE / "privacy.html").write_text(render(ROOT / "PRIVACY_POLICY.md", "Privacy Policy"))
    (SITE / "terms.html").write_text(render(ROOT / "TERMS_OF_SERVICE.md", "Terms of Service"))
    (SITE / "index.html").write_text(INDEX_PAGE)
    print("Built: index.html, privacy.html, terms.html")

if __name__ == "__main__":
    main()

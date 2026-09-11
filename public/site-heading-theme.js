const HEADING_THEME_PRIVATE_PAGE = /(?:^|\/)(?:admin[^/]*|dashboard(?:-admin)?|support-dashboard|login|signup|onboarding|my-profile|edit-profile)(?:\.html)?\/?$/i

if (!HEADING_THEME_PRIVATE_PAGE.test(location.pathname) && !document.querySelector('link[data-rmp-heading-theme]')) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/site-heading-theme.css'
  link.dataset.rmpHeadingTheme = '1'
  document.head.appendChild(link)
}

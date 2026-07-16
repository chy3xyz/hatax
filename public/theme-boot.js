/** FOUC guard — apply dark class before first paint. Keep in sync with src/theme.js */
(function () {
  try {
    var raw = localStorage.getItem('hatax_dark')
    var dark = raw != null ? JSON.parse(raw) === true : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', dark)
  } catch (e) {
    /* ignore */
  }
  // Enable color transitions after first paint (avoids animating FOUC fix)
  requestAnimationFrame(function () {
    document.documentElement.classList.add('theme-ready')
  })
})()

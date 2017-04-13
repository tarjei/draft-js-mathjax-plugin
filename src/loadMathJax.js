const loadScript = require('load-script')

// mathjax cdn shutdown the 30/04/2017!!! https://cdn.mathjax.org/mathjax/latest/MathJax.js
const DEFAULT_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js'

const DEFAULT_OPTIONS = {
  extensions: ['tex2jax.js'],
  jax: ['input/TeX', 'output/CommonHTML'],
  TeX: {
    extensions: ['AMSmath.js', 'AMSsymbols.js'],
    // ,"noErrors.js","noUndefined.js"
  },
  messageStyles: 'none',
  showProcessingMessages: false,
  showMathMenu: false,
  showMathMenuMSIE: false,
  preview: 'none',
  tex2jax: {
    // inlineMath: [],
    preview: 'none',
    processEnvironments: false,
  },
  delayStartupTypeset: true,
  // "HTML-CSS": { availableFonts: ["STIX","TeX"] }
}

const DEFAULT_CONFIG = {
  script: DEFAULT_SCRIPT,
  options: DEFAULT_OPTIONS,
}

const loadMathJax = ({ macros }) => {
  let config = DEFAULT_CONFIG

  if (macros) {
    let TeX = DEFAULT_OPTIONS.TeX
    TeX = {
      ...TeX,
      Macros: {
        ...TeX.Macros,
        ...macros,
      },
    }
    config = {
      ...config,
      options: {
        ...config.options,
        TeX,
      },
    }
  }

  if (window.MathJax) {
    window.MathJax.Hub.Config(config.options)
    window.MathJax.Hub.processSectionDelay = 0
    return
  }
  loadScript(config.script, () => {
    window.MathJax.Hub.Config(config.options)
    // avoid flickering of the preview
    window.MathJax.Hub.processSectionDelay = 0
  })
}

export default loadMathJax

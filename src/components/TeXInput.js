import React from 'react'

const teXCmdRegex = /\\([a-zA-Z]+)$/

const getLastTeXCommand = (teX) => {
  const res = teXCmdRegex.exec(teX)
  return res ? res[1].toLowerCase() : ''
}

const computeCompletionList = (
  cmdPrefix,
  commands,
  mostUsedCommands = {},
) => {
  if (cmdPrefix === '') {
    return []
  }
  const list = commands[cmdPrefix[0].toLowerCase()]
    .filter(cmd => cmd.toLowerCase().startsWith(cmdPrefix.toLowerCase()))

  if (!mostUsedCommands) { return list }

  list.sort((c1, c2) => {
    const w1 = (
      Object.prototype.hasOwnProperty.call(mostUsedCommands, c1) &&
      mostUsedCommands[c1]
    ) || 0
    const w2 = (
      Object.prototype.hasOwnProperty.call(mostUsedCommands, c2) &&
      mostUsedCommands[c2]
    ) || 0

    if (w1 === w2) { return 0 }
    if (w1 < w2) { return 1 }
    return -1
  })
  return list
}

const closeDelim = {
  '{': '}',
  '(': ')',
  '[': ']',
  '|': '|',
}

class TeXInput extends React.Component {

  constructor(props) {
    super(props)
    const {
      onChange,
      caretPosFn,
      mostUsedCommands,
      teXCommands,
    } = props
    this.mostUsedCommands = mostUsedCommands
    this.teXCommands = teXCommands

    const pos = caretPosFn()
    this.state = {
      start: pos,
      end: pos,
    }

    this.completionList = []
    this.index = 0

    this._onChange = () => onChange({
      teX: this.teXinput.value,
    })

    this._onSelect = () => {
      const { selectionStart: start, selectionEnd: end } = this.teXinput
      this.setState({ start, end })
    }

    this._moveCaret = (offset, relatif = false) => {
      const { teX: value } = this.props
      const { start, end } = this.state

      if (start !== end) return

      let newOffset = relatif ? start + offset : offset
      if (newOffset < 0) {
        newOffset = 0
      } else if (newOffset > value.length) {
        newOffset = value.length
      }

      this.setState({ start: newOffset, end: newOffset })
    }

    this._insertText = (text, offset = 0) => {
      let { teX: value } = this.props
      let { start, end } = this.state
      value = value.slice(0, start) + text + value.slice(end)
      start += text.length + offset
      if (start < 0) {
        start = 0
      } else if (start > value.length) {
        start = value.length
      }
      end = start
      onChange({ teX: value })
      this.setState({ start, end })
    }

    this.onBlur = () => this.props.finishEdit()

    this.handleKey = this.handleKey.bind(this)
  }

  componentDidMount() {
    const { start, end } = this.state
    setTimeout(() => {
      this.teXinput.focus()
      this.teXinput.setSelectionRange(start, end)
    }, 0)
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.teX !== nextProps.teX) {
      return true
    }
    const { start, end } = nextState
    const { selectionStart, selectionEnd } = this.teXinput
    if (start === selectionStart && end === selectionEnd) {
      return false
    }
    return true
  }

  componentDidUpdate(prevProps, prevState) {
    const { start: s, end: e } = prevState
    const { start: ns, end: ne } = this.state
    if (s !== ns || e !== ne) {
      this.teXinput.setSelectionRange(ns, ne)
    }
  }

  handleKey(evt) {
    const key = evt.key

    const { teX, finishEdit, onChange, displaystyle } = this.props
    const { start, end } = this.state
    const inlineMode = displaystyle !== undefined

    const collapsed = start === end
    const atEnd = collapsed && teX.length === end
    const atBegin = collapsed && end === 0

    const ArrowLeft = key === 'ArrowLeft'
    const ArrowRight = key === 'ArrowRight'
    const Tab = key === 'Tab'
    const $ = key === '$'
    const isDelim = Object.prototype.hasOwnProperty
      .call(closeDelim, key)

    const toggleDisplaystyle = $ && inlineMode

    const findCompletion = Tab && this.completionList.length > 1
    const isAlpha = key.length === 1 &&
      /[a-z]/.test(key.toLowerCase())

    // sortie du mode édition
    if ((
      ArrowLeft && atBegin
    ) || (
      ArrowRight && atEnd
    ) || (
      Tab && this.completionList.length === 0
    )) {
      evt.preventDefault()
      finishEdit(ArrowLeft ? 0 : 1)
    }

    if (toggleDisplaystyle) {
      evt.preventDefault()
      onChange({ displaystyle: !displaystyle })
    }

    // insertion d'un délimiteur
    if (isDelim) {
      evt.preventDefault()
      this._insertText(key + closeDelim[key], -1)
    }

    // completion
    if (isAlpha || findCompletion) {
      const prefix = getLastTeXCommand(teX.slice(0, start))
      const pl = prefix.length
      const startCmd = start - pl
      let ns = start
      let offset

      if (!pl) { return }

      if (isAlpha) {
        this.completionList = computeCompletionList(
          prefix + key,
          this.teXCommands,
          this.mostUsedCommands,
        )
      }

      const L = this.completionList.length
      if (L === 0) {
        return
      } else if (L === 1) {
        // une seule possibilité: insertion!
        this.index = 0
      } else if (findCompletion) {
        // Tab ou S-Tab: on circule...
        offset = evt.shiftKey ? -1 : 1
        this.index += offset
        this.index = (this.index === -1) ? L - 1 : this.index % L
      } else {
        // isAlpha est true et plusieurs completions possibles
        this.index = 0
        ns += 1 // pour avancer après la lettre insérée
      }

      const cmd = this.completionList[this.index]
      const endCmd = startCmd + cmd.length
      const teXUpdated = teX.slice(0, startCmd) +
        cmd + teX.slice(end)
      ns = L === 1 ? endCmd : ns

      evt.preventDefault()
      onChange({ teX: teXUpdated })
      setTimeout(() => this.setState({
        start: ns,
        end: endCmd,
      }), 0)
    }
  }

  render() {
    const { teX, className, style } = this.props
    const teXArray = teX.split('\n')
    const rows = teXArray.length
    const cols = teXArray
      .map(tl => tl.length)
      .reduce((acc, size) => (size > acc ? size : acc), 1)
    return (
      <textarea
        rows={rows}
        cols={cols}
        className={className}
        value={teX}
        onChange={this._onChange}
        onSelect={this._onSelect}
        onBlur={this.onBlur}
        onKeyDown={this.handleKey}
        ref={(teXinput) => { this.teXinput = teXinput }}
        style={style}
      />
    )
  }
}

export default TeXInput

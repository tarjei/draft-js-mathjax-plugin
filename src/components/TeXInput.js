import React from 'react'

const closeDelim = {
  '{': '}',
  '(': ')',
  '[': ']',
  '|': '|',
}

class TeXInput extends React.Component {

  constructor(props) {
    super(props)
    const { onChange, caretPosFn } = this.props
    const pos = caretPosFn()
    this.state = {
      start: pos,
      end: pos,
    }

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

      this.setState({ start: newOffset, end: newOffset }, () =>
        this.teXinput.setSelectionRange(newOffset, newOffset),
      )
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
      this.setState({ start, end }, () =>
        this.teXinput.setSelectionRange(start, end),
      )
      onChange({ teX: value })
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

  handleKey(evt) {
    const key = evt.key
    const { finishEdit, onChange, displaystyle } = this.props
    const { value: text, selectionEnd, selectionStart } = this.teXinput

    if (key === 'ArrowRight' || key === 'Tab') {
      if (selectionStart === selectionEnd &&
        (text.length === selectionEnd || key === 'Tab')) {
        evt.preventDefault()
        finishEdit(1)
      }
    }
    if (key === 'ArrowLeft') {
      if (selectionStart === selectionEnd &&
        selectionEnd === 0) {
        evt.preventDefault()
        finishEdit(0)
      }
    }
    if (key === '$' && displaystyle !== undefined) {
      evt.preventDefault()
      onChange({ displaystyle: !displaystyle })
    }
    if (Object.prototype.hasOwnProperty.call(closeDelim, key)) {
      evt.preventDefault()
      this._insertText(key + closeDelim[key], -1)
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

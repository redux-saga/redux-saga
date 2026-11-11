import { useRef } from 'react'

const GITHUB_REPO = 'https://github.com/redux-saga/redux-saga'

export default function Explore({ value, onChange }) {
  const input = useRef(null)
  const go = () => onChange(input.current.value)

  return (
    <div>
      <p>Type a username or repo full name and hit &apos;Go&apos;:</p>
      {/* keyed by value, so the field resets to the current page after each navigation */}
      <input
        key={value}
        ref={input}
        size="45"
        defaultValue={value}
        onKeyUp={(e) => {
          if (e.key === 'Enter') go()
        }}
      />
      <button onClick={go}>Go!</button>
      <p>
        Code on{' '}
        <a href={GITHUB_REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </p>
    </div>
  )
}

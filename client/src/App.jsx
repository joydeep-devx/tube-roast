function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-xl bg-accent-strong"
        >
          <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-white">
            <path d="M8 5.1v13.8a.9.9 0 0 0 1.4.8l10.7-6.9a.9.9 0 0 0 0-1.6L9.4 4.3A.9.9 0 0 0 8 5.1Z" />
          </svg>
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Tube<span className="text-accent">Roast</span>
        </h1>
      </div>

      <p className="max-w-md text-lg text-muted">
        Your YouTube taste, lovingly roasted. We&apos;re still warming up the oven.
      </p>

      <span className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted">
        Coming soon
      </span>
    </main>
  )
}

export default App

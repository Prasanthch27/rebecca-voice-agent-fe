import Hero from "./components/Hero"
import ProductsGrid from "./components/ProductsGrid"

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-8xl px-6 lg:px-8">
        <header className="flex items-center justify-between py-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500" />
              <span className="text-xl font-bold text-slate-900">TalktoAI</span>
            </div>
          </div>
          <div>
            <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </header>

        <main>
          <Hero />

          <section className="mt-20 pb-20">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-900 mb-3">Ready to dive deeper?</h3>
              <p className="text-lg text-slate-600">Choose how you'd like to learn more about TalktoAI</p>
            </div>
            <ProductsGrid />
          </section>
        </main>

        <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} TalktoAI. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

import { CheckCircle2 } from "lucide-react"

export default function Success({ onReset: _onReset }: { onReset: () => void }) {
  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border-2 border-gradient p-8 bg-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 opacity-30" />
        <div className="relative z-10 space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900">
              Your insights are greatly valued, and you'll hear from our team soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

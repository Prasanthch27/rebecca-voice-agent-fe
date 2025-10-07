
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircle2 } from "lucide-react";

export default function ProductCard({ product }: { product: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-slate-800">{product.title}</h4>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">{product.badge}</span>
      </div>

      <p className="text-sm text-slate-600 mb-3">{product.description}</p>

      <ul className="space-y-2 mb-3 text-sm text-slate-700">
        {product.features.map((f: string, idx: number) => (
          <li key={idx} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm font-semibold">{product.price}</div>
        <button className="rounded-lg bg-slate-100 px-3 py-1 text-sm">Learn more</button>
      </div>
    </div>
  );
}

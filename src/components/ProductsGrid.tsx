import ProductCard from "./ProductCard";

const PRODUCTS = [
  {
    id: "p1",
    title: "Workflow Automation",
    description: "Design multi-step processes with approvals and SLA tracking.",
    price: "$49/mo",
    badge: "Popular",
    features: ["Drag-and-drop builder", "Approvals", "SLA alerts"],
  },
  {
    id: "p2",
    title: "AI Knowledge Hub",
    description: "Centralized docs + semantic search for grounded responses.",
    price: "$39/mo",
    badge: "New",
    features: ["Doc ingestion", "Semantic search", "Access control"],
  },
  {
    id: "p3",
    title: "Integrations",
    description: "Connect to CRMs, ERPs and internal APIs easily.",
    price: "$59/mo",
    badge: "Enterprise",
    features: ["Prebuilt connectors", "Webhooks", "Retry logic"],
  },
  {
    id: "p4",
    title: "Analytics",
    description: "Conversation analytics, CSAT and funnel reports.",
    price: "$29/mo",
    badge: "Pro",
    features: ["Dashboards", "Exports", "Alerts"],
  },
];

export default function ProductsGrid() {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold">Products that pair with Rebecca</h3>
          <p className="text-sm text-slate-500">Pick and mix capabilities for your team.</p>
        </div>
        <div>
          <button className="hidden md:inline-flex rounded-lg border px-3 py-2">View all</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

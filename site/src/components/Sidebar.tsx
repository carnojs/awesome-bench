

export type ViewType =
    | "plaintext_rps"
    | "json_rps"
    | "echo_rps"
    | "search_rps"
    | "user_rps"
    | "latency_p95"
    | "latency_p99"
    | "all_metrics";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
}

const menuItems = [
    {
        section: "Rankings",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        items: [
            { id: "plaintext_rps" as ViewType, label: "Plaintext (req/s)", emoji: "🚀" },
            { id: "json_rps" as ViewType, label: "JSON (req/s)", emoji: "📦" },
            { id: "echo_rps" as ViewType, label: "Echo POST (req/s)", emoji: "🔄" },
            { id: "search_rps" as ViewType, label: "Query Params (req/s)", emoji: "🔍" },
            { id: "user_rps" as ViewType, label: "Path Params (req/s)", emoji: "👤" },
            { id: "latency_p95" as ViewType, label: "Latency (p95)", emoji: "⚡" },
            { id: "latency_p99" as ViewType, label: "Latency (p99)", emoji: "🎯" },
        ],
    },
    {
        section: "Compare",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
        ),
        items: [
            { id: "all_metrics" as ViewType, label: "All Metrics", emoji: "📊" },
        ],
    },
];

export default function Sidebar({ isOpen, onClose, currentView, onViewChange }: SidebarProps) {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar - Desktop: always visible, Mobile: slide in/out */}
            <aside
                className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] transition-transform duration-300 ${isOpen ? "translate-x-0 z-40" : "-translate-x-full lg:translate-x-0 lg:z-0"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-[var(--border-color)]">
                        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            Benchmark Views
                        </h2>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                        {menuItems.map((section) => (
                            <div key={section.section}>
                                <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-3">
                                    {section.icon}
                                    <span className="text-xs font-semibold uppercase tracking-wider">
                                        {section.section}
                                    </span>
                                </div>
                                <ul className="space-y-1">
                                    {section.items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => {
                                                    onViewChange(item.id);
                                                    onClose();
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentView === item.id
                                                    ? "bg-[var(--accent)] text-white shadow-md"
                                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                                                    }`}
                                            >
                                                <span className="text-base">{item.emoji}</span>
                                                {item.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-[var(--border-color)]">
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            64 concurrent connections · 6s duration
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}

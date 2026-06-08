export type TabKey = "timers" | "reminders" | "pings";

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: "timers", label: "Timers" },
  { key: "reminders", label: "Reminders" },
  { key: "pings", label: "Pings" },
];

export function Tabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          className={active === tab.key ? "active" : ""}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

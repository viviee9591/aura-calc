const THEMES = [
  { id: "light", label: "Light mode", color: "#f4f4f6" },
  { id: "dark", label: "Dark mode", color: "#0a0a0a" },
  { id: "pink", label: "Pink mode", color: "#ffb3cd" },
];

export default function ThemeSwitcher({ theme, onChange }) {
  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={theme === t.id}
          aria-label={t.label}
          title={t.label}
          className={`theme-dot ${theme === t.id ? "active" : ""}`}
          style={{ background: t.color }}
          onClick={() => onChange(t.id)}
        />
      ))}
    </div>
  );
}
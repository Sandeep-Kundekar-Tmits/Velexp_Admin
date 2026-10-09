import { Moon, Sun } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";

/**
 * Sidebar footer, next to the collapse control. Flips the whole app between
 * the dark theme (default) and the light theme declared by
 * [data-theme="light"] in styles/app.css -- see uiStore.themeMode for the
 * persisted state and the <html> attribute it drives.
 */
const ThemeToggle = () => {
    const themeMode = useUiStore((s) => s.themeMode)
    const toggleThemeMode = useUiStore((s) => s.toggleThemeMode)
    const isLight = themeMode === "light"

    return (
        <button
            type="button"
            onClick={toggleThemeMode}
            className="sidebar-toggle"
            aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
            title={isLight ? "Switch to dark theme" : "Switch to light theme"}
        >
            {isLight ? <Moon aria-hidden="true" size={16} /> : <Sun aria-hidden="true" size={16} />}
        </button>
    )
}

export default ThemeToggle

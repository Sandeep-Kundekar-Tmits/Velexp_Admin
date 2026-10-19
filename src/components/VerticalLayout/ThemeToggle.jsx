import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";

const THEMES = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "lavender", label: "Serene Lavender", icon: Palette },
];

/**
 * Sidebar footer, next to the collapse control. Opens a small menu to pick
 * one of the app's three themes -- [data-theme="light"|"lavender"] (dark is
 * the no-attribute default) in styles/app.css -- see uiStore.themeMode for
 * the persisted state and the <html> attribute it drives.
 *
 * The menu is portaled to <body>, not a plain position:absolute popup: the
 * footer sits inside .vertical-menu, which clips to its own rounded panel
 * (overflow:hidden) and can be as narrow as the 68px collapsed rail, so an
 * in-place popup would get cut off instead of floating free of it. Same
 * portal + viewport-measured placement DateRangeInput.jsx uses for exactly
 * this reason.
 */
const ThemeToggle = () => {
    const themeMode = useUiStore((s) => s.themeMode);
    const setThemeMode = useUiStore((s) => s.setThemeMode);

    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const [menuPos, setMenuPos] = useState(null);

    const current = THEMES.find((t) => t.value === themeMode) ?? THEMES[0];
    const CurrentIcon = current.icon;

    useEffect(() => {
        if (!open) return undefined;
        const onDocClick = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    // useLayoutEffect so the measurement lands before paint; otherwise the
    // menu renders at 0,0 for a frame and visibly jumps into place.
    useLayoutEffect(() => {
        if (!open) return undefined;

        const place = () => {
            const trigger = triggerRef.current?.getBoundingClientRect();
            const menu = menuRef.current?.getBoundingClientRect();
            if (!trigger) return;

            const GAP = 6;
            const width = menu?.width ?? 0;
            const height = menu?.height ?? 0;

            // This control sits at the very bottom of the viewport, so the
            // menu opens upward by default -- below would almost always run
            // off-screen. Falls back to below only if there truly isn't
            // room above either.
            const above = trigger.top - GAP - height;
            const top = above >= 8 ? above : trigger.bottom + GAP;
            const left = Math.max(8, Math.min(trigger.left, window.innerWidth - width - 8));

            setMenuPos({ top, left });
        };

        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [open]);

    useEffect(() => {
        // Discard the previous placement so the next open measures fresh
        // rather than flashing where the menu used to be.
        if (!open) setMenuPos(null);
    }, [open]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="sidebar-toggle"
                aria-label="Switch theme"
                aria-haspopup="menu"
                aria-expanded={open}
                title={`Theme: ${current.label}`}
            >
                <CurrentIcon aria-hidden="true" size={16} />
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    className="min-w-[11rem] rounded border border-line bg-surface py-1 shadow-lg"
                    style={{
                        position: "fixed",
                        zIndex: 1200,
                        top: menuPos?.top ?? 0,
                        left: menuPos?.left ?? 0,
                        visibility: menuPos ? "visible" : "hidden",
                    }}
                >
                    {THEMES.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={themeMode === value}
                            onClick={() => {
                                setThemeMode(value);
                                setOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-[rgb(var(--overlay-rgb)/0.06)]"
                        >
                            <Icon aria-hidden="true" size={14} className="text-ink-muted" />
                            <span className="flex-1">{label}</span>
                            {themeMode === value && <Check aria-hidden="true" size={14} className="text-brand-500" />}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};

export default ThemeToggle;

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { FaRegCalendarAlt } from "react-icons/fa";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
const DateRangeInput = ({
  value,
  onChange,
  className="",
  isBorder = false,
  isBorderRight = false,
  height = "38px",
}) => {
  const [range, setRange] = useState([
    {
      startDate: value?.startDate ? new Date(value.startDate) : new Date(),
      endDate: value?.endDate ? new Date(value.endDate) : new Date(),
      key: "selection",
    },
  ]);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const popupRef = useRef(null);
  // Viewport coordinates for the portalled calendar; null until measured.
  const [popupPos, setPopupPos] = useState(null);
  /* Clicks made since the calendar opened. react-date-range reports the first
     click as a range whose start and end are the same day, so "has an end date"
     cannot tell the two clicks apart -- and picking one day twice is a valid
     single-day range. Counting the clicks is what distinguishes them. */
  const clicksSinceOpen = useRef(0);
  const closeTimer = useRef(null);

  /*
   * Two months side by side is ~620px -- wider than any phone, so on a narrow
   * screen the calendar was clamped to the viewport and the second month ran
   * off the edge. One month, stacked, fits.
   *
   * matchMedia rather than a resize listener: it fires only when the query's
   * answer actually changes, not on every pixel of a drag.
   */
  const [isNarrow, setIsNarrow] = useState(
    () => window.matchMedia("(max-width: 639.98px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639.98px)");
    const onChange = (e) => setIsNarrow(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // 🔥 Sync when parent value changes
  useEffect(() => {
    setRange([
      {
        startDate: value?.startDate ? new Date(value.startDate) : new Date(),
        endDate: value?.endDate ? new Date(value.endDate) : new Date(),
        key: "selection",
      },
    ]);
  }, [value]);

  const handleSelect = (item) => {
    setRange([item.selection]);

    onChange?.({
      startDate: item.selection.startDate,
      endDate: item.selection.endDate,
    });

    clicksSinceOpen.current += 1;
    if (clicksSinceOpen.current >= 2) {
      /* Short delay rather than closing on the same tick: the second click is
         what completes the range, and dismissing instantly means you never see
         the range you just picked highlighted. */
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setOpen(false), 180);
    }
  };

  // A pending auto-close must not fire after the field has gone away.
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const formatDate = (date) =>
    date ? format(date, "dd/MM/yyyy") : "DD/MM/YYYY";

  /*
   * Close on outside click.
   *
   * The calendar is portalled to <body>, so it is NOT inside wrapperRef any
   * more -- checking only the wrapper would treat every click on a date as an
   * outside click and shut the picker on the first selection.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current?.contains(event.target)) return;
      if (popupRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /*
   * Place the calendar against the trigger, in viewport coordinates.
   *
   * It used to be position:absolute inside the field, which meant any ancestor
   * with overflow other than visible clipped it -- a modal body, the grid's
   * scroll box, a page-fit column. Inside the Find Missing POD dialog it was
   * cut off entirely.
   *
   * useLayoutEffect so the measurement lands before paint; otherwise the panel
   * renders at 0,0 for a frame and visibly jumps into place.
   */
  useLayoutEffect(() => {
    if (!open) return undefined;

    const place = () => {
      const trigger = wrapperRef.current?.getBoundingClientRect();
      const popup = popupRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const GAP = 6;
      const width = popup?.width ?? 0;
      const height = popup?.height ?? 0;

      // Below by default; above when there is no room and there is room up top.
      const below = trigger.bottom + GAP;
      const fitsBelow = below + height <= window.innerHeight - 8;
      const top = fitsBelow ? below : Math.max(8, trigger.top - GAP - height);

      // Then keep it inside the right edge without ever going off the left.
      const left = Math.max(8, Math.min(trigger.left, window.innerWidth - width - 8));

      setPopupPos({ top, left });
    };

    place();
    // Anything that moves the trigger moves the calendar with it. `true` to
    // catch scrolling of inner containers, not just the window.
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      // Every open starts a fresh two-click range, whatever the field already
      // holds -- otherwise reopening would close again on the first click.
      clicksSinceOpen.current = 0;
      return;
    }
    // Discard the previous placement, so the next open measures fresh rather
    // than flashing where the field used to be.
    setPopupPos(null);
    clearTimeout(closeTimer.current);
  }, [open]);

  const hasValue = Boolean(value?.startDate && value?.endDate);

  return (
    /*
     * Colours are in layout-compat.css, not inline here.
     *
     * They used to be inline -- #fff panel, #dcdcdc border, #6b6b6b text --
     * which no stylesheet can reach, so this control stayed light on every one
     * of the ~20 dark screens that render it. Inline styles are now only the
     * things a prop actually varies (height, the optional right divider).
     */
    <div
      ref={wrapperRef}
      className={`date-range ${className}`}
      style={{
        height,
        ...(isBorderRight
          ? { borderRight: "1px solid var(--color-line)", paddingRight: "10px" }
          : {}),
      }}
    >
      {/* A real button, not a click-handled div: this opens a calendar, and it
          was previously unreachable by keyboard. */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`date-range-trigger${isBorder ? " date-range-trigger-bordered" : ""}`}
        style={{ height }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={hasValue ? "date-range-value" : "date-range-value date-range-placeholder"}>
          {hasValue ? formatDate(range[0].startDate) : "DD/MM/YYYY"}
          {" – "}
          {hasValue ? formatDate(range[0].endDate) : "DD/MM/YYYY"}
        </span>
        <FaRegCalendarAlt size={15} className="date-range-icon" aria-hidden="true" />
      </button>

      {/* Portalled to <body> so no ancestor's overflow can clip it. Hidden
          until the layout effect has measured it, otherwise it paints at the
          top-left of the window for one frame and jumps. */}
      {open && createPortal(
        <div
          ref={popupRef}
          className="date-range-portal"
          style={{
            top: popupPos?.top ?? 0,
            left: popupPos?.left ?? 0,
            visibility: popupPos ? "visible" : "hidden",
          }}
        >
          <DateRange
            ranges={range}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            months={isNarrow ? 1 : 2}
            direction={isNarrow ? "vertical" : "horizontal"}
            showDateDisplay={false}
            /* Matches the accent the modernised screens use for selection,
               rather than the old Skote indigo. */
            rangeColors={["#3B82F6"]}
            monthDisplayFormat="MMMM yyyy"
            weekdayDisplayFormat="EE"
          />
        </div>,
        document.body
      )}
    </div>
  );
};


export default DateRangeInput;

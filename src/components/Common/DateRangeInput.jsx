import React, { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { FaRegCalendarAlt } from "react-icons/fa";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
const DateRangeInput = ({
  value,
  onChange,
  className = "",
  isBorder = false,
  isBorderRight = false,
  height = "38px",
}) => {
  const [range, setRange] = useState([
    {
      startDate: value?.startDate || null,
      endDate: value?.endDate || null,
      key: "selection",
    },
  ]);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // 🔥 Sync when parent value changes
  useEffect(() => {
    if (value?.startDate || value?.endDate) {
      setRange([
        {
          startDate: value.startDate || null,
          endDate: value.endDate || null,
          key: "selection",
        },
      ]);
    }
  }, [value]);

  const handleSelect = (item) => {
    setRange([item.selection]);

    onChange?.({
      startDate: item.selection.startDate,
      endDate: item.selection.endDate,
    });
  };

  const formatDate = (date) =>
    date ? format(date, "dd/MM/yyyy") : "DD/MM/YYYY";

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        borderRight: isBorderRight ? "solid #B0ACAC 1px" : "none",
        height: height,
        paddingRight: isBorderRight ? "10px" : "0px"
      }}
    >
      {/* Input Box */}
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          border: isBorder ? "1px solid #dcdcdc" : "none",
          borderRadius: isBorder ? "6px" : "0px",
          padding: "5px 10px",
          height: height,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          background: "#fff",
        }}
      >
        <span style={{ color: "#6b6b6b", fontSize: "14px" }}>
          {formatDate(range[0].startDate)} &nbsp;–&nbsp;
          {formatDate(range[0].endDate)}
        </span>
        <FaRegCalendarAlt size={18} color="#8b8b8b" />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: "0",
            zIndex: 10,
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            borderRadius: "8px",
          }}
        >
          <DateRange
            ranges={range}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
          />
        </div>
      )}
    </div>
  );
};


export default DateRangeInput;

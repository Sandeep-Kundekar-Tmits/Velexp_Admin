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
      startDate: value?.startDate ? new Date(value.startDate) : new Date(),
      endDate: value?.endDate ? new Date(value.endDate) : new Date(),
      key: "selection",
    },
  ]);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

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
          {value?.startDate ? formatDate(range[0].startDate) : "DD/MM/YYYY"} &nbsp;–&nbsp;
          {value?.endDate ? formatDate(range[0].endDate) : "DD/MM/YYYY"}
        </span>
        <FaRegCalendarAlt size={18} color="#8b8b8b" />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: "0",
            zIndex: 1002, // Higher z-index to stay above sticky headers
            background: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            borderRadius: "8px",
            border: "1px solid #eee",
          }}
          className="date-range-portal"
        >
          <style>
            {`
              .rdrCalendarWrapper {
                border-radius: 8px;
                font-family: inherit;
              }
              .rdrMonthAndYearWrapper {
                padding-top: 10px;
                height: 50px;
              }
              .rdrNextPrevButton {
                background: #f8f9fa;
                border: 1px solid #eee;
                border-radius: 4px;
              }
              .rdrMonthAndYearPickers select {
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid #eee;
                font-weight: 500;
                color: #495057;
              }
              .rdrWeekDay {
                color: #adb5bd;
                font-weight: 600;
                text-transform: capitalize;
              }
              .rdrDayToday .rdrDayNumber span:after {
                background: transparent;
                border: 1px solid #ddd;
                border-radius: 4px;
              }
              .rdrDayNumber span {
                font-weight: 500;
              }
              .rdrSelected, .rdrInRange, .rdrStartEdge, .rdrEndEdge {
                top: 4px;
                bottom: 4px;
              }
              .rdrDayStartEdge {
                 border-top-left-radius: 6px;
                 border-bottom-left-radius: 6px;
              }
              .rdrDayEndEdge {
                 border-top-right-radius: 6px;
                 border-bottom-right-radius: 6px;
              }
              .rdrMonthPicker, .rdrYearPicker {
                margin: 0 5px;
              }
              .rdrMonthsHorizontal {
                gap: 10px;
              }
            `}
          </style>
          <DateRange
            ranges={range}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            months={2}
            direction="horizontal"
            showDateDisplay={false}
            rangeColors={["#5b73e8"]}
            monthDisplayFormat="MMMM yyyy"
            weekdayDisplayFormat="EE"
          />
        </div>
      )}
    </div>
  );
};


export default DateRangeInput;

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdArrowDropDown, MdClose } from "react-icons/md";
import PropTypes from 'prop-types';

const SearchableDropdown = ({ onChange, className, locations = [], value = "select", placeholder = null, height = "32px"
}) => {
    const [showInputDropdown, setShowInputDropdown] = useState(false);
    const wrapperRef = useRef(null);
    const popupRef = useRef(null);
    const [searchedItem, setSearchedItem] = useState("");
    const [selectedValue, setSelectedValue] = useState(value);
    // Viewport coordinates for the portalled panel; null until measured.
    const [popupPos, setPopupPos] = useState(null);

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    /*
     * Close on outside click.
     *
     * The panel is portalled to <body>, so it is no longer inside wrapperRef --
     * checking only the wrapper would treat every click inside the panel as an
     * outside click and shut it before a selection could register.
     */
    const handleClickOutside = (event) => {
        if (wrapperRef.current?.contains(event.target)) return;
        if (popupRef.current?.contains(event.target)) return;
        setShowInputDropdown(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    /*
     * Place the panel against the trigger, in viewport coordinates.
     *
     * It used to be position:absolute inside the field, which meant any
     * ancestor with its own stacking context -- a card that sits earlier in
     * the DOM than a later .grid-shell panel (backdrop-filter creates one)
     * -- painted over it regardless of z-index, since a z-index set inside
     * one stacking context can never outrank a later one at the same level.
     * Portalling to <body> sidesteps that entirely, the same fix already
     * used for DateRangeInput.
     *
     * useLayoutEffect so the measurement lands before paint; otherwise the
     * panel renders at 0,0 for a frame and visibly jumps into place.
     */
    useLayoutEffect(() => {
        if (!showInputDropdown) return undefined;

        const place = () => {
            const trigger = wrapperRef.current?.getBoundingClientRect();
            if (!trigger) return;

            const GAP = 4;
            const popupHeight = popupRef.current?.getBoundingClientRect()?.height ?? 0;

            const below = trigger.bottom + GAP;
            const fitsBelow = below + popupHeight <= window.innerHeight - 8;
            const top = fitsBelow ? below : Math.max(8, trigger.top - GAP - popupHeight);

            setPopupPos({ top, left: trigger.left, width: trigger.width });
        };

        place();
        // Anything that moves the trigger moves the panel with it. `true` to
        // catch scrolling of inner containers, not just the window.
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => {
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        };
    }, [showInputDropdown]);

    useEffect(() => {
        if (!showInputDropdown) {
            // Discard the previous placement, so the next open measures
            // fresh rather than flashing where the trigger used to be.
            setPopupPos(null);
        }
    }, [showInputDropdown]);

    const handleCancel = () => {
        setSelectedValue("select");
        setSearchedItem("");
        onChange(null);
        setShowInputDropdown(false);
    };

    const filteredItems = useMemo(() => {
        if (!searchedItem.trim()) return locations;

        const trimmedSearch = searchedItem.trim().toLowerCase();
        return locations.filter((ele) =>
            ele?.name?.toLowerCase()?.includes(trimmedSearch)
        );
    }, [searchedItem, locations]);

    return (
        <div
            className={`position-relative bg-white ${className}`}
            ref={wrapperRef}
            style={{ width: "100%" }}
        >
            <div
                className="flex items-center rounded px-2 border border-dark-subtle cursor-pointer"
                style={{ height: height }}
                onClick={() => setShowInputDropdown(!showInputDropdown)}
                aria-haspopup="listbox"
                aria-expanded={showInputDropdown}
            >
                <div className="grow text-ink-muted">
                    {typeof selectedValue === 'object' ? selectedValue?.name : selectedValue}
                </div>
                <div className="flex items-center">
                    {selectedValue !== "select" && (
                        <MdClose
                            className="mr-1"
                            style={{ width: '18px', height: '18px' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCancel();
                            }}
                        />
                    )}
                    <MdArrowDropDown
                        className={`ms-1 transition ${showInputDropdown ? "rotate-180" : ""}`}
                        style={{ width: '24px', height: '24px' }}
                    />
                </div>
            </div>

            {showInputDropdown && createPortal(
                <div
                    ref={popupRef}
                    className="fixed bg-white border shadow-lg overflow-y-hidden p-2"
                    style={{
                        top: popupPos?.top ?? 0,
                        left: popupPos?.left ?? 0,
                        width: popupPos?.width ?? undefined,
                        overflowX: "hidden",
                        zIndex: 1060,
                        visibility: popupPos ? "visible" : "hidden",
                    }}
                >
                    <div className="relative">
                        <input
                            type="text"
                            value={searchedItem}
                            onChange={(e) => setSearchedItem(e.target.value)}
                            className="form-control border border-dark-subtle form-control-sm"
                            style={{ height: '30px', position: "absolute", top: -35, left: 0 }}
                            placeholder={placeholder ? placeholder : "Search..."}
                            autoFocus
                        />

                        <div
                            className="overflow-auto h-full"
                            style={{ maxHeight: '160px', marginTop: "30px", overflowX: "hidden" }}
                            role="listbox"
                        >
                            <div
                                className="dropdown-item pt-1 pb-1 text-wrap text-danger-500"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleCancel()}
                            >
                                Clear selection
                            </div>

                            {filteredItems.length >= 1 ? (
                                filteredItems.map((info, idx) => (
                                    <div
                                        key={idx}
                                        className={`dropdown-item pt-1 pb-1 text-wrap ${value === info.name ? "bg-dark text-light" : "text-dark"}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const value = info.name;
                                            setSelectedValue(value);
                                            setSearchedItem("");
                                            onChange(info);
                                            setShowInputDropdown(false);
                                        }}
                                        role="option"
                                        aria-selected={value === info.name}
                                    >
                                        {info.name}
                                    </div>
                                ))
                            ) : (
                                searchedItem.length > 2 && (
                                    <p className="text-ink-muted">No result found</p>
                                )
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

SearchableDropdown.propTypes = {
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
    locations: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired
        })
    ),
    value: PropTypes.string
};

export default SearchableDropdown;

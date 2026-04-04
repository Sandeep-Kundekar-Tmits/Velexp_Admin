import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MdArrowDropDown, MdClose } from "react-icons/md";
import PropTypes from 'prop-types';

const SearchableDropdown = ({ onChange, className, locations = [], value = "select", placeholder = null, height = "32px"
}) => {
    const [showInputDropdown, setShowInputDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [searchedItem, setSearchedItem] = useState("");
    const [selectedValue, setSelectedValue] = useState(value);
    
    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowInputDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
            ref={dropdownRef}
            style={{ width: "100%", zIndex: "999" }}
        >
            <div
                className="d-flex align-items-center rounded px-2 border border-dark-subtle cursor-pointer"
                style={{ height: height }}
                onClick={() => setShowInputDropdown(!showInputDropdown)}
                aria-haspopup="listbox"
                aria-expanded={showInputDropdown}
            >
                <div className="flex-grow-1 text-muted">
                    {typeof selectedValue === 'object' ? selectedValue?.name : selectedValue}
                </div>
                <div className="d-flex align-items-center">
                    {selectedValue !== "select" && (
                        <MdClose
                            className="me-1"
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

            {showInputDropdown && (
                <div
                    className="position-absolute w-100 bg-white border shadow-lg overflow-y-hidden start-0 p-2"
                    style={{ overflowX: "hidden", zIndex: 1000 }}
                >
                    <div className="position-relative">
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
                            className="overflow-auto h-100"
                            style={{ maxHeight: '160px', marginTop: "30px", overflowX: "hidden" }}
                            role="listbox"
                        >
                            <div
                                className="dropdown-item pt-1 pb-1 text-wrap text-danger"
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
                                    <p className="text-muted">No result found</p>
                                )
                            )}
                        </div>
                    </div>
                </div>
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
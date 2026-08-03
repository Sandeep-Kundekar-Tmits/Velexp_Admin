import React from "react";
import { UncontrolledPopover, PopoverBody } from "@/components/ui";
import PropTypes from "prop-types";

/**
 * A reusable component to display selected items from a multi-select dropdown as removable tags.
 * If the number of items exceeds a limit, it shows an overflow indicator with a popover.
 */
const SelectedItemsDisplay = ({ selectedItems, onRemove, targetId, maxDisplay = 2, placeholder = "All" }) => {
    if (!selectedItems || selectedItems.length === 0) {
        return (
            <div 
                className="flex items-center justify-center grow" 
                style={{ 
                    marginLeft: "10px", 
                    color: "#9da7b1", 
                    fontSize: "13px", 
                    fontWeight: "500",
                    border: "1px dashed #ced4da",
                    borderRadius: "8px",
                    padding: "8px 15px",
                    backgroundColor: "#f8f9fa",
                    minHeight: "38px"
                }}
            >
                {placeholder}
            </div>
        );
    }

    const displayItems = selectedItems.slice(0, maxDisplay);
    const overflowItems = selectedItems.slice(maxDisplay);
    const overflowCount = overflowItems.length;

    const Tag = ({ item }) => (
        <div
            className="flex items-center"
            style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "500",
                backgroundColor: "#f2f8ff",
                color: "#6c757d",
                border: "1px solid #c7e0ff",
                cursor: "pointer",
                whiteSpace: "nowrap"
            }}
        >
            {item.label}
            <span
                className="ml-4 cursor-pointer"
                onClick={() => onRemove(item)}
                style={{
                    fontSize: "14px",
                    color: "#999",
                    display: "flex",
                    alignItems: "center"
                }}
            >
                &times;
            </span>
        </div>
    );

    return (
        <div className="flex items-center gap-2 flex-nowrap" style={{ marginLeft: "10px" }}>
            {displayItems.map((item, index) => (
                <Tag key={index} item={item} />
            ))}
            {overflowCount > 0 && (
                <React.Fragment>
                    <div
                        id={targetId}
                        className="badge bg-brand-500 text-white flex items-center justify-center"
                        style={{ width: "30px", minWidth: "30px", height: "30px", borderRadius: "50%", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                    >
                        +{overflowCount}
                    </div>
                    <UncontrolledPopover placement="bottom" target={targetId} trigger="legacy">
                        <PopoverBody className="p-2">
                            <div className="flex flex-col gap-2" style={{ maxHeight: "200px", overflowY: "auto", minWidth: "150px" }}>
                                {overflowItems.map((item, index) => (
                                    <Tag key={index} item={item} />
                                ))}
                            </div>
                        </PopoverBody>
                    </UncontrolledPopover>
                </React.Fragment>
            )}
        </div>
    );
};

SelectedItemsDisplay.propTypes = {
    selectedItems: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.any.isRequired
        })
    ).isRequired,
    onRemove: PropTypes.func.isRequired,
    targetId: PropTypes.string.isRequired
};

export default SelectedItemsDisplay;

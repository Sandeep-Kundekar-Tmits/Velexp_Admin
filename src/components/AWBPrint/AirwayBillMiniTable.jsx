import React from "react";
import { format } from "date-fns";
import Barcode from "react-barcode";


// const formatted = format(new Date(), "dd-MM-yyyy");

const AirwayBillMiniTable = React.forwardRef(({ data }, ref) => {
  const {
    dateTime = "",
    packages = "",
    origin = "",
    destination = "",
    mawb = "",
    mode = "",
    Shipper = "",
    consignee = "",
  } = data;

  return (
    <div
      ref={ref}
      // Physical output: opts this subtree out of the dark theme. A barcode on
      // a dark field will not scan, and a dark label wastes toner.
      data-print-surface=""
      className="border flex justify-center"
      style={{
        width: "75mm",
        height: "85mm", // from  75mm  to 95mm
        paddingTop: "8mm",
        fontSize: "10px",
        boxSizing: "border-box",
        border: "solid black 1px"
      }}
    >
      <div style={{ width: "60mm" }}>
        <div className="mx-auto ">
          <Barcode
            value={mawb}
            format="CODE128"
            width={1.7}
            height={26}   // 14mm → px conversion
            displayValue={true}
            fontOptions=""
            fontSize={14}
            margin={10}
            background="#ffffff"
          />
        </div>
        {/* Hidden headings */}
        <div className="flex justify-between">
          <div style={{ width: "25mm", visibility: "hidden", height: "4mm" }}>
            Date/Time
          </div>
          <div style={{ width: "25mm", visibility: "hidden", height: "4mm" }}>
            Packages
          </div>
        </div>

        {/* Row 1 */}
        <div className="flex justify-between">
          <div style={{ width: "25mm", fontWeight: "bold", padding: "3px" }}>
            {format(dateTime, "dd-MM-yyyy")}
            {/* {dateTime} */}
          </div>
          <div style={{ width: "25mm", fontWeight: "bold", padding: "3px" }}>
            {packages}
          </div>
        </div>

        {/* Hidden headings */}
        <div className="flex justify-between">
          <div style={{ width: "25mm", visibility: "hidden", height: "4mm" }}>
            Origin
          </div>
          <div style={{ width: "25mm", visibility: "hidden", height: "4mm" }}>
            Destination
          </div>
        </div>

        {/* Row 2 */}
        <div className="" style={{ marginTop: "2mm" }}>
          <div className="flex justify-between">
            <div style={{ width: "25mm", fontWeight: "bold", padding: "2px" }}>
              {origin}
            </div>
            <div style={{ width: "25mm", fontWeight: "bold", padding: "2px" }}>
              {destination}
            </div>
          </div>

          {/* Hidden headings */}
          <div className="flex justify-between">
            <div style={{ width: "25mm", visibility: "hidden", height: "4mm" }}>
              MAWB
            </div>
            <div style={{ width: "25mm", visibility: "hidden", height: "4mm" }}>
              Mode
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ marginTop: "2mm" }}>
          <div className="flex justify-between">
            <div style={{ width: "25mm", fontWeight: "bold", padding: "2px" }}>
              {mawb}
            </div>
            <div style={{ width: "25mm", fontWeight: "bold", padding: "2px" }}>
              {mode}
            </div>
          </div>

          {/* Hidden headings */}
          <div className="flex justify-between">
            <div style={{ width: "25mm", visibility: "hidden", height: "4mm" }}>
              Shipper
            </div>
            <div style={{ width: "25mm", visibility: "hidden", height: "4mm" }}>
              Consignee
            </div>
          </div>
        </div>

        {/* Row 4 */}
        <div className="flex justify-between" style={{ marginTop: "2mm" }}>
          <div style={{ width: "25mm", fontWeight: "bold", padding: "2px" }}>
            {Shipper}
          </div>
          <div style={{ width: "25mm", fontWeight: "bold", padding: "2px" }}>
            {consignee}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AirwayBillMiniTable;

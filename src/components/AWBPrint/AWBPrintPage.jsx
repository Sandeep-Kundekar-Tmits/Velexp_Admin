import React, { useState } from "react";
import AWBPage from "./AWBPage";

const AWBPrintPage = () => {
    const [awbNo, setAwbNo] = useState("");
    const [showPage, setShowPage] = useState(false);

    const handlePrint = () => {
        if (!awbNo.trim()) {
            alert("Please enter AWB No");
            return;
        }
        setShowPage(true);
    };

    // When Print is clicked → Load AWBPage
    if (showPage) {
        return <AWBPage awbNo={awbNo} onBack={() => {
            setShowPage(false)
        }} />;
    }

    return (
        <div className='page-content'>
            <div className="container-fluid">

                {/* Header */}
                <div className="d-flex justify-content-between mb-3 align-items-center border-bottom pb-2">
                    <h3>AWB Label Print</h3>
                </div>

                {/* Form Section */}
                <div className="mt-4 w-100 d-flex justify-content-center align-content-between">
                    <div style={{ width: "400px" }}>
                        <label className="form-label fw-semibold">AWB</label>

                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter AWB No."
                            value={awbNo}
                            onChange={(e) => setAwbNo(e.target.value)}
                        />

                        <button
                            className="btn btn-primary w-100 mt-4 py-2 fw-bold"
                            onClick={handlePrint}
                        >
                            Print
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AWBPrintPage;

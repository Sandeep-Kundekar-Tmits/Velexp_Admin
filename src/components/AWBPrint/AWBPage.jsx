import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AirwayBillMiniTable from "./AirwayBillMiniTable";

const AWBPage = ({ awbNo = "", onBack }) => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const labelsRef = useRef(null);
  const orderId = awbNo;

  // Fetch Labels
  useEffect(() => {
    if (!orderId) return;

    const fetchLabels = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `https://velexp.com/label-api/get-labels-by-orderid/${orderId}/`
        );
        const result = await response.json();

        if (Array.isArray(result.bookings)) {
          setLabels(result.bookings);
        } else {
          setLabels([]);
        }
      } catch (err) {
        console.error("ERROR FETCHING LABELS:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLabels();
  }, [orderId]);

  // ------------------------------
  // 📄 DOWNLOAD PDF USING HTML2CANVAS + jsPDF
  let WIDTH = 75
  let HEIGHT = 85
  // ------------------------------
  const handleDownloadPDF = async () => {
    if (labels.length === 0) return;

    setPdfLoading(true);

    try {
      const MM_TO_PX = 3.78;
      const labelSizePx = WIDTH * MM_TO_PX; // 283.5px
      const labelSizePxH = HEIGHT * MM_TO_PX; // 283.5px
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [WIDTH, HEIGHT],
      });

      const elements = labelsRef.current.querySelectorAll(".label-item");

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        // Force the element to exact mm-pixel size
        el.style.width = `${labelSizePx}px`;
        el.style.height = `${labelSizePxH}px`;

        const canvas = await html2canvas(el, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");

        if (i !== 0) pdf.addPage([WIDTH, HEIGHT]);

        // Insert image EXACTLY fitting the PDF page
        pdf.addImage(imgData, "PNG", 0, 0, WIDTH, HEIGHT);
      }

      pdf.save(`AWB_${orderId}.pdf`);
    } catch (error) {
      console.error("PDF creation error:", error);
    }

    setPdfLoading(false);
  };


  // ------------------------------
  // 🔙 Back Button Logic
  // ------------------------------
  const handleBack = () => {
    if (onBack) {
      onBack(); // If parent provided callback
    } else {
      window.history.back(); // Default browser back
    }
  };

  return (
    <div className="p-4">
      {/* Back Button */}
      <button className="btn btn-outline-secondary mb-3" onClick={handleBack}>
        ← Back
      </button>

      <h2 className="text-lg font-semibold mb-4">
        Labels for AWB: <strong>{orderId}</strong>
      </h2>

      {/* API Loading */}
      {loading && (
        <div className="text-center mb-3">
          <div className="spinner-border text-primary" role="status"></div>
          <p>Loading labels…</p>
        </div>
      )}

      {/* PDF Download */}
      {labels.length > 0 && !loading && (
        <button
          onClick={handleDownloadPDF}
          className="btn btn-success mb-4"
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Generating PDF…
            </>
          ) : (
            "Download"
          )}
        </button>
      )}

      {labels.length === 0 && !loading && (
        <p className="text-muted">No labels found for this AWB.</p>
      )}

      {/* LABEL RENDERING */}
      <div ref={labelsRef} className="mt-4 d-flex flex-column gap-4">
        {labels.map((item) => (
          <div className="label-item" key={item.id}>
            <AirwayBillMiniTable
              data={{
                dateTime: item.scheduleddate,
                packages: item.quantity,
                origin: item.origin,
                destination: item.destination,
                mawb: item.awbno,
                mode: item.mode,
                consignor: item.consigner,
                consignee: item.consignee,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AWBPage;

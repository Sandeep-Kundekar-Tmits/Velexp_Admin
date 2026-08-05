import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AirwayBillMiniTable from "./AirwayBillMiniTable";
import MainHeaderComp from "../MainHeaderCom";
import { Button } from "@/components/ui";
import Loader from "@/Loaders/Loader";

import { authFetch } from "@/lib/http";
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
        const response = await authFetch(
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
    /* The same page shell as the lookup screen it replaces, so stepping from
       one to the other does not change the page's frame. Only the chrome is
       themed -- the labels below carry data-print-surface and stay light, or
       a barcode on a dark field will not scan. */
    <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
      <MainHeaderComp
        title="AWB Label Print"
        subTitle={`Labels for AWB ${orderId}`}
        extraFields={
          <div className="flex items-center gap-2">
            <Button onClick={handleBack} className="table-action-btn table-action-btn-ghost">
              ← Back
            </Button>
            {labels.length > 0 && !loading && (
              <Button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="table-action-btn table-action-btn-export"
              >
                {pdfLoading ? "Generating PDF…" : "Download PDF"}
              </Button>
            )}
          </div>
        }
      />

      <div className="container-fluid relative z-10 px-4 pb-4">
        {/* The shared loader, not a raw .spinner-border: that class has no
            definition left in the compat layer, so it rendered as nothing at
            all while the labels were fetching. */}
        {loading && <Loader message="Loading labels…" fullscreen={false} />}

        {labels.length === 0 && !loading && (
          <p className="m-0 rounded-xl border border-white/8 bg-white/2 px-4 py-12 text-center text-[13px] text-ink-muted">
            No labels found for this AWB.
          </p>
        )}

        {/* LABEL RENDERING.
            items-start so a label keeps its own printed width instead of being
            stretched across the page by the flex column. */}
        <div ref={labelsRef} className="mt-4 flex flex-col items-start gap-6">
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
    </div>
  );
};

export default AWBPage;

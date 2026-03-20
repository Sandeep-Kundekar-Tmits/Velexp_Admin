import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Button } from 'reactstrap';
import { usePDF } from 'react-to-pdf';
import { numberToWords, amountToWords } from "amount-to-words";

// Logo and signature imports (you'll need to have these files in your assets)
import VellocityExpressIcon from "../assets/images/vellocity-express-logo.png";
import Signature from "../assets/images/PDFsignature.png";
// import QR from "../assets/images/qrcode.jpeg";

const CorporateInvoiceGenerate = React.forwardRef(({ invoiceData }, ref) => {
  // const { toPDF, targetRef } = usePDF({
  //   filename: `invoice_${invoiceData?.invoice_no || 'invoice'}.pdf`,
  //   page: {
  //     margin: 10,
  //     timeout: 30000,
  //   },
  // });

  //   const handleDownload = async () => {
  //     setIsGenerating(true);
  //     try {
  //       await toPDF();
  //     } catch (error) {
  //       console.error("PDF generation failed:", error);
  //       alert("Failed to generate PDF. Please try again.");
  //     } finally {
  //       setIsGenerating(false);
  //     }
  //   };

  // Calculate totals
  const totals = invoiceData?.items?.reduce(
    (acc, item) => ({
      quantity: acc.quantity + (item.quantity || 0),
      freight: acc.freight + (item.freight || 0),
      cgst: acc.cgst + (item.cgst || 0),
      sgst: acc.sgst + (item.sgst || 0),
      igst: acc.igst + (item.igst || 0),
      total: acc.total + (item.total || 0),
    }),
    { quantity: 0, freight: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <Container className="my-2" style={{ position: 'absolute', left: '-9999px' }} >
      <div className="invoice-container text-black" style={{ fontSize: "16px" }} ref={ref} >
        <div>
          {/* Header Section */}
          <Row className="mb-4">
            <Col>
              <img src={VellocityExpressIcon} style={{ width: "220px", height: "70px" }} alt="Vellocity Express" />
            </Col>
            <Col className='d-flex flex-column justify-content-end align-items-end'>
              <h6 className="mb-1 font-size-16 fw-bolder">TAX INVOICE</h6>
              <p className="mb-1"><strong>Inv. No:</strong> {invoiceData?.invoice_no || 'N/A'}</p>
              <p className=''><strong>Inv. Date:</strong> {formatDate(invoiceData?.invoice_date)}</p>
            </Col>
          </Row>

          {/* From/To Sections */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="">
                <h5>To,</h5>
                <p className="mb-1"><strong>{invoiceData?.to_name || '(Name not provided)'}</strong></p>
                {invoiceData?.to_address && <p className="mb-1">{invoiceData.to_address}</p>}
                {(invoiceData?.to_city || invoiceData?.to_state || invoiceData?.to_pincode) && (
                  <p className="mb-1">
                    {[invoiceData?.to_city, invoiceData?.to_state, invoiceData?.to_pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
                <p className="mb-1"><strong>STATE CODE:</strong> {invoiceData?.to_state_code || '(Not Provided)'}</p>
                <p className="mb-1"><strong>GST NO:</strong> {invoiceData?.to_gst_no || '(Not Provided)'}</p>
                <p className="mb-0"><strong>PAN NO:</strong> {invoiceData?.to_pan_no || '(Not Provided)'}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex flex-column justify-content-end align-items-end">
                <h5>From,</h5>
                <p className="mb-1"><strong>{invoiceData?.from_name}</strong></p>
                {invoiceData?.from_address && <p className="mb-1" style={{ textAlign: "end" }}>{invoiceData.from_address}</p>}
                <p className="mb-1">
                  {[
                    invoiceData?.from_city,
                    invoiceData?.from_state,
                    invoiceData?.from_pincode
                  ].filter(Boolean).join(', ')}
                </p>
                <p className="mb-1"><strong>STATE CODE:</strong> {invoiceData?.from_state_code || 'N/A'}</p>
                <p className="mb-1"><strong>GST NO:</strong> {invoiceData?.from_gst_no || 'N/A'}</p>
                <p className="mb-0"><strong>PAN NO:</strong> {invoiceData?.from_pan_no || 'N/A'}</p>
              </div>
            </Col>
          </Row>

          {/* Invoice Table */}
          <Table className="mb-0 text-black table-hover" style={{ borderColor: "black", color: "black !important" }}>
            <thead style={{ border: "solid black 1px" }}>
              <tr>
                <th style={{ border: "solid black 1px" }}>S.No.</th>
                {/* <th className="w-25" style={{ border: "solid black 1px" }}>Description</th> */}
                <th style={{ border: "solid black 1px" }}>Quantity</th>
                <th style={{ border: "solid black 1px" }}>Total</th>

                {/* Conditional Tax Columns */}
                {invoiceData?.total_igst > 0 ? (
                  <th style={{ border: "solid black 1px" }}>IGST (18%)</th>
                ) : (
                  <>
                    <th style={{ border: "solid black 1px" }}>CGST (9%)</th>
                    <th style={{ border: "solid black 1px" }}>SGST (9%)</th>
                  </>
                )}

                <th style={{ border: "solid black 1px" }}>Total.Inv.Amount</th>
              </tr>
            </thead>

            <tbody>
              {invoiceData?.items?.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ border: "solid black 1px" }}>{index + 1}.</td>
                  <td style={{ border: "solid black 1px" }}>{item?.quantity || 0}</td>
                  <td style={{ border: "solid black 1px" }}>{item?.freight?.toFixed(2) || "0.00"}</td>
                  
                  {invoiceData?.total_igst > 0 ? (
                    <td style={{ border: "solid black 1px" }}>{item?.igst?.toFixed(2) || "0.00"}</td>
                  ) : (
                    <>
                      <td style={{ border: "solid black 1px" }}>{item?.cgst?.toFixed(2) || "0.00"}</td>
                      <td style={{ border: "solid black 1px" }}>{item?.sgst?.toFixed(2) || "0.00"}</td>
                    </>
                  )}
                  
                  <td style={{ border: "solid black 1px" }}>{item?.total?.toFixed(2) || "0.00"}</td>
                </tr>
              ))}
              
              <tr className="fw-bold">
                <td colSpan={1} className="text-end" style={{ border: "solid black 1px" }}>
                  Grand Total
                </td>
                <td style={{ border: "solid black 1px" }}>{invoiceData?.total_quantity || 0}</td>
                <td style={{ border: "solid black 1px" }}>{invoiceData?.total_freight?.toFixed(2) || "0.00"}</td>
                
                {invoiceData?.total_igst > 0 ? (
                  <td style={{ border: "solid black 1px" }}>{invoiceData?.total_igst?.toFixed(2) || "0.00"}</td>
                ) : (
                  <>
                    <td style={{ border: "solid black 1px" }}>{invoiceData?.total_cgst?.toFixed(2) || "0.00"}</td>
                    <td style={{ border: "solid black 1px" }}>{invoiceData?.total_sgst?.toFixed(2) || "0.00"}</td>
                  </>
                )}
                
                <td style={{ border: "solid black 1px" }}>{invoiceData?.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            </tbody>
          </Table>


          {/* Amount in Words */}
          <p className="ps-2 py-2" style={{ border: "solid black 1px", borderTop: 0 }}>
            <strong>Amount in words:</strong>{" "}
            {(() => {
              const result = amountToWords(totals?.total || 0, 2);

              let words = result.numberInWords
                ? `${result.numberInWords} RUPEES`
                : "";

              if (result.decimalInWords && result.decimalInWords !== "Zero Zero") {
                words += ` AND ${result.decimalInWords} PAISE`;
              }

              return (words + " ONLY").toUpperCase();
            })()} </p>

          {/* Footer Sections */}
          <Row className='mt-3'>
            <Col md={8} className='d-flex justify-content-start'>
              <div className="text-center mb-4">
                <p className='mb-0'>Kindly acknowledge the receipt.</p>
                <p className='mb-0 text-start'>Thanking You,</p>
                <div>
                  <img src={Signature} style={{ width: "210px", height: "90px" }} alt="Signature" />
                </div>
                <p className="mb-1 mt-3 text-start"><strong>Authorised Signatory</strong></p>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-3" style={{ border: "solid black 1px" }}>
                <h5>Bank Detail for Payment</h5>
                <p className="mb-1"><strong>Account Title:</strong> PNSO Technology Private Limited</p>
                <p className="mb-1"><strong>Bank Name:</strong> HDFC Bank</p>
                <p className="mb-1"><strong>Bank Branch:</strong> Sahar Road, Mumbai</p>
                <p className="mb-1"><strong>A/c No:</strong> 50200098503993</p>
                <p className="mb-1"><strong>A/c Type:</strong> Current</p>
                <p className="mb-0"><strong>IFSC Code:</strong> HDFC0000668</p>
              </div>
            </Col>
          </Row>

          {/* Additional Information */}
          <Row>
            <Col md={8}>
              <div className="pt-3 mb-4">
                {/* <p className="mb-1">{invoiceData?.created_by?.first_name} {invoiceData?.created_by?.last_name}</p> */}
                <p className="mb-1"><strong>GST No:</strong> {invoiceData?.from_gst_no || 'N/A'}</p>
                <p className="mb-1"><strong>Category:</strong> COURIER SERVICE</p>
                <p className="mb-1"><strong>PAN No:</strong>AAOCP7860J</p>
                <p className="mb-1"><strong>Corporate Identity Number:</strong> U53200PN2024PTC231459</p>
                <p className="mb-1"><strong>SAC CODE:</strong> 996812</p>
                <p className="mb-1"><strong>Whether the tax is payable on reverse charge basis:</strong> NO</p>
                <p className="mb-0"><em>* This is a Computer Generated Invoice * For inquiries, contact us at velexp.com</em></p>
              </div>
            </Col>
            <Col md={4}>
              {(() => {
                const awb = invoiceData?.invoice_no || "";
                const amount = (invoiceData?.total_amount || 0).toFixed(2);

                const upiUrl = `upi://pay?pa=Vyapar.171035895923@hdfcbank&pn=PNSO%20TECHNOLOGY%20PRIVATE&cu=INR&mc=4215&mode=02&mam=STQD4554092172622489623&tid=STQD4554092172622489623&tn=Inv%20${awb}`;

                const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

                return (
                  <div className="mt-4 d-flex flex-column align-items-start border-top pt-4">
                    <p className="fw-bold mb-1 text-primary" style={{ fontSize: "16px" }}>Scan for Payment</p>
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      style={{ width: "176px", height: "176px", objectFit: "contain" }}
                    />
                    <p className="text-muted fw-bold text-uppercase mt-1" style={{ fontSize: "12px" }}>AWB: {awb}</p>
                  </div>
                );
              })()}
            </Col>
          </Row>
        </div>
      </div>

      {/* Download Button */}
      {/* <Button
        color='primary'
        className='mt-2'
        onClick={handleDownload}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating PDF...' : 'Download PDF'}
      </Button> */}
    </Container>
  );
})
export default CorporateInvoiceGenerate;
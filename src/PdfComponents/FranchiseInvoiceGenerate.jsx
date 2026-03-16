import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Button } from 'reactstrap';
import { usePDF } from 'react-to-pdf';
import { numberToWords, amountToWords } from "amount-to-words";

// Logo and signature imports (you'll need to have these files in your assets)
import VellocityExpressIcon from "../assets/images/vellocity-express-logo.png";
import Signature from "../assets/images/PDFsignature.png";

const FranchiseInvoiceGenerate = React.forwardRef(({ invoiceData }, ref) => {
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
      <div className="invoice-container" ref={ref} >
        <div>
          {/* Header Section */}
          <Row className="mb-4">
            <Col>
              <img src={VellocityExpressIcon} style={{ width: "220px", height: "70px" }} alt="Vellocity Express" />
            </Col>
            <Col className='d-flex flex-column justify-content-end align-items-end'>
              <h6 className="mb-1 fw-bolder">TAX INVOICE</h6>
              <p className="mb-1 small"><strong>Inv. No:</strong> {invoiceData?.invoice_no || 'N/A'}</p>
              <p className='small'><strong>Inv. Date:</strong> {formatDate(invoiceData?.invoice_date)}</p>
            </Col>
          </Row>

          {/* From/To Sections */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="small">
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
              <div className="small d-flex flex-column justify-content-end align-items-end">
                <h5>From,</h5>
                <p className="mb-1"><strong>{invoiceData?.from_name}</strong></p>
                {invoiceData?.from_address && <p className="mb-1">{invoiceData.from_address}</p>}
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
          <Table bordered className="mb-0 small table-hover">
            <thead>
              <tr>
                <th>S.No.</th>
                {/* <th className="w-25">Description</th> */}
                <th>Quantity</th>
                <th>Total</th>

                {/* ✅ Show IGST if present, else CGST + SGST */}
                {invoiceData?.total_igst > 0 ? (
                  <th>IGST (18%)</th>
                ) : (
                  <>
                    <th>CGST (9%)</th>
                    <th>SGST (9%)</th>
                  </>
                )}

                <th>Total.Inv.Amount</th>
              </tr>
            </thead>

            <tbody>
              {invoiceData?.items?.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}.</td>
                  {/* <td>{item?.description || "N/A"}</td> */}
                  <td>{item?.quantity || 0}</td>
                  <td>{item?.freight?.toFixed(2) || "0.00"}</td>

                  {/* ✅ Conditional IGST / CGST + SGST for each row */}
                  {invoiceData?.total_igst > 0 ? (
                    <td>{item?.igst?.toFixed(2) || "0.00"}</td>
                  ) : (
                    <>
                      <td>{item?.cgst?.toFixed(2) || "0.00"}</td>
                      <td>{item?.sgst?.toFixed(2) || "0.00"}</td>
                    </>
                  )}

                  <td>{item?.total?.toFixed(2) || "0.00"}</td>
                </tr>
              ))}


              {/* ✅ Grand Total Row */}
              <tr className="fw-bold">
                {/* Merge first two columns for label */}
                <td colSpan={1} className="text-end">
                  Grand Total
                </td>

                <td>{invoiceData?.total_quantity || 0}</td>
                <td>{invoiceData?.total_freight?.toFixed(2) || "0.00"}</td>

                {invoiceData?.total_igst > 0 ? (
                  <td>{invoiceData?.total_igst?.toFixed(2) || "0.00"}</td>
                ) : (
                  <>
                    <td>{invoiceData?.total_cgst?.toFixed(2) || "0.00"}</td>
                    <td>{invoiceData?.total_sgst?.toFixed(2) || "0.00"}</td>
                  </>
                )}

                <td>{invoiceData?.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            </tbody>
          </Table>


          {/* Amount in Words */}
          <p className="border ps-2 py-2">
            <strong>Amount in words:</strong>{" "}
            {(() => {
              const result = amountToWords(totals?.total || 0, 2);

              let words = result.numberInWords
                ? `${result.numberInWords} RUPEES`
                : "ZERO RUPEES";

              if (result.decimalInWords && result.decimalInWords !== "Zero Zero") {
                words += ` AND ${result.decimalInWords} PAISE`;
              }

              return (words + " ONLY").toUpperCase();
            })()}
          </p>


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
              <div className="border p-3 small">
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
          <div className="pt-3 mb-4 small">
            {/* <p className="mb-1">{invoiceData?.created_by?.first_name} {invoiceData?.created_by?.last_name}</p> */}
            <p className="mb-1"><strong>GST No:</strong> {invoiceData?.from_gst_no || 'N/A'}</p>
            <p className="mb-1"><strong>Category:</strong> COURIER SERVICE</p>
            <p className="mb-1"><strong>PAN No:</strong>AAOCP7860J</p>
            <p className="mb-1"><strong>Corporate Identity Number:</strong> U53200PN2024PTC231459</p>
            <p className="mb-1"><strong>SAC CODE:</strong> 996812</p>
            <p className="mb-1"><strong>Whether the tax is payable on reverse charge basis:</strong> NO</p>
            <p className="mb-0"><em>* This is a Computer Generated Invoice * For inquiries, contact us at velexp.com</em></p>
          </div>
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
export default FranchiseInvoiceGenerate;
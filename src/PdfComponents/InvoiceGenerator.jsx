import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Table, Button } from 'reactstrap';
import VellocityExpressIcon from "../assets/images/vellocity-express-logo.png"
import Signature from "../assets/images/PDFsignature.png"
import { usePDF } from 'react-to-pdf';
import { numberToWords, amountToWords } from "amount-to-words";
const CheckInvoice = (invoice) => {
  let obj = {
    manual: "manual",
    franchise: "franchise",
    corporate: "corporate",
    intl_retail: "intl_retail",
    retail: "retail"
  }

  if (invoice.type_of_invoice !== null) {
    return obj[invoice.type_of_invoice]
  }

  if (invoice.type_of_invoice === null) {
    let isManual = invoice?.items[0]?.description
    let isOrigin = invoice?.items[0]?.origin
    //  checking the items
    if (isManual) {
      return "manual"
    }
    if (isOrigin) {
      return "corporate"
    }
    return "franchise"
  }
}
const InvoiceGenerator = ({ invoiceData }) => {

  const { toPDF, targetRef } = usePDF({
    filename: `invoice_${invoiceData?.invoice_no || 'invoice'}.pdf`,
    page: {
      margin: 10, // Reduce margin to prevent overflow
      timeout: 30000, // Increase timeout (30s)
    },
  });


  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await toPDF();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const totalsAmounts = invoiceData.items.reduce(
    (acc, item) => ({
      quantity: acc.quantity + (item.quantity || 0),
      shipments: acc.shipments + (item.shipments || 0),
      freight: acc.freight + (item.freight || 0),
      cgst: acc.cgst + (item.cgst || 0),
      sgst: acc.sgst + (item.sgst || 0),
      igst: acc.igst + (item.igst || 0),
      total: acc.total + (item.total || 0),
    }),
    { quantity: 0, shipments: 0, freight: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
  );



  const renderInvoiceTable = (type) => {
    // Check if any IGST exists across items
    const hasIGST = invoiceData.total_igst > 0;
    // const hasIGST = invoiceData.items.some(item => Number(item.igst) > 0);
    const getVisibleColumns = () => {
      switch (type) {
        case 'manual':
          return ['srno', 'description', 'quantity', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total'].filter(Boolean);
        case 'corporate':
          return ['srno', 'origin', 'shipments', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst'].filter(Boolean);
        case 'franchise':
          return ['srno', 'quantity', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total']; // franchise always IGST
        case 'intl_retail':
          return ['srno', 'description', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total']
        default:
          return ['srno', 'description', 'quantity', 'rate', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total'].filter(Boolean);
      }
    };

    const visibleColumns = getVisibleColumns();
    const isVisible = (column) => visibleColumns.includes(column);

    // Calculate totals
    const totals = invoiceData.items.reduce(
      (acc, item) => ({
        quantity: acc.quantity + (item.quantity || 0),
        shipments: acc.shipments + (item.shipments || 0),
        freight: acc.freight + (item.freight || 0),
        cgst: acc.cgst + (item.cgst || 0),
        sgst: acc.sgst + (item.sgst || 0),
        igst: acc.igst + (item.igst || 0),
        total: acc.total + (item.total || 0),
      }),
      { quantity: 0, shipments: 0, freight: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );

    // Calculate columns to span for "Grand Total" label
    const getLabelColSpan = () => {
      // start with all visible columns
      let visibleCount = visibleColumns.length;

      // count numeric/amount-related columns
      let amountColumns = 0;
      if (isVisible('shipments')) amountColumns++;
      if (isVisible('quantity')) amountColumns++;
      if (isVisible('freight')) amountColumns++;
      if (isVisible('cgst')) amountColumns++;
      if (isVisible('sgst')) amountColumns++;
      if (isVisible('igst')) amountColumns++;
      if (isVisible('total')) amountColumns++;

      // Grand Total label should span remaining (non-amount) columns
      return visibleCount - amountColumns;
    };


    const labelColSpan = getLabelColSpan();
    // console.log(labelColSpan, "labelColSpan")

    return (
      <Table  className="mb-0 text-black table-hover" style={{borderColor:"black", color:"black !important"}}>
        <thead style={{border:"solid black 1px"}}>
          <tr>
            {isVisible('srno') && <th className='text-center' style={{border:"solid black 1px"}}>S.No.</th>}
            {isVisible('description') && <th className='text-center w-25'  style={{border:"solid black 1px"}}>Description</th>}
            {isVisible('origin') && <th className='text-center w-25' style={{border:"solid black 1px"}}>Origin</th>}
            {isVisible('shipments') && <th className='text-center' style={{border:"solid black 1px"}}> Shipments</th>}
            {isVisible('quantity') && <th className='text-center' style={{border:"solid black 1px"}}>Quantity</th>}
            {/* {isVisible('rate') && <th>Rate</th>} */}

            {type === "corporate"
              ? isVisible('freight') && <th className='text-center' style={{border:"solid black 1px"}}>Total Freight (Rs)</th>
              : isVisible('total') && <th className='text-center' style={{border:"solid black 1px"}}>Total</th>}

            {isVisible('cgst') && <th className='text-center' style={{border:"solid black 1px"}}>CGST (9%)</th>}
            {isVisible('sgst') && <th className='text-center' style={{border:"solid black 1px"}}>SGST (9%)</th>}
            {isVisible('igst') && <th className='text-center' style={{border:"solid black 1px"}}>IGST</th>}
            <th className='text-center' style={{border:"solid black 1px"}}>Total.Inv.Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.items.map((item, index) => (
            <tr key={item.id}>
              {isVisible('srno') && <td style={{border:"solid black 1px"}}>{index + 1}.</td>}
              {isVisible('description') && <td style={{border:"solid black 1px"}}>{item?.description}</td>}
              {isVisible('origin') && <td style={{border:"solid black 1px"}}>{item?.origin}</td>}
              {isVisible('shipments') && <td className='text-end text-black' style={{border:"solid black 1px"}}>{item?.shipments || 0}</td>}
              {isVisible('quantity') && <td className='text-end text-black' style={{border:"solid black 1px"}}>{item?.quantity}</td>}
              {/* {isVisible('rate') && <td>{item?.rate?.toFixed(2)}</td>} */}

              {type === "corporate"
                ? isVisible('freight') && <td className='text-end text-black' style={{border:"solid black 1px"}}>{(item?.freight ?? 0).toFixed(2)}</td>
                : isVisible('total') && <td className='text-end text-black' style={{border:"solid black 1px"}}>{(item?.freight ?? 0).toFixed(2)}</td>}

              {isVisible('cgst') && <td className='text-end text-black' style={{border:"solid black 1px"}}>{item?.cgst?.toFixed(2)}</td>}
              {isVisible('sgst') && <td className='text-end text-black' style={{border:"solid black 1px"}}>{item?.sgst?.toFixed(2)}</td>}
              {isVisible('igst') && <td className='text-end text-black' style={{border:"solid black 1px"}}>{item?.igst?.toFixed(2)}</td>}

              <td className='text-end' style={{border:"solid black 1px"}}>{item?.total?.toFixed(2)}</td>
            </tr>
          ))}

          {/* Grand Total Row */}
          <tr className="fw-bold" >
            {/* Empty for Sr No. */}
            {isVisible('srno') && <td style={{border:"solid black 1px"}}></td>}

            {/* Put label inside Description/Origin */}
            {isVisible('description') && <td style={{border:"solid black 1px"}} className="text-end">Grand Total</td>}
            {isVisible('origin') && <td style={{border:"solid black 1px"}} className="text-end ">Grand Total</td>}

            {isVisible('shipments') && <td className='text-end' style={{border:"solid black 1px"}}>{totals.shipments}</td>}
            {isVisible('quantity') && <td className='text-end' style={{border:"solid black 1px"}}>{totals.quantity}</td>}
            {/* {isVisible('rate') && <td>{totals?.rate?.toFixed(2)}</td>} */}
            {type === "corporate"
              ? isVisible('freight') && <td className='text-end' style={{border:"solid black 1px"}}>{(totals.freight ?? 0).toFixed(2)}</td>
              : isVisible('total') && <td className='text-end'>{(totals.freight ?? 0).toFixed(2)}</td>}

            {isVisible('cgst') && <td className='text-end' style={{border:"solid black 1px"}}>{totals.cgst?.toFixed(2)}</td>}
            {isVisible('sgst') && <td className='text-end' style={{border:"solid black 1px"}}>{totals.sgst?.toFixed(2)}</td>}
            {isVisible('igst') && <td className='text-end' style={{border:"solid black 1px"}}>{totals.igst?.toFixed(2)}</td>}

            {/* Always show final invoice amount */}
            <td className='text-end' style={{border:"solid black 1px"}}>{totals.total?.toFixed(2)}</td>
          </tr>


        </tbody>
      </Table>
    );
  };

  const [UserType, setUserType] = useState("")

  //  checking the type
  useEffect(() => {
    setUserType(CheckInvoice(invoiceData))
  }, [CheckInvoice(invoiceData)])
  return (
    <Container className="my-2">
      <div className="invoice-container text-black" style={{fontSize:"16px"}} ref={targetRef}>
        <div>
          <Row className="mb-4">
            {/* pdf icons */}
            <Col>
              <img src={VellocityExpressIcon} style={{ width: "220px", height: "auto" }} alt="" />
            </Col>

            {/* side part */}
            <Col className='d-flex flex-column justify-content-end align-items-end'>
              <h6 className=" mb-1 font-size-16 fw-bolder">TAX INVOICE</h6>
              <p className="mb-1 "><strong>Inv. No:</strong> {invoiceData?.invoice_no}</p>
              <p className=''><strong>Inv. Date:</strong> {new Date(invoiceData?.invoice_date).toLocaleDateString('en-GB')}</p>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={6}>
              <div className="">
                <h5>To,</h5>
                <p className="mb-1"><strong>{invoiceData?.to_name === "null" ? '(Name not provided)' : invoiceData?.to_name || '(Name not provided)'}</strong></p>
                {invoiceData?.to_address && (
                  <p className="mb-1" style={{width:""}}>{invoiceData?.to_address}</p>
                )}
                {(invoiceData?.to_city ||
                  invoiceData?.to_state ||
                  invoiceData?.to_pincode) && (
                    <p className="mb-1">
                      {[
                        invoiceData?.to_city,
                        invoiceData?.to_state,
                        invoiceData?.to_pincode
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                <p className="mb-1"><strong>STATE CODE:</strong> {invoiceData?.to_state_code || '(Not Available)'}</p>
                <p className="mb-1"><strong>GST NO:</strong> {invoiceData?.to_gst_no === "null" ? '(Not Provided)' : invoiceData?.to_gst_no || '(Not Provided)'}</p>
                <p className="mb-0"><strong>PAN NO:</strong> {invoiceData?.to_pan_no === "null" ? '(Not Provided)' : invoiceData?.to_pan_no || '(Not Provided)'}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex flex-column justify-content-end align-items-end">
                <h5>From,</h5>
                <p className="mb-1"><strong>{invoiceData?.from_name}</strong></p>
                {invoiceData?.from_address && <p className="mb-1" style={{textAlign:"end"}}>{invoiceData.from_address}</p>}
                <p className="mb-1">
                  {[
                    invoiceData?.from_city,
                    invoiceData?.from_state,
                    invoiceData?.from_pincode
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {invoiceData?.from_state_code && (
                  <p className="mb-1"><strong>STATE CODE:</strong> {invoiceData.from_state_code}</p>
                )}
                {invoiceData?.from_gst_no && (
                  <p className="mb-1"><strong>GST NO:</strong> {invoiceData.from_gst_no}</p>
                )}
                {invoiceData?.from_pan_no && (
                  <p className="mb-0"><strong>PAN NO:</strong> {invoiceData.from_pan_no}</p>
                )}
              </div>
            </Col>
          </Row>

          {
            renderInvoiceTable(UserType)
          }


          {/* <p className="mb-1"><strong>Total Amount:</strong> {invoiceData.total_amount.toFixed(2)}</p> */}
          {/* <p className='border ps-2 py-2'><strong>Amount in words:</strong> {invoiceData.amount_in_words}</p> */}
          <p className=" ps-2 py-2" style={{border:"solid black 1px",borderTop:0}}>
            <strong>Amount in words:</strong>{" "}
            {(() => {
              const result = amountToWords(invoiceData?.total_amount || 0, 2);

              let words = result.numberInWords
                ? `${result.numberInWords} RUPEES`
                : "";

              if (result.decimalInWords && result.decimalInWords !== "Zero Zero") {
                words += ` AND ${result.decimalInWords} PAISE`;
              }

              return words.toUpperCase();
            })()}
          </p>



          <Row className='mt-3'>
            <Col md={8} className='d-flex justify-content-start'>
              <div className="text-center mb-4">
                <p className='mb-0'>Kindly acknowledge the receipt.</p>
                <p className='mb-0 text-start'>Thanking You,</p>

                <div >
                  {/*  signiture section */}
                  <img src={Signature} style={{ width: "210px", height: "auto" }} alt="" />
                </div>

                <p className="mb-1 mt-3 text-start"><strong>Authorised Signatory</strong></p>
              </div>
            </Col>
            <Col md={4}>
              <div className="border p-3 ">
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
          <div className=" pt-3 mb-4 ">
            <p className="mb-1"><strong>GST No:</strong> {invoiceData?.from_gst_no}</p>
            <p className="mb-1"><strong>Category:</strong> COURIER SERVICE</p>
            <p className="mb-1"><strong>PAN No:</strong> {invoiceData?.from_pan_no || '(Not Provided)'}</p>
            <p className="mb-1"><strong>Corporate Identity Number:</strong> U53200PN2024PTC231459</p>
            <p className="mb-1"><strong>SAC CODE:</strong> 996812</p>
            <p className="mb-1"><strong>Whether the tax is payable on reverse charge basis:</strong> NO</p>
            <p className="mb-0"><em>* This is a Computer Generated Invoice * For inquiries, contact us at yalesp.com</em></p>
          </div>
        </div>
      </div>
      <Button
        color='primary'
        className='mt-2'
        onClick={handleDownload}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating PDF...' : 'Download PDF'}
      </Button>

    </Container>
  );
};

export default InvoiceGenerator;
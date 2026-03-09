import React from "react";
import { MdErrorOutline } from "react-icons/md";
import { Card, CardBody, CardText, CardTitle, Col } from "reactstrap";

export const StatsCard = ({ title, value, color, unit, breakdown, isGroup, isNotation }) => {
  return (
    <Card
      className="text-center border-2 rounded-lg overflow-hidden mb-0"
      style={{ width: isGroup ? "260px" : "200px" }}
    >
      <CardBody className={`pt-2 pb-1 px-2 bg-${color || "primary"}-light position-relative`}>
        <div style={{ minHeight: isGroup ? "175px" : "auto" }}>
          {!isNotation ? (
            <>
              <CardText tag={isGroup ? "h4" : "h2"} className={`mb-0 fw-bold text-${color}`}>
                {value} {unit && <span className="fs-6 text-muted">{unit}</span>}
              </CardText>
              <CardTitle
                tag="h6"
                className="text-muted text-uppercase mb-1 fs-7 fw-semibold letter-spacing-1"
              >
                {title}
              </CardTitle>
            </>
          ) : <>
            <MdErrorOutline style={{ width: "20px", height: "20px" }} />
            <CardTitle tag="h6" className="text-muted h-100 text-uppercase mb-1 fs-7 fw-semibold letter-spacing-1">
              {title}
            </CardTitle>
          </>}

          {isGroup &&
            breakdown?.map((item, idx) => (
              <Col key={idx} md={12} className="position-relative">
                <div
                  className={`d-flex justify-content-between my-1 align-items-center rounded p-0 bg-${item.color}`}
                  style={{
                    position: "absolute",
                    height: "100%",
                    top: "-8%",
                    width: `${item.percent}%`,
                  }}
                ></div>
                <div
                  className={`d-flex justify-content-between my-1 align-items-center rounded p-2 bg-${item.color}-subtle`}
                  style={{ position: "relative", zIndex: 100 }}
                >
                  <div className="fw-bold text-white">{item.value}</div>
                  <div className="text-muted small ms-1 fw-bold">({item.percent}%)</div>
                </div>
              </Col>
            ))}

          {isNotation &&
            breakdown?.map((item, idx) => (
              <Col key={idx} md={12} className="my-3">
                <div className="d-flex align-items-center w-75 m-auto">
                  <div
                    className={`p-2 text-black shadow-lg border-2 border-secondary bg-${item.color}`}
                    style={{ width: "20px", height: "20px" }}
                  ></div>
                  <span className="small ms-2">{item.label}</span>
                </div>
              </Col>
            ))}
        </div>
      </CardBody>
    </Card>
  );
};

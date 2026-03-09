import React from "react";
import { Card, CardBody } from "reactstrap";

const StatsCard = ({ value, label }) => {
  return (
    <Card
      style={{
        width: "220px",
        height: "70px",
        borderRadius: "14px",
        border: "1.5px solid #d9d9d9",
        boxShadow: "none",
      }}
    >
      <CardBody className="d-flex flex-column justify-content-center align-items-center">
        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#2b2b2b",
            lineHeight: "1",
            marginBottom: "px",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#8c8c8c",
        
          }}
          className="text-capitalize"
        >
          {label}
        </div>
      </CardBody>
    </Card>
  );
};

export default StatsCard;

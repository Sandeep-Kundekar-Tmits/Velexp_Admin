import React from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Progress
} from 'reactstrap';

const CustomerServiceEmployeeFilter = ({ data = [] }) => {
    const getBadgeColor = (metricType, type, value) => {
    if (metricType === 'spu_pud') {
      // Colors for SPU/PUD values
      return value === 0 ? "secondary" : "primary";
    } else {
      // Colors for OFD/SPD percentages
      if (type === 'same_day') {
        return value > 90 ? "success" : value > 70 ? "warning" : "danger";
      } else if (type === 'next_day') {
        return value > 30 ? "warning" : "info";
      } else { // delayed
        return value > 20 ? "danger" : value > 0 ? "warning" : "success";
      }
    }
  };
  return (
    <Container fluid className="mt-4">
      <Row>
        {data.map(emp => (
          <Col md={4} className="mb-3" key={emp.empid}>
            <Card className="small">
              <CardHeader className="d-flex justify-content-between align-items-center p-2 bg-light">
                <strong className="text-truncate" style={{ maxWidth: '70%' }} title={emp.empname}>
                  {emp.empname}
                </strong>
                <Badge color="dark" pill>{emp.empid}</Badge>
              </CardHeader>

              <CardBody className="p-2">
                <Row>
                  {/* SPU/PUD Section */}
                  <Col md={6}>
                    <div className="text-center mb-2">
                      <h6 className="mb-1">SPU PUD</h6>
                      {Object.entries(emp.spu_pud).map(([type, value]) => (
                        <div key={`spu-${type}`} className="mb-1">
                          <div className="d-flex justify-content-between">
                            <span className="text-capitalize small">{type.replace('_', ' ')}:</span>
                            <Badge color={getBadgeColor('spu_pud', type, value)} pill>
                              {value}
                            </Badge>
                          </div>
                          <Progress
                            color={getBadgeColor('spu_pud', type, value)}
                            value={value}
                            className="progress-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </Col>

                  {/* OFD/SPD Section */}
                  <Col md={6}>
                    <div className="text-center mb-2">
                      <h6 className="mb-1">OFD SPD</h6>
    
                      {Object.entries(emp.ofd_spd).map(([type, value]) => (
                        <div key={`ofd-${type}`} className="mb-1">
                          <div className="d-flex justify-content-between">
                            <span className="text-capitalize small">{type.replace('_', ' ')}:</span>
                            <Badge color={getBadgeColor('ofd_spd', type, value)} pill>
                              {value}%
                            </Badge>
                          </div>
                          <Progress
                            color={getBadgeColor('ofd_spd', type, value)}
                            value={value}
                            className="progress-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CustomerServiceEmployeeFilter;
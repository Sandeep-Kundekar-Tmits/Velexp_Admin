import { useState } from "react";
import {
  Alert, Badge, Button, Card, CardBody, CardFooter, CardHeader, CardText, CardTitle,
  Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle,
  Form, FormFeedback, FormGroup, FormText, Input, Label,
  ListGroup, ListGroupItem, Modal, ModalBody, ModalFooter, ModalHeader,
  Nav, NavItem, NavLink, Offcanvas, OffcanvasBody, OffcanvasHeader,
  Pagination, PaginationItem, PaginationLink, Progress, Row, Spinner,
  TabContent, TabPane, Table,
} from "@/components/ui";

/**
 * Dev-only gallery for the Tailwind primitives that replaced reactstrap.
 *
 * Phase 3 swapped 187 files onto these components, but only the login screen
 * was verified visually. Modals, tabs and dropdowns are the pieces whose
 * behaviour changed most (SimpleModal used to drive Bootstrap's JS API
 * directly), and a build cannot tell you whether any of them render.
 *
 * Registered at /__ui under import.meta.env.DEV only, so it never ships.
 */
const COLORS = ["primary", "secondary", "success", "danger", "warning", "info", "light", "dark"];

const Section = ({ title, children }) => (
  <Card className="mb-3">
    <CardHeader>{title}</CardHeader>
    <CardBody>{children}</CardBody>
  </Card>
);

export default function UiGallery() {
  const [modalOpen, setModalOpen] = useState(true);
  const [offcanvasOpen, setOffcanvasOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(true);
  const [tab, setTab] = useState("1");

  return (
    <div className="page-content">
      <Container fluid>
        <h4 className="mb-3">UI primitives</h4>

        <Section title="Buttons">
          <div className="d-flex flex-wrap gap-2 mb-2">
            {COLORS.map((c) => (
              <Button key={c} color={c}>{c}</Button>
            ))}
          </div>
          <div className="d-flex flex-wrap gap-2 mb-2">
            {COLORS.slice(0, 6).map((c) => (
              <Button key={c} color={c} outline>{c} outline</Button>
            ))}
          </div>
          <div className="d-flex flex-wrap items-center gap-2">
            <Button size="sm" color="primary">small</Button>
            <Button size="md" color="primary">medium</Button>
            <Button size="lg" color="primary">large</Button>
            <Button color="primary" disabled>disabled</Button>
          </div>
        </Section>

        <Section title="Grid — Row / Col">
          <Row className="mb-2">
            <Col md={4}><div className="bg-light border p-2">md=4</div></Col>
            <Col md={4}><div className="bg-light border p-2">md=4</div></Col>
            <Col md={4}><div className="bg-light border p-2">md=4</div></Col>
          </Row>
          <Row>
            <Col md={6}><div className="bg-light border p-2">md=6</div></Col>
            <Col md={3}><div className="bg-light border p-2">md=3</div></Col>
            <Col md={3}><div className="bg-light border p-2">md=3</div></Col>
          </Row>
        </Section>

        <Section title="Form controls">
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="a">Text input</Label>
                <Input id="a" placeholder="Enter value" />
                <FormText>Helper text</FormText>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="b">Invalid input</Label>
                <Input id="b" invalid defaultValue="bad value" />
                <FormFeedback>This field is required</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="c">Select</Label>
                <Input id="c" type="select">
                  <option>One</option>
                  <option>Two</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="d">Textarea</Label>
                <Input id="d" type="textarea" placeholder="Multi-line" />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup check>
                <Input id="e" type="checkbox" defaultChecked />
                <Label for="e" className="mb-0">Checkbox</Label>
              </FormGroup>
              <FormGroup check>
                <Input id="f" type="radio" name="r" defaultChecked />
                <Label for="f" className="mb-0">Radio</Label>
              </FormGroup>
              <Form><Input placeholder="inside a Form" /></Form>
            </Col>
          </Row>
        </Section>

        <Section title="Table">
          <Table bordered hover responsive>
            <thead>
              <tr><th>AWB No</th><th>Customer</th><th>Weight</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>8829110</td><td>ACME Corp</td><td>1.40</td><td>1,250.00</td></tr>
              <tr><td>8829111</td><td>Nova Retail</td><td>0.75</td><td>890.50</td></tr>
              <tr><td>8829112</td><td>Sigma Ltd</td><td>3.20</td><td>2,410.75</td></tr>
            </tbody>
          </Table>
        </Section>

        <Section title="Tabs">
          <Nav tabs>
            {["1", "2", "3"].map((id) => (
              <NavItem key={id}>
                <NavLink active={tab === id} onClick={() => setTab(id)}>Tab {id}</NavLink>
              </NavItem>
            ))}
          </Nav>
          <TabContent activeTab={tab}>
            <TabPane tabId="1">Content of tab one.</TabPane>
            <TabPane tabId="2">Content of tab two.</TabPane>
            <TabPane tabId="3">Content of tab three.</TabPane>
          </TabContent>
        </Section>

        <Section title="Badges, alerts, progress, spinner">
          <div className="d-flex flex-wrap gap-2 mb-3">
            {COLORS.map((c) => <Badge key={c} color={c}>{c}</Badge>)}
            <Badge color="primary" pill>pill</Badge>
          </div>
          {["primary", "success", "danger", "warning", "info"].map((c) => (
            <Alert key={c} color={c}>Alert — {c}</Alert>
          ))}
          <Progress value={62} className="mb-3" />
          <div className="d-flex items-center gap-3">
            <Spinner size="sm" /><Spinner /><Spinner size="lg" />
          </div>
        </Section>

        <Section title="List group & pagination">
          <Row>
            <Col md={6}>
              <ListGroup>
                <ListGroupItem>First item</ListGroupItem>
                <ListGroupItem active>Active item</ListGroupItem>
                <ListGroupItem action>Actionable item</ListGroupItem>
              </ListGroup>
            </Col>
            <Col md={6}>
              <Pagination>
                <PaginationItem><PaginationLink first /></PaginationItem>
                <PaginationItem><PaginationLink previous /></PaginationItem>
                <PaginationItem active><PaginationLink>1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink>2</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink next /></PaginationItem>
              </Pagination>
            </Col>
          </Row>
        </Section>

        <Section title="Card parts">
          <Card>
            <CardHeader>Header</CardHeader>
            <CardBody>
              <CardTitle>Card title</CardTitle>
              <CardText>Body text inside the card.</CardText>
            </CardBody>
            <CardFooter>Footer</CardFooter>
          </Card>
        </Section>

        <Section title="Dropdown (open) & Offcanvas">
          <div className="d-flex gap-3 items-start">
            <Dropdown isOpen={dropdownOpen} toggle={() => setDropdownOpen((v) => !v)}>
              <DropdownToggle caret className="btn btn-primary">Actions</DropdownToggle>
              <DropdownMenu>
                <DropdownItem header>Header</DropdownItem>
                <DropdownItem>Edit</DropdownItem>
                <DropdownItem>Duplicate</DropdownItem>
                <DropdownItem divider />
                <DropdownItem>Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Button color="secondary" onClick={() => setOffcanvasOpen(true)}>Open offcanvas</Button>
            <Button color="primary" onClick={() => setModalOpen(true)}>Open modal</Button>
          </div>
        </Section>

        <Offcanvas isOpen={offcanvasOpen} toggle={() => setOffcanvasOpen(false)} direction="end">
          <OffcanvasHeader toggle={() => setOffcanvasOpen(false)}>Offcanvas</OffcanvasHeader>
          <OffcanvasBody>Slide-over content.</OffcanvasBody>
        </Offcanvas>

        <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered>
          <ModalHeader toggle={() => setModalOpen(false)}>Confirm action</ModalHeader>
          <ModalBody>
            <p>Modal body content, rendered over a backdrop.</p>
            <FormGroup>
              <Label for="m">A field inside the modal</Label>
              <Input id="m" placeholder="Type here" />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button color="primary">Confirm</Button>
          </ModalFooter>
        </Modal>
      </Container>
    </div>
  );
}

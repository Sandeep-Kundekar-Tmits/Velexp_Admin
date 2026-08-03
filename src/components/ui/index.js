/**
 * Tailwind-backed replacements for the reactstrap components this app used.
 *
 * Every export keeps the reactstrap prop contract, so migrating a screen is a
 * one-line import change:
 *
 *   -import { Row, Col, Button } from "@/components/ui";
 *   +import { Row, Col, Button } from "@/components/ui";
 *
 * That is what makes swapping 187 files tractable and reviewable, instead of
 * rewriting each screen's markup by hand.
 */
export { Row, Col, Container } from "./layout";
export { Button, Input, Label, FormGroup, FormFeedback, FormText, Form } from "./form";
export {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  CardTitle,
  CardText,
  Badge,
  Alert,
  Table,
  Spinner,
} from "./surface";
export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
} from "./modal";
export {
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  ListGroup,
  ListGroupItem,
  Pagination,
  PaginationItem,
  PaginationLink,
  Collapse,
} from "./nav";
export {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledPopover,
  PopoverBody,
  Tooltip,
  Progress,
  Breadcrumb,
  BreadcrumbItem,
} from "./overlay";

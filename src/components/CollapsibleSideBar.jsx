import React, { useState } from "react";
import {
  Button,
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";

const CollapsibleSideBar = ({ children, toggle }) => {


  return (
    <Offcanvas isOpen={true} toggle={toggle} direction="end">
      <OffcanvasHeader toggle={toggle}>Sidebar</OffcanvasHeader>
      <OffcanvasBody>
        {children}
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default CollapsibleSideBar;

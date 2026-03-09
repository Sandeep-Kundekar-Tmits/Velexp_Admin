import React from "react";
import withRouter from "./Common/withRouter";

const NonAuthLayout = (props) => {

  return <React.Fragment>{props.children}</React.Fragment>;
};



export default withRouter(NonAuthLayout);

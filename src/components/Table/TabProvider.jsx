import React, { useState } from 'react';
import {
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
    Row,
    Col,
    Card,
    CardTitle,
    CardText,
    Button
} from 'reactstrap';
import classnames from 'classnames';

const TabProvider = ({ tabs,toggle,activeTab}) => {
  

    return (
        <div className='page-content'>
            <div className="container-fluid ">
                <Nav tabs>
                    {tabs.map(tab => (
                        <NavItem key={tab.id}>
                            <NavLink
                            style={{fontSize:"14px",borderBottom:"solid rgb(214, 214, 214) 1px"}}
                                className={classnames({ active: activeTab === tab.id })}
                                // onClick={() => toggle(tab.id)}
                            >
                                {tab.title}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                <TabContent activeTab={activeTab}>
                    {tabs.map(tab => (
                        <TabPane tabId={tab.id} key={tab.id}>
                            {typeof tab.content === 'function' ? tab.content() : tab.content}
                        </TabPane>
                    ))}
                </TabContent>
               
            </div>
        </div>

    );
};

export default TabProvider;

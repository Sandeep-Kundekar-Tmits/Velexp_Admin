import React from 'react';
import {
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
} from "@/components/ui";

const TabProvider = ({ tabs, toggle, activeTab }) => {


    return (
        <div className='page-content'>
            <div className="container-fluid ">
                <Nav tabs>
                    {tabs.map(tab => (
                        <NavItem key={tab.id}>
                            <NavLink
                                active={activeTab === tab.id}
                                // No onClick: each step's own Next/Previous button is what
                                // validates and calls toggle(). A free-click tab header would
                                // let a step be skipped past without its required-field check
                                // (the final submit doesn't re-validate earlier steps).
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

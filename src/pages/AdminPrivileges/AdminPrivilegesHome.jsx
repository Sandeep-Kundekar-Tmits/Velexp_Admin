import React, { useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui";
import MainHeaderComp from "../../components/MainHeaderCom";
import RolesTab from "./RolesTab";
import MenusTab from "./MenusTab";
import RolePrivilegesTab from "./RolePrivilegesTab";
import UserAccessTab from "./UserAccessTab";

const TABS = [
    { key: "roles", label: "Roles", Component: RolesTab },
    { key: "menus", label: "Menus", Component: MenusTab },
    { key: "role-privileges", label: "Role Privileges", Component: RolePrivilegesTab },
    { key: "user-access", label: "User Access", Component: UserAccessTab },
];

const AdminPrivilegesHome = () => {
    const [activeTab, setActiveTab] = useState(TABS[0].key);

    return (
        <div className="container-fluid mt-2 py-0 px-0">
            <MainHeaderComp title="Admin Privileges" subTitle="Manage roles, menus, role privileges, and per-user access" />

            <div className="px-4 pt-4">
                <Nav tabs>
                    {TABS.map((tab) => (
                        <NavItem key={tab.key}>
                            <NavLink
                                className={activeTab === tab.key ? "active" : ""}
                                style={{ cursor: "pointer" }}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                <TabContent activeTab={activeTab} className="pt-4">
                    {TABS.map(({ key, Component }) => (
                        <TabPane key={key} tabId={key}>
                            {activeTab === key && <Component />}
                        </TabPane>
                    ))}
                </TabContent>
            </div>
        </div>
    );
};

export default AdminPrivilegesHome;

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
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp title="Admin Privileges" subTitle="Manage roles, menus, role privileges, and per-user access" />

            <div className="page-fit-body relative z-10 pb-4">
                <Nav tabs className="nav-tabs-custom nav-justified">
                    {TABS.map((tab) => (
                        <NavItem key={tab.key}>
                            <NavLink
                                active={activeTab === tab.key}
                                style={{ cursor: "pointer" }}
                                onClick={() => setActiveTab(tab.key)}
                                className={activeTab === tab.key ? "bg-[#3B82F6]/12 text-[15px] font-bold" : "text-[15px] font-bold"}
                            >
                                {tab.label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                <TabContent activeTab={activeTab} className="page-fit-body mt-3">
                    {TABS.map(({ key, Component }) => (
                        <TabPane key={key} tabId={key} className="page-fit-body">
                            {activeTab === key && <Component />}
                        </TabPane>
                    ))}
                </TabContent>
            </div>
        </div>
    );
};

export default AdminPrivilegesHome;

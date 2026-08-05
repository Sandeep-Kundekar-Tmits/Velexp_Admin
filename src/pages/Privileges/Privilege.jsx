import React, { useEffect, useState } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { Button, Card, CardBody } from "@/components/ui";
import MainHeaderComp from "../../components/MainHeaderCom";
import AssignPrivilegesScreen from "../../components/Privileges/AssignPrivilegesScreen";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { DELETE_PRIVILEGE, GET_ALL_PRIVILEGES } from "../../api";
import usePostApiCall from "../../hooks/usePostApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";

const Privilege = () => {
    const [showAddPrivleges, setShowAddPriveleges] = useState(false)
    const [AllPrivilegesData, setAllPrivilegesData] = useState([])
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    //  defining the api for the get all privileges
    const { apifunc: GetAllPrivileges, data: AllPrivileges, loading: PrivilegesLoading } = useGetApiCall()
    // defining the api for delete role
    const { apifunc: DeleteRole, loading: DeleteRoleLoading } = usePostApiCall()

    useEffect(() => {
        //  calling the get all privileges api
        GetAllPrivileges(GET_ALL_PRIVILEGES)
    }, [])

    useEffect(() => {
        if (AllPrivileges) {
            setAllPrivilegesData(AllPrivileges)
        }

    }, [AllPrivileges])
    const onButtonClick = () => {
        setShowAddPriveleges(!showAddPrivleges)
    }
    const OnDeleteRole = async (role) => {
        let isDeleted = await DeleteRole(DELETE_PRIVILEGE, { "role_id": role?.role_id })
        if (isDeleted?.status === 1) {
            SucceesToaster(isDeleted?.message)
            GetAllPrivileges(GET_ALL_PRIVILEGES)
        }
        else {
            ErrorToaster(isDeleted?.message)
        }
    }
    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Privileges"
                subTitle="Roles and the menus each one can reach."
                extraFields={
                    <Button
                        className="table-action-btn table-action-btn-primary"
                        onClick={() => onButtonClick()}
                    >
                        {showAddPrivleges ? "Look Up" : "New Privileges"}
                    </Button>
                }
            />

            <div className="page-fit-body relative z-10 pb-4">
                {!showAddPrivleges ? (
                    <div className="page-fit-body mt-4 overflow-y-auto scroll-slim">
                        {AllPrivilegesData.map((role) => (
                            /* Stacked, not a two-column flex row.
                               The role name had a hard minWidth:140 beside a
                               menu column set to `width:100%` with a 30px left
                               margin -- 100% + 30px inside a flex row, so the
                               card overflowed its own panel at every width and
                               left almost nothing for the menus on a phone. */
                            <Card key={role.role_id} className="mb-2">
                                <CardBody className="p-4">
                                    {/* Role name and the delete action on one
                                        line. The button was absolutely
                                        positioned at top-right, so on a narrow
                                        card it sat on top of the role name. */}
                                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/8 pb-3">
                                        <h6 className="m-0 min-w-0 truncate text-[15px] font-semibold text-white">
                                            {role.role_name}
                                        </h6>
                                        <Button
                                            size="sm"
                                            color="danger"
                                            outline
                                            className="shrink-0"
                                            onClick={() => OnDeleteRole(role)}
                                            disabled={DeleteRoleLoading}
                                            aria-label={`Delete ${role.role_name}`}
                                            title={`Delete ${role.role_name}`}
                                        >
                                            <RiDeleteBinLine />
                                        </Button>
                                    </div>

                                    {/* Menus */}
                                    {role.menus.map((menu) => (
                                        <div key={menu.menu_id} className="mb-4 last:mb-0">
                                            {/* Parent menu */}
                                            <h6 className="m-0 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                                {menu.menu_name}
                                            </h6>

                                            {/* Children menus. The chips were
                                                px-4 py-2 at 14px -- on a phone
                                                three of them filled the card;
                                                smaller lets them wrap into a
                                                readable block. */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {menu.children.length > 0 ? (
                                                    menu.children.map((child) => (
                                                        <span
                                                            key={child.menu_id}
                                                            className="badge rounded-full border border-success-500/25 bg-success-500/10 px-2.5 py-1 text-[12px] text-success-500"
                                                        >
                                                            {child.menu_name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="badge rounded-full border border-white/10 px-2.5 py-1 text-[12px] text-ink-muted">
                                                        No sub-menus
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <AssignPrivilegesScreen
                        callBack={() => {
                            setShowAddPriveleges(false)
                            GetAllPrivileges(GET_ALL_PRIVILEGES)
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Privilege;

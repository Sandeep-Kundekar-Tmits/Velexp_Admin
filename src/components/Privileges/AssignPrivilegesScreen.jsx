import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import { Button, Card, CardBody, Col, Input, Label, Row } from "@/components/ui";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_MENUS, GET_ALL_ROLES, GET_ROLE_PRIVILEGES_BY_ROLE, SAVE_PRIVILEGES } from "../../api";
import usePostApiCall from "../../hooks/usePostApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";

/* ================= COMPONENT ================= */
const AssignPrivilegesScreen = ({ callBack }) => {
    const [menuData, setmenuData] = useState([])
    const [selectedRole, setSelectedRole] = useState("");
    const [AllRolesDropdonw, setAllRolesDropdown] = useState([])
    const [openMenu, setOpenMenu] = useState(null);
    const [allMenus, setAllMenus] = useState([]);
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const [selectedMenus, setSelectedMenus] = useState([]);
    //  defining the api for the get all privileges
    const { apifunc: GetRolePrivileges, data: RolePrivileges, loading: RolePrivilegesLoading } = useGetApiCall()
    // defining the api to get all the roles
    const { apifunc: getAllRoles, data: AllRolesdata, loading: GetAllRolesLoading } = usePostApiCall()
    // defining the api for the save privilege
    const { apifunc: SavePrivilege, loading: savedPrivilegsloading } = usePostApiCall()
    // defining the get api for the menus
    const { apifunc: GetAllMenus, data: AllMunesdata, loading: menuloading } = useGetApiCall()
    /* ================= CONSTANTS ================= */
    const PERMISSIONS = useMemo(
        () => ["has_fullacess", "can_view", "can_save", "can_update", "can_delete"],
        []
    );

    //  call the get all roles api
    useEffect(() => {
        GetAllMenus(GET_ALL_MENUS)
        getAllRoles(GET_ALL_ROLES, {})
    }, [])
    useEffect(() => {
        if (AllMunesdata) {
            let updatedData = AllMunesdata?.map(ele => {
                return {
                    "id": ele?.menu_id,
                    "menu_name": ele?.menu_name,
                    "menu_url": ele?.menu_url,
                    "faicon": ele?.faicon,
                    "show_panel": ele?.show_panel,
                    "has_fullacess": false,
                    "can_view": false,
                    "can_save": false,
                    "can_update": false,
                    "can_delete": false,
                    "children": ele?.children?.map(subele => {
                        return {
                            "id": subele?.menu_id,
                            "menu_name": subele?.menu_name,
                            "menu_url": subele?.menu_url,
                            "faicon": subele?.faicon,
                            "show_panel": subele?.show_panel,
                            "has_fullacess": false,
                            "can_view": false,
                            "can_save": false,
                            "can_update": false,
                            "can_delete": false,
                        }
                    })
                }
            })
            setmenuData(updatedData)
        }

    }, [AllMunesdata])

    // calling the api for get all roles
    useEffect(() => {
        if (AllRolesdata) {
            setAllRolesDropdown(AllRolesdata?.results?.results || [])
        }
    }, [AllRolesdata])

    /* ================= INIT ================= */
    useEffect(() => {
        if (!menuData.length) return;
        const updated = menuData.map(menu => ({
            ...menu,
            isChecked: false,
            children: menu.children.map(child => ({
                ...child,
                isChecked: false
            }))
        }));
        setAllMenus(updated);
    }, [menuData]);

    useEffect(() => {
        // calling the api to get menus for the particular role
        if (selectedRole !== "") {
            GetRolePrivileges(`${GET_ROLE_PRIVILEGES_BY_ROLE}?role_id=${selectedRole}`)
            return
        }
        else {
            setAllMenus(menuData);
            setSelectedMenus([]);
        }
    }, [selectedRole, menuData])

    useEffect(() => {
        if (!RolePrivileges) {
            return
        };

        // Build lookup maps from backend response
        const roleMenuMap = new Map();
        const roleChildMap = new Map();

        RolePrivileges.menus.forEach(menu => {
            roleMenuMap.set(menu.menu_id, menu);
            menu.children?.forEach(child => {
                roleChildMap.set(child.menu_id, child);
            });
        });

        // Merge backend privileges INTO menuData
        const mergedMenus = menuData.map(menu => {
            const roleMenu = roleMenuMap.get(menu.id);

            return {
                ...menu,
                isChecked: !!roleMenu,
                has_fullacess: roleMenu?.has_fullacess || false,
                can_view: roleMenu?.can_view || false,
                can_save: roleMenu?.can_save || false,
                can_update: roleMenu?.can_update || false,
                can_delete: roleMenu?.can_delete || false,

                children: menu.children.map(child => {
                    const roleChild = roleChildMap.get(child.id);

                    return {
                        ...child,
                        isChecked: !!roleChild,
                        has_fullacess: roleChild?.has_fullacess || false,
                        can_view: roleChild?.can_view || false,
                        can_save: roleChild?.can_save || false,
                        can_update: roleChild?.can_update || false,
                        can_delete: roleChild?.can_delete || false
                    };
                })
            };
        });

        setAllMenus(mergedMenus);

        // 🔥 derive selectedMenus from merged tree
        const selected = mergedMenus
            .filter(menu => menu.isChecked)
            .map(menu => ({
                id: menu.id,
                menu_name: menu.menu_name,
                has_fullacess: menu.has_fullacess,
                can_view: menu.can_view,
                can_save: menu.can_save,
                can_update: menu.can_update,
                can_delete: menu.can_delete,
                children: menu.children
                    .filter(c => c.isChecked)
                    .map(c => ({
                        id: c.id,
                        menu_name: c.menu_name,
                        has_fullacess: c.has_fullacess,
                        can_view: c.can_view,
                        can_save: c.can_save,
                        can_update: c.can_update,
                        can_delete: c.can_delete
                    }))
            }));

        setSelectedMenus(selected);
    }, [RolePrivileges, menuData]);


    /* ================= AVAILABLE → SELECTED ================= */
    const syncSelectedMenus = useCallback((menus) => {
        setSelectedMenus(prev => {
            const map = new Map(prev.map(m => [m.id, m]));

            menus.forEach(menu => {
                if (menu.isChecked) {
                    const checkedChildren = menu.children
                        .filter(c => c.isChecked)
                        .map(c => {
                            const existingChild =
                                map.get(menu.id)?.children?.find(ec => ec.id === c.id);

                            return (
                                existingChild || {
                                    id: c.id,
                                    menu_name: c.menu_name,
                                    has_fullacess: false,
                                    can_view: false,
                                    can_save: false,
                                    can_update: false,
                                    can_delete: false
                                }
                            );
                        });

                    // 🔥 MERGE OR CREATE
                    map.set(menu.id, {
                        ...(map.get(menu.id) || {
                            id: menu.id,
                            menu_name: menu.menu_name,
                            has_fullacess: false,
                            can_view: false,
                            can_save: false,
                            can_update: false,
                            can_delete: false
                        }),
                        children: checkedChildren
                    });
                } else {
                    map.delete(menu.id);
                }
            });

            return Array.from(map.values());
        });
    }, []);


    /* ================= CHECK HANDLER ================= */
    const onClickCheck = useCallback(
        (e, type, parentIndex, childIndex) => {
            const checked = e.target.checked;

            setAllMenus(prev => {
                const updated = structuredClone(prev);

                if (type === "parent") {
                    updated[parentIndex].isChecked = checked;
                    updated[parentIndex].children.forEach(c => (c.isChecked = checked));
                }

                if (type === "child") {
                    updated[parentIndex].children[childIndex].isChecked = checked;
                    updated[parentIndex].isChecked =
                        updated[parentIndex].children.some(c => c.isChecked);
                }

                syncSelectedMenus(updated);
                return updated;
            });
        },
        [syncSelectedMenus]
    );

    /* ================= PERMISSION TOGGLE ================= */
    const updatePermission = useCallback(
        (type, mIdx, cIdx, perm, checked) => {
            setSelectedMenus(prev => {
                const updated = structuredClone(prev);
                const target =
                    type === "parent"
                        ? updated[mIdx]
                        : updated[mIdx].children[cIdx];

                if (perm === "has_fullacess") {
                    PERMISSIONS.forEach(p => (target[p] = checked));
                } else {
                    target[perm] = checked;
                    target.has_fullacess = PERMISSIONS.slice(1).every(p => target[p]);
                }

                return updated;
            });
        },
        [PERMISSIONS]
    );

    /* ================= BACKEND PAYLOAD ================= */
    const handleSave = async () => {

        const payload = {
            role_id: selectedRole,
            menus: selectedMenus?.map(ele => {
                return {
                    "menu_id": ele?.id,
                    "has_fullacess": ele?.has_fullacess,
                    "can_view": ele?.can_view,
                    "can_save": ele?.can_save,
                    "can_update": ele?.can_update,
                    "can_delete": ele?.can_delete,
                    "children": ele?.children?.map(subele => {
                        return {
                            "menu_id": subele?.id,
                            "has_fullacess": subele?.has_fullacess,
                            "can_view": subele?.can_view,
                            "can_save": subele?.can_save,
                            "can_update": subele?.can_update,
                            "can_delete": subele?.can_delete,
                        }
                    })
                }
            })
        };

        // calling the api to save the privileges
        const savedPrivilegs = await SavePrivilege(SAVE_PRIVILEGES, payload)

        if (savedPrivilegs?.status === 1) {
            SucceesToaster(savedPrivilegs?.message)
            callBack()
        }
    };

    /* ================= UI ================= */
    return (
        <div className="page-fit-body">
            {/* ROLE */}
            {/* Full width on a phone, capped from sm: a hard 320px is most of a
                360px screen, so the select sat flush against the gutter. */}
            <div className="mb-4 w-full sm:max-w-80">
                <Label className="font-semibold">
                    Roles <span className="text-danger-500">*</span>
                </Label>
                <Input
                    type="select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                >
                    <option value="">Select Role</option>
                    {
                        AllRolesDropdonw?.map(ele => {
                            return (
                                <option key={ele?.id} value={ele?.id}>{ele?.name}</option>
                            )
                        })
                    }
                </Input>
            </div>

            {/* flex-col below md, side by side from md up -- a phone-width
                screen can't fit two 70vh panels next to each other. gap-6
                works for both: row-gap while stacked, column-gap once the
                panels sit side by side. */}
            <Row className="flex-col flex-nowrap md:flex-row gap-6">
                {/* AVAILABLE */}
                <Col md={5}>
                    <Card className="h-[45vh] overflow-y-auto scroll-slim md:h-[70vh]">
                        <CardBody>
                            <h5 className="font-bold mb-4">Available Privileges</h5>
                            {allMenus.map((menu, idx) => (
                                <div key={menu.id} className="mb-2">
                                    <div className="flex justify-between bg-canvas p-2 rounded mb-2">

                                        <span>{menu.menu_name}</span>
                                        {menu.children.length ? (
                                            <span onClick={() => setOpenMenu(openMenu === idx ? null : idx)}>
                                                {openMenu === idx ? <IoMdRemove /> : <IoMdAdd />}
                                            </span>
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={menu.isChecked}
                                                onChange={(e) => onClickCheck(e, "parent", idx)}
                                            />
                                        )}
                                    </div>

                                    {openMenu === idx &&
                                        menu.children.map((child, cIdx) => (
                                            <div key={child.id} className="form-check ml-6">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={child.isChecked}
                                                    onChange={(e) => onClickCheck(e, "child", idx, cIdx)}
                                                />
                                                <label>{child.menu_name}</label>
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </Col>

                {/* ASSIGNED */}
                <Col md={7}>
                    <Card className="h-[45vh] overflow-y-auto scroll-slim md:h-[70vh]">
                        <CardBody>
                            <div className="flex justify-between items-center mb-4">
                                <h5 className="font-bold mb-0">Assigned Privileges</h5>
                                <Button
                                    color="primary"
                                    disabled={!selectedRole}
                                    onClick={handleSave}
                                >
                                    Save
                                </Button>
                            </div>

                            {selectedMenus.length === 0 ? (
                                <p className="text-ink-muted">
                                    {selectedRole
                                        ? "This role has no menus assigned yet. Check items on the left to add them."
                                        : "Pick a role above, or check items on the left to build a fresh set of privileges."}
                                </p>
                            ) : (
                                selectedMenus.map((menu, mIdx) => (
                                    <Card key={menu.id} className="mb-4 border">
                                        <CardBody>
                                            <h6 className="font-semibold text-ink">{menu.menu_name}</h6>
                                            {(menu.children.length ? menu.children : [menu]).map(
                                                (item, cIdx) => (
                                                    <div key={item.id} className="border p-2 mb-2">
                                                        {menu.children.length > 0 && <strong className="text-ink">{item.menu_name}</strong>}
                                                        <div className="flex gap-4 flex-wrap">
                                                            {PERMISSIONS.map(perm => (
                                                                <div className="flex items-center gap-1.5" key={perm}>
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={item[perm]}
                                                                        onChange={(e) =>
                                                                            updatePermission(
                                                                                menu.children.length ? "child" : "parent",
                                                                                mIdx,
                                                                                cIdx,
                                                                                perm,
                                                                                e.target.checked
                                                                            )
                                                                        }
                                                                    />
                                                                    <label className="text-ink text-sm">
                                                                        {perm.replaceAll("_", " ")}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </CardBody>
                                    </Card>
                                ))
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AssignPrivilegesScreen;
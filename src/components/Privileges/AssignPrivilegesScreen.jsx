import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_MENUS, GET_ALL_ROLES, GET_ROLE_PRIVILEGES_BY_ROLE, SAVE_PRIVILEGES } from "../../api";
import usePostApiCall from "../../hooks/usePostApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";


// const menuData = [
//     {
//         "id": 10,
//         "menu_name": "Dashboard",
//         "menu_url": "#",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": []
//     },
//     {
//         "id": 1,
//         "menu_name": "Master",
//         "menu_url": "#",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": [
//             {
//                 "id": 11,
//                 "menu_name": "Co-loaders",
//                 "menu_url": "/coloaders/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 12,
//                 "menu_name": "Vendor and Vendor Vehicle",
//                 "menu_url": "/vendors-vendor_vahicles/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 13,
//                 "menu_name": "Service Centre",
//                 "menu_url": "/service-center/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 14,
//                 "menu_name": "Status",
//                 "menu_url": "/status/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 15,
//                 "menu_name": "Pincode",
//                 "menu_url": "/pincode/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 16,
//                 "menu_name": "Package Type",
//                 "menu_url": "/package-type/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 17,
//                 "menu_name": "Exceptions",
//                 "menu_url": "/exception/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 18,
//                 "menu_name": "Exceptions Status",
//                 "menu_url": "/exception-status/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             }
//         ]
//     },
//     {
//         "id": 2,
//         "menu_name": "User management",
//         "menu_url": "#",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": [
//             {
//                 "id": 19,
//                 "menu_name": "Designation",
//                 "menu_url": "/designations/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 20,
//                 "menu_name": "Department",
//                 "menu_url": "/departments/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 21,
//                 "menu_name": "Employee",
//                 "menu_url": "/employee/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             }
//         ]
//     },
//     {
//         "id": 3,
//         "menu_name": "Pickup Requests",
//         "menu_url": "/pickup-request/",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": []
//     },
//     {
//         "id": 4,
//         "menu_name": "Planning",
//         "menu_url": "#",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": [
//             {
//                 "id": 22,
//                 "menu_name": "Allocations",
//                 "menu_url": "/allocations/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 23,
//                 "menu_name": "Manifest",
//                 "menu_url": "/manifest/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             }
//         ]
//     },
//     {
//         "id": 5,
//         "menu_name": "Shipment Arrival",
//         "menu_url": "#",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": []
//     },
//     {
//         "id": 6,
//         "menu_name": "Bag Management",
//         "menu_url": "#",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": [
//             {
//                 "id": 24,
//                 "menu_name": "Bag Creation",
//                 "menu_url": "/bag-creation",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 25,
//                 "menu_name": "Create Out-Going Manifest",
//                 "menu_url": "/create-out-going-manifest/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             },
//             {
//                 "id": 26,
//                 "menu_name": "Bag Arrival",
//                 "menu_url": "/bag-arrival/",
//                 "faicon": null,
//                 "show_panel": "side",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             }
//         ]
//     },
//     {
//         "id": 7,
//         "menu_name": "RTO Booking",
//         "menu_url": "/rto_booking/",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": []
//     },
//     {
//         "id": 8,
//         "menu_name": "Raise Exception",
//         "menu_url": "/raise-exception/",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": []
//     },
//     {
//         "id": 9,
//         "menu_name": "Others",
//         "menu_url": "#",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": [
//             {
//                 "id": 27,
//                 "menu_name": "Pickup Preference",
//                 "menu_url": "/pickup-preferences/",
//                 "has_fullacess": false,
//                 "can_view": false,
//                 "can_save": false,
//                 "can_update": false,
//                 "can_delete": false,
//                 "children": []
//             }
//         ]
//     },
//     {
//         "id": 28,
//         "menu_name": "Shipment & Bag Tracking",
//         "menu_url": "/tracking/",
//         "has_fullacess": true,
//         "can_view": false,
//         "can_save": false,
//         "can_update": false,
//         "can_delete": false,
//         "children": []
//     }

// ]

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

        console.log(payload, "payload")


        // calling the api to save the privileges
        const savedPrivilegs = await SavePrivilege(SAVE_PRIVILEGES, payload)

        if (savedPrivilegs?.status === 1) {
            SucceesToaster(savedPrivilegs?.message)
            callBack()
        }

        console.log("FINAL BACKEND PAYLOAD 👉", savedPrivilegs);
    };

    /* ================= UI ================= */
    return (
        <div className="container-fluid p-4 min-vh-100">
            {/* ROLE */}
            <div className="mb-3">
                <label className="form-label h5 fw-semibold">
                    Roles <span className="text-danger">*</span>
                </label>
                <select
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                >
                    <option value="">Select Role</option>
                    {
                        AllRolesDropdonw?.map(ele => {
                            return (
                                <option value={ele?.id}>{ele?.name}</option>
                            )
                        })
                    }
                </select>
            </div>

            <div className="row g-4">
                {/* AVAILABLE */}
                <div className="col-md-5">
                    <div className="card shadow-sm border-0" style={{ height: "70vh", overflowY: "auto" }}>
                        <div className="card-body">
                            <h5>Available Privileges</h5>
                            {allMenus.map((menu, idx) => (
                                <div key={menu.id} className="mb-2">
                                    <div className="d-flex justify-content-between bg-light p-2 rounded mb-2">

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
                                            <div key={child.id} className="form-check ms-4">
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
                        </div>
                    </div>
                </div>

                {/* ASSIGNED */}
                <div className="col-md-7">
                    <div className="card shadow-sm border-0 " style={{ height: "70vh", overflowY: "auto" }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between mb-3">
                                <h5>Assigned Privileges</h5>
                                <button
                                    className="btn btn-primary"
                                    disabled={!selectedRole}
                                    onClick={handleSave}
                                >
                                    Save
                                </button>
                            </div>

                            {selectedMenus.map((menu, mIdx) => (
                                <div key={menu.id} className="card mb-3 border">
                                    <div className="card-body">
                                        <h6>{menu.menu_name}</h6>
                                        {console.log(menu, "menu.menu_name")}
                                        {(menu.children.length ? menu.children : [menu]).map(
                                            (item, cIdx) => (
                                                <div key={item.id} className="border p-2 mb-2">
                                                    {menu.children.length > 0 && <strong>{item.menu_name}</strong>}
                                                    <div className="d-flex gap-3 flex-wrap">
                                                        {PERMISSIONS.map(perm => (
                                                            <div className="form-check form-switch" key={perm}>
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
                                                                <label className="form-check-label">
                                                                    {perm.replaceAll("_", " ")}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignPrivilegesScreen;
import { Button, Col, FormGroup, Input, Label, Row } from "@/components/ui"
import Select from 'react-select'
import { customStyles } from "../../helpers/CustomStyle"
import { useEffect, useMemo, useState } from "react"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { ADD_NEW_WAREHOUSE, GET_WAREHOUSE_LIST } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import Loader from "@/Loaders/Loader";
import AddWareHouseModel from "../../components/WareHouse/AddWareHouseModel"
import usePostApiCall from "../../hooks/usePostApiCall"
import MainHeaderComp from "../../components/MainHeaderCom"
import { Plus } from "lucide-react"

const DelhiveryWarehouse = () => {
    const columns = useMemo(
        () => [
            {
                header: 'Warehouse ',
                accessorKey: 'warehouse',
                enableColumnFilter: false,
                enableSorting: true,
                size: 100, // optional column size
            },
            {
                header: 'Service Center',
                accessorKey: 'service_center',
                enableColumnFilter: false,
                enableSorting: true,
                size: 200,
            },
            {
                header: 'Pinocde',
                accessorKey: 'pinocde',
                enableColumnFilter: false,
                enableSorting: true,
                size: 120,
            },
            {
                header: 'City',
                accessorKey: 'city',
                enableColumnFilter: false,
                enableSorting: true,
                size: 120,
                cell: info => <span style={{ fontFamily: 'monospace' }}>{info.getValue()}</span>,
            }
        ],
        []
    );

    const [SelectedTitle, setSelectedTitle] = useState("")
    const toggle = () => setSelectedTitle("")
    const [WarehouseList, setWarehouseList] = useState([])

    //  defining the get list of warehouses api
    const { apifunc: GetWarehouselist, data: Warehouselist, loading: warehouseloading } = useGetApiCall()
    // defining the add warhouse api
    const { apifunc: AddNewWareHouse, data: AddedWarehouse, loading: addWarehouseLoading } = usePostApiCall(toggle, "Delhivary Warehouse Added Successfully")


    //  calling the add warehouse api
    const onAddWarehouse = async (warehouseData) => {
        let warehouseAdded = await AddNewWareHouse(ADD_NEW_WAREHOUSE, warehouseData)
        console.log(warehouseAdded, "added warehouse")
    }
    //  all components
    const Components = [
        {
            title: "add_warehouse",
            comp: <AddWareHouseModel
                toggle={toggle}
                onSave={onAddWarehouse}
                loading={addWarehouseLoading} />
        }
    ]

    //return component

    const ReturnComponent = (title) => {
        let NewComponent = Components.find((ele) => ele?.title === title)
        if (NewComponent) {
            return NewComponent?.comp
        }
        return <></>
    }
    // useEffects
    useEffect(() => {
        // calling the get warehouse api
        GetWarehouselist(GET_WAREHOUSE_LIST)
    }, [])

    useEffect(() => {
        if (Warehouselist) {
            let updatedWarehouselist = Warehouselist?.map((ele) => {
                return {
                    ...ele,
                    warehouse: ele?.name,
                    service_center: ele?.service_center?.ec_code,
                    pinocde: ele?.pincode,
                    city: ele?.city
                }
            })
            setWarehouseList(updatedWarehouselist)
        }
    }, [Warehouselist])
    return (
        <div className="page-content page-fit py-0 px-0">
            {/* No sticky wrapper: MainHeaderComp draws nothing inline, it hands
                the title and button to the layout's PageHeader. */}
            <MainHeaderComp
                title="Delhivery Warehouse"
                subTitle="Warehouses linked to each Delhivery service center."
                extraFields={
                    <Button
                        className="table-action-btn table-action-btn-primary"
                        onClick={() => setSelectedTitle("add_warehouse")}
                    >
                        <Plus aria-hidden="true" size={15} />
                        Add Delhivery
                    </Button>
                }
            />
            <div className="page-fit-body relative z-10 pb-4">
                <div className="page-fit-body">
                    {
                        warehouseloading ? <Loader message="Loading Warehouses Services ..." fullscreen={false} />
                            :
                            <TableContainer
                                columns={columns}
                                data={WarehouseList || []}
                                isGlobalFilter={false}
                                isPagination={true}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                theadClass="sticky top-0 z-10"
                                isStickyHeader={true}
                                stickyTop={0}
                                fillHeight
                                tableHeight="72vh"
                            />
                    }
                </div>
                {ReturnComponent(SelectedTitle)}
            </div>
        </div>
    )
}
export default DelhiveryWarehouse
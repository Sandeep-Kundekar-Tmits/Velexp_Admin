import { Button, Col, FormGroup, Input, Label, Row } from "reactstrap"
import Select from 'react-select'
import { customStyles } from "../../helpers/CustomStyle"
import { useEffect, useMemo, useState } from "react"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { ADD_NEW_WAREHOUSE, GET_WAREHOUSE_LIST, SERVICE_CENTER } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import { GridLoader } from 'react-spinners';
import AddWareHouseModel from "../../components/WareHouse/AddWareHouseModel"
import usePostApiCall from "../../hooks/usePostApiCall"
import MainHeaderComp from "../../components/MainHeaderCom"

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
        <div className="page-content py-0 px-0">
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="Delhivery Warehouse"
                    extraFields={
                        <Button color="primary" onClick={() => {
                            setSelectedTitle("add_warehouse")
                        }} style={{ height: "40px" }}>Add Delhivery</Button>
                    }
                />
            </div>
            <div className="container-fluid mt-4 px-3">

                {/* tabel */}
                <div className='mt-1'>
                    {
                        warehouseloading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading Warehouses Services ...</p>
                        </div>
                            :
                            <TableContainer
                                columns={columns}
                                data={WarehouseList || []}
                                isGlobalFilter={false}
                                isPagination={true}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            />
                    }
                </div>
                {ReturnComponent(SelectedTitle)}
            </div>
        </div>
    )
}
export default DelhiveryWarehouse
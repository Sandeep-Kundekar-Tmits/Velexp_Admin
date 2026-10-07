import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge, Button } from "@/components/ui"
import TableContainer from "../../components/Table/TableContainer"
import usePostApiCall from "../../hooks/usePostApiCall"
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall"
import { SERVICE_CENTER_LIST, DELETE_SERVICE_CENTRE } from "../../api"
import MainHeaderComp from "../../components/MainHeaderCom"
import DeleteModal from "../../components/Common/DeleteModal"
import Loader from "@/Loaders/Loader"

/**
 * Predictable global search: an exact (case-insensitive) match on the
 * service centre's own code always matches, regardless of which column is
 * being checked; everything else falls back to a plain substring match.
 *
 * Replaces TableContainer's default fuzzy (match-sorter) search for this
 * table specifically -- fuzzy ranking has a scoring threshold that can
 * silently reject a real match depending on what else is in the row, which
 * read as "search sometimes doesn't work," most noticeably when searching
 * by code. A plain substring match has no such threshold: either the text
 * is there or it isn't.
 */
const serviceCentreGlobalFilter = (row, columnId, value) => {
    const search = String(value ?? "").trim().toLowerCase()
    if (!search) return true
    const code = String(row.original?.service_center_code ?? "").toLowerCase()
    if (code === search) return true
    return String(row.getValue(columnId) ?? "").toLowerCase().includes(search)
}

const ServiceCentreList = () => {
    useEffect(() => { document.title = "Service Centres" }, [])

    const navigate = useNavigate()
    const { apifunc: getServiceCentres, data, loading } = usePostApiCall()
    const { apifunc: deleteServiceCentre, loading: deleteLoading } = useDeleteApiCall()

    const [serviceCentres, setServiceCentres] = useState([])
    const [selectedInfo, setSelectedInfo] = useState(null)
    const [showDelete, setShowDelete] = useState(false)

    useEffect(() => { getServiceCentres(SERVICE_CENTER_LIST, {}) }, [getServiceCentres])

    useEffect(() => {
        if (data) setServiceCentres(data?.results?.results || data?.results || data || [])
    }, [data])

    const handleEdit = useCallback((rowData) => {
        navigate(`/service-centres/edit/${rowData?.id}`)
    }, [navigate])

    const handleAdd = useCallback(() => navigate("/service-centres/add"), [navigate])

    const handlePincodes = useCallback((rowData) => {
        navigate(`/service-centres/pincodes?sc=${encodeURIComponent(rowData?.service_center_code || "")}`)
    }, [navigate])

    const handleDeleteClick = useCallback((rowData) => {
        setSelectedInfo(rowData)
        setShowDelete(true)
    }, [])

    const onDelete = async () => {
        const isDeleted = await deleteServiceCentre(`${DELETE_SERVICE_CENTRE}${selectedInfo?.id}/`)
        if (isDeleted) {
            setShowDelete(false)
            setServiceCentres((prev) => prev.filter((ele) => ele?.id !== selectedInfo?.id))
        }
    }

    const columns = useMemo(() => [
        { header: "Code", accessorKey: "service_center_code", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Company Name", accessorKey: "company_name", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "City", accessorKey: "city", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "State", accessorKey: "state", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Phone", accessorKey: "phone", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Status", accessorKey: "is_active", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() ? "success" : "secondary"} pill>{getValue() ? "Active" : "Inactive"}</Badge>,
        },
        {
            header: "Actions", id: "actions", enableSorting: false,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button color="primary" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button>
                    <Button color="secondary" size="sm" onClick={() => handlePincodes(row.original)}>Pincodes</Button>
                    <Button color="danger" size="sm" onClick={() => handleDeleteClick(row.original)}>Delete</Button>
                </div>
            ),
        },
    ], [handleEdit, handlePincodes, handleDeleteClick])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <div className="page-fit-body relative z-10 pb-4">
                <MainHeaderComp
                    title="Service Centres"
                    subTitle="Master list of every service centre — location, contact and operational details."
                    extraFields={<Button color="primary" onClick={handleAdd}>+ Add Service Centre</Button>}
                />

                {loading ? (
                    <Loader message="Loading Service Centres…" fullscreen={false} />
                ) : (
                    <div className="page-fit-body mt-4">
                        <TableContainer
                            columns={columns}
                            data={serviceCentres}
                            isGlobalFilter={true}
                            globalFilterFn={serviceCentreGlobalFilter}
                            isPagination={true}
                            isCustomPageSize={true}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="72vh"
                        />
                    </div>
                )}
            </div>

            <DeleteModal show={showDelete} onCloseClick={() => setShowDelete(false)} onDeleteClick={onDelete} loading={deleteLoading} />
        </div>
    )
}

export default ServiceCentreList

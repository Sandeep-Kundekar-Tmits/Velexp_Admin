import { useEffect, useMemo, useState } from "react";
import { Button, Label, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import Loader from "@/Loaders/Loader";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { http } from "@/lib/http";
import { GET_ADDRESS } from "../../../api";

const TEXT_FIELDS = [
    ["name", "Name"],
    ["address", "Address"],
    ["city", "City"],
    ["state", "State"],
    ["state_code", "State Code"],
    ["state_shortcode", "State Short Code"],
    ["pincode", "Pincode"],
    ["email", "Email"],
    ["mobile", "Mobile"],
    ["gst_no", "GST No."],
    ["pan_no", "PAN No."],
];
const FLAG_FIELDS = [
    ["is_active", "Active"],
    ["is_default", "Default"],
    ["is_for_manual_invoice", "For Manual Invoice"],
];

const emptyForm = () => ({
    ...Object.fromEntries(TEXT_FIELDS.map(([k]) => [k, ""])),
    is_active: true,
    is_default: false,
    is_for_manual_invoice: true,
});

const errorMessage = (e, fallback) => {
    const d = e?.data;
    return d?.message || d?.msg || d?.detail || fallback;
};

const yesNo = (v) => (v ? "Yes" : "No");

const CompanyAddress = () => {
    const { ErrorToaster, SuccessToaster } = ToasterProvider();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // editing: null = closed, {} = new, {id, ...} = existing
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm());

    const load = async () => {
        try {
            setLoading(true);
            const data = await http.get(GET_ADDRESS);
            const list = Array.isArray(data) ? data : data?.results || [];
            // Soft-deleted rows stay in the DB for past invoices; hide them here
            setRows(list.filter((r) => !r.is_deleted));
        } catch (e) {
            console.error("Load company addresses failed:", e);
            ErrorToaster(errorMessage(e, "Failed to load company addresses"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openNew = () => {
        setForm(emptyForm());
        setEditing({});
    };

    const openEdit = (row) => {
        setForm({ ...emptyForm(), ...row });
        setEditing(row);
    };

    const onSave = async () => {
        if (!form.name?.trim()) {
            ErrorToaster("Name is required");
            return;
        }
        // PUT resets omitted fields, so always send the full set
        const payload = {
            ...Object.fromEntries(TEXT_FIELDS.map(([k]) => [k, (form[k] ?? "").toString().trim()])),
            is_active: !!form.is_active,
            is_default: !!form.is_default,
            is_deleted: false,
            is_for_manual_invoice: !!form.is_for_manual_invoice,
        };
        try {
            setSaving(true);
            if (editing?.id) {
                await http.put(`${GET_ADDRESS}${editing.id}/`, payload);
            } else {
                await http.post(GET_ADDRESS, payload);
            }
            // The server doesn't clear the old default, so do it here
            if (payload.is_default) {
                const others = rows.filter((r) => r.is_default && r.id !== editing?.id);
                await Promise.all(others.map((r) => http.patch(`${GET_ADDRESS}${r.id}/`, { is_default: false })));
            }
            SuccessToaster(editing?.id ? "Address updated" : "Address added");
            setEditing(null);
            load();
        } catch (e) {
            console.error("Save company address failed:", e);
            ErrorToaster(errorMessage(e, "Failed to save address"));
        } finally {
            setSaving(false);
        }
    };

    const textCol = (header, accessorKey) => ({
        header,
        accessorKey,
        enableColumnFilter: false,
        cell: ({ getValue }) => getValue() || "--",
    });
    const flagCol = (header, accessorKey) => ({
        header,
        accessorKey,
        enableColumnFilter: false,
        cell: ({ getValue }) => yesNo(getValue()),
    });

    const columns = useMemo(
        () => [
            textCol("Name", "name"),
            textCol("Address", "address"),
            textCol("City", "city"),
            textCol("State", "state"),
            textCol("Pincode", "pincode"),
            textCol("GST No.", "gst_no"),
            textCol("PAN No.", "pan_no"),
            flagCol("Active", "is_active"),
            flagCol("Default", "is_default"),
            flagCol("Manual Invoice", "is_for_manual_invoice"),
            {
                header: "Action",
                id: "action",
                enableColumnFilter: false,
                cell: ({ row }) => (
                    <div className="flex gap-2">
                        <Button size="sm" color="primary" onClick={() => openEdit(row.original)}>Edit</Button>
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp title="Company Address" />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
                    <div className="text-sm text-ink-muted">
                        <span className="font-bold text-ink">{rows.length}</span> addresses
                    </div>
                    <Button color="primary" className="h-9.5 px-6" onClick={openNew}>Add Address</Button>
                </div>

                <div className="page-fit-body mt-3">
                    {loading ? (
                        <Loader message="Loading Addresses ..." fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={rows}
                            isGlobalFilter={false}
                            isPagination={false}
                            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="62vh"
                        />
                    )}
                </div>
            </div>

            <Modal isOpen={!!editing} toggle={() => setEditing(null)} centered size="lg">
                <ModalHeader toggle={() => setEditing(null)}>{editing?.id ? "Edit Address" : "Add Address"}</ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        {TEXT_FIELDS.map(([key, label]) => (
                            <div key={key} className={`flex flex-col gap-1.5 ${key === "address" ? "sm:col-span-2" : ""}`}>
                                <Label className="form-label m-0 font-bold text-ink-muted">{label}</Label>
                                <input
                                    className="form-control"
                                    value={form[key] ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                />
                            </div>
                        ))}
                        <div className="flex flex-wrap gap-6 sm:col-span-2">
                            {FLAG_FIELDS.map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 text-sm text-ink">
                                    <input
                                        type="checkbox"
                                        checked={!!form[key]}
                                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                    <Button color="primary" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default CompanyAddress;

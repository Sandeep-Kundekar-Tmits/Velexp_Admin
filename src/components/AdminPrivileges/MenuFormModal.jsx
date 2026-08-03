import React, { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input, FormFeedback, Spinner, Row, Col } from "reactstrap";

const emptyForm = { link_name: "", link_url: "", parent: "", exc_ord: 1, is_active: true, show_panel: "side", faicon: "" };

const MenuFormModal = ({ isOpen, toggle, initialData, parentOptions = [], defaultParent = null, onSubmit, loading }) => {
    const isEdit = !!initialData?.menu_id;
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        setFormData(initialData ? {
            link_name: initialData.link_name ?? initialData.menu_name ?? "",
            link_url: initialData.link_url ?? initialData.menu_url ?? "",
            parent: initialData.parent ?? "",
            exc_ord: initialData.exc_ord ?? 1,
            is_active: initialData.is_active ?? true,
            show_panel: initialData.show_panel || "side",
            faicon: initialData.faicon || "",
        } : { ...emptyForm, parent: defaultParent ?? "" });
        setErrors({});
    }, [isOpen, initialData, defaultParent]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const validate = () => {
        const next = {};
        if (!formData.link_name.trim()) next.link_name = "Menu name is required";
        if (!formData.link_url.trim()) next.link_url = "Menu URL is required";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            ...formData,
            parent: formData.parent === "" ? null : Number(formData.parent),
            exc_ord: Number(formData.exc_ord) || 1,
        }, initialData?.menu_id);
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>{isEdit ? "Edit Menu" : "New Menu"}</ModalHeader>
            <ModalBody>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Name <span className="text-danger">*</span></Label>
                            <Input name="link_name" value={formData.link_name} invalid={!!errors.link_name} onChange={handleChange} />
                            <FormFeedback>{errors.link_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>URL <span className="text-danger">*</span></Label>
                            <Input name="link_url" value={formData.link_url} invalid={!!errors.link_url} onChange={handleChange} placeholder="/bookings" />
                            <FormFeedback>{errors.link_url}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Parent Menu</Label>
                            <Input type="select" name="parent" value={formData.parent ?? ""} onChange={handleChange}>
                                <option value="">— Top level —</option>
                                {parentOptions.filter((o) => o.menu_id !== initialData?.menu_id).map((o) => (
                                    <option key={o.menu_id} value={o.menu_id}>{o.menu_name}</option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label>Order</Label>
                            <Input type="number" name="exc_ord" value={formData.exc_ord} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label>Panel</Label>
                            <Input type="select" name="show_panel" value={formData.show_panel} onChange={handleChange}>
                                <option value="side">side</option>
                                <option value="top">top</option>
                            </Input>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Icon (bx class)</Label>
                            <Input name="faicon" value={formData.faicon} onChange={handleChange} placeholder="bx bx-box" />
                        </FormGroup>
                    </Col>
                    <Col md={6} className="d-flex align-items-center">
                        <FormGroup check className="mb-3">
                            <Input type="checkbox" name="is_active" id="menu-is-active" checked={formData.is_active} onChange={handleChange} />
                            <Label check for="menu-is-active">Active</Label>
                        </FormGroup>
                    </Col>
                </Row>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Cancel</Button>
                <Button color="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : isEdit ? "Save Changes" : "Create Menu"}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default MenuFormModal;

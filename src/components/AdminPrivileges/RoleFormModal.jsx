import React, { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input, FormFeedback, Spinner } from "@/components/ui";

const emptyForm = { name: "", description: "", is_active: true };

const RoleFormModal = ({ isOpen, toggle, initialData, onSubmit, loading }) => {
    const isEdit = !!initialData?.id;
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        setFormData(initialData ? {
            name: initialData.name || "",
            description: initialData.description || "",
            is_active: initialData.is_active ?? true,
        } : emptyForm);
        setErrors({});
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const validate = () => {
        const next = {};
        if (!formData.name.trim()) next.name = "Role name is required";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit(formData, initialData?.id);
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>{isEdit ? "Edit Role" : "New Role"}</ModalHeader>
            <ModalBody>
                <FormGroup>
                    <Label>Name <span className="text-danger-500">*</span></Label>
                    <Input name="name" value={formData.name} invalid={!!errors.name} onChange={handleChange} />
                    <FormFeedback>{errors.name}</FormFeedback>
                </FormGroup>
                <FormGroup>
                    <Label>Description</Label>
                    <Input type="textarea" name="description" value={formData.description} onChange={handleChange} />
                </FormGroup>
                <FormGroup check>
                    <Input type="checkbox" name="is_active" id="role-is-active" checked={formData.is_active} onChange={handleChange} />
                    <Label check for="role-is-active">Active</Label>
                </FormGroup>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Cancel</Button>
                <Button color="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : isEdit ? "Save Changes" : "Create Role"}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default RoleFormModal;

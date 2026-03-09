const Validation = () => {

    const validateForm = (data, validationRules) => {
        const errors = {};

        Object.keys(validationRules).forEach(field => {
            const rule = validationRules[field];
            const value = data[field];
            const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

            // Check required field first
            if (rule.required && isEmpty) {
                errors[field] = rule.requiredMessage;
            }
            // Only check additional validations if field exists and isn't empty
            else if (!isEmpty && rule.validate && !rule.validate(value)) {
                errors[field] = rule.validationMessage;
            }
        });

        return errors;
    };
    const allowOnlyString = (value) => {
        if (value === '') return true; // allow clearing the input
        const regex = /^[a-zA-Z\s]+$/;
        return regex.test(value);
    };

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        return regex.test(email);
    };
    const validateNumber = (value) => {
        const regex = /^\d*$/; // Allow only numeric values (0-9)
        return regex.test(value);
    };

    const validatePanCard = (pan) => {
        if (!pan || pan.length !== 10) return false;
      
        const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return regex.test(pan.toUpperCase());
      };
    return {
        validateForm,
        allowOnlyString,
        validateEmail,
        validateNumber,
        validatePanCard
    }
}

export default Validation
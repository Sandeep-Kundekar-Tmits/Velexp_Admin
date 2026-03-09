const formatDateForPayload = (originalData) => {
    // Return empty strings if startDate or endDate are empty
    if (originalData.startDate === "" || originalData.endDate === "") {
        return {
            from_date: '',
            to_date: ''
        };
    }

    // Convert ISO string to Date objects
    const startDate = new Date(originalData.startDate);
    const endDate = new Date(originalData.endDate);

    // Format dates as DD-MM-YYYY
    const format = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    return {
        from_date: format(startDate),
        to_date: format(endDate)
    };
};

export default formatDateForPayload;
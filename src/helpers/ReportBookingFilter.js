
const ReturnFilterData = (data) => {
    // Define status categories
    const inTransitStatuses = ['SAO', 'LDP', 'PUD', 'SMR', 'ITR'];
    const undeliveredStatuses = ['SPH', 'DRC', 'ICA', 'CRF', 'CNS', 'RTA', 'CAN', 'COS', 'ERA', 'PUP', 'DPT', 'RTO', 'DIS', 'OSA', 'ODD', 'CNA'];
    const deliveredStatuses = ['SPD', 'Delivered'];

    // Initialize counters
    const result = {
        IN_TRANSIT: 0,
        UNDELIVERED: 0,
        DELIVERED: 0,
        OTHER: 0,
        AVG_TAT: 0,
        TOTAL: 0
    };

    let Avg_TAT = 0

    // Return empty result if data is invalid
    if (!Array.isArray(data)) {
        return result;
    }

    // Process each item
    data.forEach((item) => {
        const status = item?.CHKPNT?.trim() || '';
        Avg_TAT = Avg_TAT + item.tat_days
        result.TOTAL++; // Always increment total count

        if (inTransitStatuses.includes(status)) {
            result.IN_TRANSIT++;
        } else if (undeliveredStatuses.includes(status)) {
            result.UNDELIVERED++;
        } else if (deliveredStatuses.includes(status)) {
            result.DELIVERED++;
        } else {
            result.OTHER++;
        }
    });

    // Calculate AVG_TAT safely
    let non_Zero_Days = data.filter((ele) => ele?.tat_days >= 1).length
    if (typeof Avg_TAT === 'number' && data.length > 0) {
        const avg = Avg_TAT / non_Zero_Days;
        result.AVG_TAT = !isNaN(avg) ? Number(avg.toFixed(2)) : 0;
    } else {
        result.AVG_TAT = 0;
    }
    return result;
};

export { ReturnFilterData }
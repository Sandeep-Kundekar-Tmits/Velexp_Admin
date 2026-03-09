self.onmessage = function (e) {
    const { action, payload } = e.data;

    switch (action) {
        case 'GET_UNIQUE_ORGSC':
            handleUniqueOrgsc(payload.bookings, action);
            break;
        case 'GET_UNIQUE_CHECKPT':
            handleUniqueCheckpnt(payload?.bookings, action);
            break;
        case 'GET_UNIQUE_SERVICE_CENTER':
            handleUniqueService_Center(payload?.bookings, action)
        default:
            console.warn('Unknown action:', action);
            postMessage({ action: 'UNKNOWN', result: [] });
    }
};

function handleUniqueOrgsc(bookings, action) {
    if (!bookings) {
        postMessage({ action, result: [] });
        return;
    }

    const uniqueSet = new Set();
    bookings.forEach((ele) => {
        if (ele?.orgsc) {
            uniqueSet.add(ele.orgsc);
        }
    });

    const result = Array.from(uniqueSet).map((ele) => ({
        value: ele,
        label: ele,
    }));

    postMessage({ action, result });
}

function handleUniqueCheckpnt(bookings, action) {
    if (!bookings) {
        postMessage({ action, result: [] });
        return;
    }

    const uniqueSet = new Set();
    bookings.forEach((ele) => {
        if (ele?.CHKPNT) {
            uniqueSet.add(ele.CHKPNT);
        }
    });

    const result = Array.from(uniqueSet).map((ele) => ({
        value: ele,
        label: ele,
    }));

    postMessage({ action, result });
}


// 
function handleUniqueService_Center(bookings, action) {
    if (!bookings) {
        postMessage({ action, result: [] });
        return;
    }

    const uniqueSet = new Set();
    bookings.forEach((ele) => {
        if (ele?.service_center) {
            uniqueSet.add(ele.service_center);
        }
    });

    const result = Array.from(uniqueSet).map((ele) => ({
        value: ele,
        label: ele,
    }));

    postMessage({ action, result });
}
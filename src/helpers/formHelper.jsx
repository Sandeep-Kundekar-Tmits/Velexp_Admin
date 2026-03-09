export function getModifiedFields(original, updated, path = '') {
    const changes = {};

    // Get all keys from both objects
    const allKeys = new Set([
        ...Object.keys(original || {}),
        ...Object.keys(updated || {})
    ]);

    for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;

        // Handle cases where original or updated might be null/undefined
        const originalVal = original ? original[key] : undefined;
        const updatedVal = updated ? updated[key] : undefined;

        // If both values are objects and not null, recurse
        if (typeof originalVal === 'object' && originalVal !== null &&
            typeof updatedVal === 'object' && updatedVal !== null &&
            !(originalVal instanceof File) && !(updatedVal instanceof File)) {
            const nestedChanges = getModifiedFields(originalVal, updatedVal, currentPath);
            if (Object.keys(nestedChanges).length > 0) {
                changes[key] = nestedChanges;
            }
        }
        // Primitive values or objects being replaced with non-objects
        else if (!deepEqual(originalVal, updatedVal)) {
            changes[key] = updatedVal;
        }
    }

    return changes;
}

// Helper function for deep equality check
function deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return a === b;

    // Handle Date comparison
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
            return false;
        }
    }

    return true;
}

export function renderUpdatedDataJSX(updatedData) {
    const renderValue = (value) => {
        if (value === null || value === undefined || value === "null") {
            return <span style={{ color: '#999', fontStyle: 'italic' }}>null</span>;
        }
        if (typeof value === 'boolean') {
            return (
                <span 
                    style={{ 
                        color: value ? '#2e7d32' : '#c62828',
                        fontWeight: '500',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: value ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)'
                    }}
                >
                    {value.toString()}
                </span>
            );
        }
        if (typeof value === 'number') {
            return <span style={{ color: '#1565c0', fontWeight: '500' }}>{value}</span>;
        }
        if (typeof value === 'string') {
            // Check if it's a date string
            if (!isNaN(Date.parse(value)) && value.length > 10) {
                return (
                    <span style={{ color: '#7b1fa2' }}>
                        {new Date(value).toLocaleString()}
                    </span>
                );
            }
            return <span>{value}</span>;
        }
        if (typeof value === 'object') {
            // Check if it's a File object
            if (value instanceof File || (value.name && value.size && value.type)) {
                return renderFileJSX(value);
            }
            // Handle empty objects
            if (Object.keys(value).length === 0) {
                return <span style={{ color: '#999', fontStyle: 'italic' }}>Empty object</span>;
            }
            return renderObjectJSX(value);
        }
        return <span>{value}</span>;
    };

    const renderFileJSX = (file) => {
        const fileSize = (file.size / 1024).toFixed(2) + ' KB';
        
        return (
            <div style={{
                padding: '12px',
                border: '1px dashed #90caf9',
                borderRadius: '8px',
                backgroundColor: '#e3f2fd',
                margin: '8px 0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ 
                        marginRight: '10px',
                        backgroundColor: '#bbdefb',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '0.8em'
                    }}>
                        {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                    <strong style={{ flex: 1 }}>{file.name}</strong>
                    <span style={{ color: '#666', fontSize: '0.9em' }}>{fileSize}</span>
                </div>
                
                {file.type.startsWith('image/') && (
                    <div style={{ 
                        marginTop: '12px',
                        textAlign: 'center',
                        borderTop: '1px solid #bbdefb',
                        paddingTop: '12px'
                    }}>
                        <strong style={{ 
                            display: 'block', 
                            marginBottom: '8px',
                            color: '#0d47a1'
                        }}>Preview:</strong>
                        <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                display: 'block',
                                margin: '0 auto',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: '1px solid #e0e0e0'
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    const renderObjectJSX = (obj, parentKey = '') => {
        if (!obj || Object.keys(obj).length === 0) {
            return (
                <div style={{ 
                    color: '#999', 
                    fontStyle: 'italic',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    textAlign: 'center'
                }}>
                    No data available
                </div>
            );
        }

        return (
            <div style={{
                marginLeft: parentKey ? '16px' : '0',
                borderLeft: parentKey ? '1px solid #e0e0e0' : 'none',
                padding: parentKey ? '8px 0 8px 12px' : '0',
                transition: 'all 0.3s ease'
            }}>
                {Object.entries(obj).map(([key, value]) => {
                    const isNestedSection = ['addresses', 'franchise_profile', 'cust_type'].includes(key);
                    const shouldShowColon = key !== "0";
                    const isModified = JSON.stringify(value) !== JSON.stringify({});

                    return (
                        <div
                            className={`d-flex ${isNestedSection ? 'nested-section' : ''}`}
                            key={`${parentKey}-${key}`}
                            style={{
                                marginBottom: '16px',
                                flexDirection: isNestedSection ? 'column' : 'row',
                                backgroundColor: isNestedSection ? '#f5f5f5' : 'transparent',
                                borderRadius: '8px',
                                padding: isNestedSection ? '16px' : '0',
                                border: isNestedSection ? '1px solid #e0e0e0' : 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: isNestedSection ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isModified && (
                                <div style={{
                                    position: 'absolute',
                                    top: '0',
                                    right: '0',
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    fontSize: '0.7em',
                                    padding: '2px 8px',
                                    borderRadius: '0 0 0 4px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}>
                                    Modified
                                </div>
                            )}
                            
                            <h5 className="text-capitalize" style={{
                                color: isNestedSection ? '#333' : '#555',
                                width: isNestedSection ? '100%' : '40%',
                                marginBottom: isNestedSection ? '16px' : '0',
                                fontWeight: isNestedSection ? '600' : '500',
                                fontSize: isNestedSection ? '1.15rem' : '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                padding: isNestedSection ? '0 0 8px 0' : '0',
                                borderBottom: isNestedSection ? '1px solid #e0e0e0' : 'none'
                            }}>
                                <span style={{
                                    marginRight: '10px',
                                    color: isNestedSection ? '#0d47a1' : '#666',
                                    fontSize: '1em',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                }}>
                                    {isNestedSection ? (
                                        <span style={{ marginRight: '6px' }}>📌</span>
                                    ) : (
                                        <span style={{
                                            display: 'inline-block',
                                            width: '6px',
                                            height: '6px',
                                            backgroundColor: '#1976d2',
                                            borderRadius: '50%',
                                            marginRight: '8px'
                                        }}></span>
                                    )}
                                </span>
                                {key.replace(/_/g, ' ')}{shouldShowColon ? ':' : ''}
                            </h5>
                            <div className="text-wrap" style={{
                                width: isNestedSection ? '100%' : '60%',
                                paddingLeft: isNestedSection ? '12px' : '0',
                                color: isNestedSection ? '#333' : '#1976d2',
                                fontWeight: isNestedSection ? '500' : '400',
                                fontSize: isNestedSection ? '1rem' : '0.95rem',
                                lineHeight: '1.6',
                                wordBreak: 'break-word'
                            }}>
                                {renderValue(value)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            fontFamily: "'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', sans-serif",
            fontSize: '15px',
            color: '#333',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            maxHeight: '500px',
            overflowY: 'auto',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            border: '1px solid #e0e0e0'
        }}>
            <div style={{
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h4 style={{ 
                    margin: '0',
                    color: '#0d47a1',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <span style={{ 
                        marginRight: '10px',
                        fontSize: '1.2em'
                    }}>📋</span>
                    Updated Data Preview
                </h4>
                <span style={{
                    fontSize: '0.85em',
                    color: '#666',
                    backgroundColor: '#f5f5f5',
                    padding: '4px 8px',
                    borderRadius: '4px'
                }}>
                    {Object.keys(updatedData).length} fields
                </span>
            </div>
            
            {renderObjectJSX(updatedData)}
        
        </div>
    );
}
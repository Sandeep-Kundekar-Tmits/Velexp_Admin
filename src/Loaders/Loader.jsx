import React from 'react';
import { Spinner } from 'reactstrap';

const Loader = ({
    message = "Loading...",
    spinnerColor = "#556ee6", // Theme primary color
    textColor = "#556ee6",
    overlayColor = "rgba(255, 255, 255, 0.8)", // Clean light overlay
}) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: overlayColor,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
        }}>
            <div style={{ textAlign: 'center' }}>
                <Spinner
                    style={{
                        width: '3rem',
                        height: '3rem',
                        color: spinnerColor
                    }}
                />
                {message && (
                    <div style={{
                        marginTop: '1rem',
                        color: textColor,
                        fontWeight: '500',
                        fontSize: '1rem'
                    }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Loader;
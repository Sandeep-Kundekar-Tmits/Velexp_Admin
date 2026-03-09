import React from 'react';
import { Spinner } from 'reactstrap';

const Loader = ({
    message = "Processing...",
    spinnerColor = "primary",
    textColor = "#ffffff",
    overlayColor = "rgba(0, 0, 0, 0.7)",
    spinnerSize = "3rem",
    fontSize = "1.25rem"
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
            zIndex: 100,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '2rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
                <Spinner
                    color={spinnerColor}
                    style={{
                        width: spinnerSize,
                        height: spinnerSize,
                        borderWidth: '0.25em',
                        margin: "auto"
                    }}
                />

                {message && (
                    <div style={{
                        color: textColor,
                        fontSize: fontSize,
                        fontWeight: 500,
                        textAlign: 'center',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                        maxWidth: '300px',
                        lineHeight: '1.5'
                    }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Loader;
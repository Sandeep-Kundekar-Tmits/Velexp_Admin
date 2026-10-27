import React, { useEffect, useRef, useState } from 'react';
import { Download, ImageOff, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

/**
 * PodImageViewer Component
 * A modal component used to display a POD (Proof of Delivery) image, with
 * zoom, rotate and download controls.
 *
 * @param {Object} props
 * @param {string} props.podValue - The URL or base64 string of the POD image to display.
 * @param {Function} props.toggleModal - Function to toggle the visibility of this modal (close it).
 */
const PodImageViewer = ({ podValue, toggleModal }) => {
    const [failed, setFailed] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const bodyRef = useRef(null);
    const drag = useRef({ active: false, moved: false, x: 0, y: 0, left: 0, top: 0 });

    // Mouse wheel over the picture zooms it. React attaches wheel listeners as
    // passive, which can't stop the popup scrolling underneath, so this one is
    // native and non-passive.
    useEffect(() => {
        const el = bodyRef.current;
        if (!el) return undefined;
        const onWheel = (e) => {
            e.preventDefault();
            setZoom((z) => {
                const next = z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
                return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +next.toFixed(2)));
            });
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [failed]);

    // Drag to pan once the picture is larger than the box; a click that did not
    // drag toggles between fit and 2x, double-click resets.
    const onMouseDown = (e) => {
        const el = bodyRef.current;
        drag.current = { active: true, moved: false, x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
        e.preventDefault();
    };
    const onMouseMove = (e) => {
        const d = drag.current;
        if (!d.active) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
        bodyRef.current.scrollLeft = d.left - dx;
        bodyRef.current.scrollTop = d.top - dy;
    };
    const endDrag = () => {
        drag.current.active = false;
    };
    const onImageClick = () => {
        if (drag.current.moved) return;
        setZoom((z) => (z > 1 ? 1 : 2));
    };

    const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
    const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
    const rotateRight = () => setRotation((r) => r + 90);
    const rotateLeft = () => setRotation((r) => r - 90);
    const reset = () => {
        setZoom(1);
        setRotation(0);
    };

    // <a download> is ignored for cross-origin URLs, so fetch the file as a blob
    // first; if the server blocks that (CORS), fall back to opening it in a tab.
    const onDownload = async () => {
        const fileName = `POD_${Date.now()}`;
        try {
            const res = await fetch(podValue);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.${ext}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("POD download failed, opening in a new tab:", e);
            window.open(podValue, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <>
            {/* lg (max-w-3xl) rather than the default md: a POD is a scanned
                document, and 512px is not enough of it to read. */}
            <Modal isOpen={true} toggle={toggleModal} centered size="lg">
                <ModalHeader toggle={toggleModal}>POD Document</ModalHeader>

                {!failed && (
                    <div className="flex flex-wrap items-center justify-center gap-2 border-b border-line px-5 py-2">
                        <Button color="secondary" size="sm" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} title="Zoom out">
                            <ZoomOut aria-hidden="true" className="size-4" />
                        </Button>
                        <span className="w-12 text-center text-xs font-bold text-ink">{Math.round(zoom * 100)}%</span>
                        <Button color="secondary" size="sm" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} title="Zoom in">
                            <ZoomIn aria-hidden="true" className="size-4" />
                        </Button>
                        <Button color="secondary" size="sm" onClick={rotateLeft} title="Rotate left">
                            <RotateCcw aria-hidden="true" className="size-4" />
                        </Button>
                        <Button color="secondary" size="sm" onClick={rotateRight} title="Rotate right">
                            <RotateCw aria-hidden="true" className="size-4" />
                        </Button>
                        <Button color="secondary" size="sm" onClick={reset} title="Reset zoom and rotation">
                            Reset
                        </Button>
                        <Button color="primary" size="sm" onClick={onDownload} title="Download">
                            <Download aria-hidden="true" className="size-4" />
                            Download
                        </Button>
                    </div>
                )}

                {/* Zoom resizes the image itself (not a CSS scale), so the body's
                    scroll area grows with it and every edge stays reachable.
                    m-auto centres it while it fits. */}
                <ModalBody className="flex max-h-[65vh] overflow-auto p-5" ref={bodyRef} onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}>
                    {failed ? (
                        <div className="m-auto flex flex-col items-center gap-2 py-12 text-ink-muted">
                            <ImageOff aria-hidden="true" className="size-7" />
                            <p className="m-0 text-[13px]">Image not available</p>
                        </div>
                    ) : (
                        <img
                            src={podValue}
                            alt="POD Document"
                            className="m-auto h-auto shrink-0 rounded-lg border border-white/10 bg-black/20 object-contain transition-transform duration-200"
                            style={{ width: `${zoom * 100}%`, maxWidth: "none", transform: `rotate(${rotation}deg)`, cursor: zoom > 1 ? "grab" : "zoom-in" }}
                            draggable={false}
                            onMouseDown={onMouseDown}
                            onClick={onImageClick}
                            onDoubleClick={reset}
                            title="Scroll to zoom, click to toggle zoom, drag to move"
                            /* State, not a swapped src: the old handler pointed
                               at a placeholder path that does not exist, so the
                               fallback itself failed to load and re-fired this
                               same handler. */
                            onError={() => setFailed(true)}
                        />
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleModal}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default PodImageViewer;

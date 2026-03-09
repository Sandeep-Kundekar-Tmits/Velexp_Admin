import React, { useEffect, useState, useRef } from "react";
import "../../styles/InScanWeight.css"
/* ------------------- ERROR POPUP COMPONENT ------------------- */

const ErrorPopup = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <h3 style={styles.title}>Error</h3>
        <p style={styles.msg}>{message}</p>
        <button style={styles.button} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

/* ------------------- SUCCESS POPUP COMPONENT ------------------- */

const SuccessPopup = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.popup,
          borderLeft: "6px solid #00a000",
        }}
      >
        <h3 style={{ ...styles.title, color: "#00a000" }}>Success</h3>
        <p style={styles.msg}>{message}</p>
        <button
          style={{
            ...styles.button,
            background: "#00a000",
          }}
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
};

/* ------------------- POPUP STYLES ------------------- */

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  popup: {
    background: "#fff",
    padding: "20px 30px",
    borderRadius: "10px",
    width: "300px",
    textAlign: "center",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
  },
  title: {
    margin: 0,
    marginBottom: "10px",
    fontWeight: "bold",
    color: "#c20000",
  },
  msg: {
    marginBottom: "20px",
    fontSize: "15px",
  },
  button: {
    padding: "8px 20px",
    background: "#c20000",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

/* ------------------- INPUT FIELD ------------------- */

const InputField = ({
  label,
  value,
  weight,
  type = "text",
  onChange,
  placeholder,
  readOnly = false,
}) => {
  return (
    <div className="field-group-ws">
      <label className="Label-ws">
        {label.split("*")[0]}
        {label.includes("*") && <span style={{ color: "red" }}> *</span>}

        {label === "Weight" ? (
          weight ? (
            <div className="Activeindicator-ws"></div>
          ) : (
            <div className="indicator-ws"></div>
          )
        ) : (
          ""
        )}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className="Input-ws"
      />
    </div>
  );
};

/* ------------------- MAIN FORM ------------------- */

const InScanWeight = () => {
  const [ports, setPorts] = useState([]);
  const [port, setPort] = useState(null);
  const [connected, setConnected] = useState(false);
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  // POPUPS
  const [popupError, setPopupError] = useState("");
  const [popupSuccess, setPopupSuccess] = useState("");

  // Form fields
  const [awb, setAwb] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [length, setLength] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [volumetricWeight, setVolumetricWeight] = useState("");

  const latestValueRef = useRef("");
  const smoothUpdateTimer = useRef(null);
  const readerRef = useRef(null);

  /* --- Volumetric Weight Calculator --- */
  const calculateVolumetricWeight = (l, w, h) => {
    if (!l || !w || !h) return "";
    return ((l * w * h) / 5000).toFixed(2);
  };

  /* ------------------- LOAD PORTS ------------------- */
  useEffect(() => {
    async function loadPorts() {
      try {
        const authorizedPorts = await navigator.serial.getPorts();
        setPorts(authorizedPorts);
        if (authorizedPorts.length > 0) setPort(authorizedPorts[0]);
      } catch (err) {
        console.error(err);
      }
    }

    loadPorts();

    navigator.serial.addEventListener("connect", loadPorts);
    navigator.serial.addEventListener("disconnect", () => {
      setPort(null);
      setConnected(false);
      setWeight("");
    });

    return () => {
      navigator.serial.removeEventListener("connect", loadPorts);
      navigator.serial.removeEventListener("disconnect", loadPorts);
    };
  }, []);

  /* ------------------- REQUEST PORT ------------------- */
  const requestPort = async () => {
    try {
      const newPort = await navigator.serial.requestPort();
      setPorts((prev) => [...prev, newPort]);
      setPort(newPort);
      setError("");
    } catch (err) {
      setError("Weighing Scale access was denied.");
    }
  };

  /* ------------------- AUTO CONNECT ------------------- */
  useEffect(() => {
    if (port && !connected) setTimeout(connectAndRead, 200);
  }, [port]);

  /* ------------------- CONNECT & READ ------------------- */
  const connectAndRead = async () => {
    if (!port) return;

    try {
      await port.open({ baudRate: 9600 });
      setConnected(true);

      const reader = port.readable.getReader();
      readerRef.current = reader;

      const decoder = new TextDecoder();

      smoothUpdateTimer.current = setInterval(() => {
        setWeight(latestValueRef.current);
      }, 100);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        latestValueRef.current = decoder.decode(value).trim();
      }
    } catch (err) {
      setPopupError("Connection failed: " + err.message);
      setConnected(false);
    }
  };

  /* ------------------- CLEANUP ------------------- */
  useEffect(() => {
    return () => {
      clearInterval(smoothUpdateTimer.current);
      if (readerRef.current) readerRef.current.releaseLock();
    };
  }, []);

  /* ------------------- PARSE WEIGHT ------------------- */
  const parseWeight = (raw) => {
    if (!raw) return 0;
    return parseFloat(raw.replace("+", "").trim()) || 0;
  };

  /* ------------------- AVERAGE WEIGHT ------------------- */
  const getAveragedWeight = async () => {
    const samples = [];

    for (let i = 0; i < 10; i++) {
      const w = parseWeight(latestValueRef.current);
      if (w && w !== 0) samples.push(w);

      await new Promise((res) => setTimeout(res, 100));
    }

    if (samples.length === 0) {
      const fallback = parseWeight(latestValueRef.current);
      return fallback > 0 ? fallback : null;
    }

    return samples.reduce((a, b) => a + b, 0) / samples.length;
  };

  /* ------------------- SAVE & VALIDATE ------------------- */
  const handleSave = async () => {
    if (!awb.trim()) return setPopupError("AWB is required");
    if (!deviceId.trim()) return setPopupError("Device ID is required");

    let avgWeight = await getAveragedWeight();
    if (!avgWeight || avgWeight <= 0 || isNaN(avgWeight))
      return setPopupError("Valid weight is required before saving");
    if (!port) return setPopupError("Select Weighing Scale Machine Port ");
    const payload = {
      awbno: awb,
      length: length || 0,
      height: height || 0,
      width: width || 0,
      weight: avgWeight.toFixed(2),
      deviceId,
    };

    try {
      const response = await fetch(
        "https://velexp.com/InscanWeightAPI/InscanWeight/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok)
        return setPopupError(result.message || "Failed to save data");

      setPopupSuccess("Data saved successfully!");
    } catch (err) {
      setPopupError("Error saving data: " + err.message);
    }
  };

  /* ------------------- RESET FORM ------------------- */
  const resetForm = () => {
    setAwb("");
    setDeviceId("");
    setLength("");
    setHeight("");
    setWidth("");
    setWeight("");
    setVolumetricWeight("");
    latestValueRef.current = "";
  };

  /* ------------------- RENDER UI ------------------- */

  return (
    <div className="form-container-ws">
      {/* Row 1 */}
      <div>
        <div className="row-ws">
          <InputField
            label="AWB *"
            value={awb}
            placeholder="Enter AWB No."
            onChange={(e) => setAwb(e.target.value)}
          />
          <InputField
            label="Device Id *"
            value={deviceId}
            placeholder="Enter Device Id"
            onChange={(e) => setDeviceId(e.target.value)}
          />
        </div>

        {/* Section Titles */}
        <div className="section-row-ws">
          <div className="section-title-ws">Dimensions</div>
          <div className="section-title-ws">Weight Scanning</div>
        </div>

        {/* Main Content */}
        <div className="content-row-ws">
          {/* Dimensions */}
          <div className="dimensions-box-ws">
            <InputField
              label="Length"
              type="number"
              placeholder="Enter Length"
              value={length}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || Number(v) >= 0) {
                  setLength(v);
                  setVolumetricWeight(
                    calculateVolumetricWeight(v, width, height)
                  );
                }
              }}
            />

            <InputField
              label="Height"
              type="number"
              placeholder="Enter Height"
              value={height}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || Number(v) >= 0) {
                  setHeight(v);
                  setVolumetricWeight(
                    calculateVolumetricWeight(length, width, v)
                  );
                }
              }}
            />

            <InputField
              label="Width"
              type="number"
              placeholder="Enter Width"
              value={width}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || Number(v) >= 0) {
                  setWidth(v);
                  setVolumetricWeight(
                    calculateVolumetricWeight(length, v, height)
                  );
                }
              }}
            />
            <InputField
              label="Volumetric Weight"
              value={volumetricWeight}
              readOnly
              placeholder="0.00"
            />
          </div>

          {/* Weight */}
          {/* NEW PART: PORT SELECTOR */}
          <div className="weight-box-ws">
            {/* {ports.length > 0 && (
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyItems: "center",
                  gap: 6,
                }}
              >
                <label style={{ display: "block", fontSize: 14 }}>
                  Select Scale Port
                </label>

                <select
                  value={ports.findIndex((p) => p === port)}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setPort(ports[idx]);
                    setError("");
                  }}
                  style={{
                    padding: "3px 5px",
                    border: "1px solid #c6caceff",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {ports.map((p, idx) => (
                    <option key={idx} value={idx}>
                      Port {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
            )} */}

            {/* {!port && ( */}
            <button
              className="weight-box-ws"
              onClick={requestPort}
              style={{
                width: "100%",
                marginTop: 10,
                border: "1px solid #d3d9e0",
                borderRadius: 5,
              }}
            >
              Select Weighing Scale USB Serial Port Access
            </button>
            {/* )} */}
            {error && !port && <p style={{ color: "red" }}>{error}</p>}

            <InputField
              label="Weight"
              value={weight}
              weight={port}
              readOnly
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer-ws">
        <button className="save-btn-ws" onClick={handleSave}>
          Save Data
        </button>
      </div>

      {/* POPUPS */}
      <ErrorPopup message={popupError} onClose={() => setPopupError("")} />
      <SuccessPopup
        message={popupSuccess}
        onClose={() => {
          resetForm();
          setPopupSuccess("");
        }}
      />
    </div>
  );
};

export default InScanWeight;



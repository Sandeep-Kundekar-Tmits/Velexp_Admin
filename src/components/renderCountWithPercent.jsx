const renderCountWithPercent = (getValue) => {
  const { count = 0, percent = 0 } = getValue() || {};

  return (
    <div className="d-flex align-items-center gap-1">
      <div
        className=""
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#111',

        }}
      >
        {count}
      </div>
      {/* <div className=""
       style={{
        border :"solid gray 1px",
        width:"1px",
        height:"20px",
        marginInline:"6px"
       }}
      ></div> */}
      <div
        style={{
          fontSize: '12px',
          color: '#333333',
        }}
      >
        ({percent}%)
      </div>
    </div>
  );
};

export default renderCountWithPercent;

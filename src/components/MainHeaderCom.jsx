const MainHeaderComp = ({ title = "", subTitle = "", extraFields = null }) => {
    return (
        <div className="d-flex justify-content-between border-bottom py-2 px-2">
            <div>
                <h2 className='m-0'>{title}</h2>
                {subTitle && (
                    <p className="text-muted m-0" style={{ fontSize: "14px" }}>
                        {subTitle}
                    </p>
                )}
            </div>
            <div>{extraFields}</div>
        </div>
    )
}
export default MainHeaderComp
const MainHeaderComp = ({ title = "", subTitle = "", extraFields = null }) => {
    return (
        <div className="flex justify-between border-bottom py-2 px-2">
            <div>
                <h2 className='m-0'>{title}</h2>
                {subTitle && (
                    <p className="text-ink-muted m-0" style={{ fontSize: "14px" }}>
                        {subTitle}
                    </p>
                )}
            </div>
            <div>{extraFields}</div>
        </div>
    )
}
export default MainHeaderComp
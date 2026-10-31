import { useCallback, useEffect, useRef } from "react";
import PageHeaderActions from "./VerticalLayout/PageHeaderActions";
import { usePageHeaderTitle } from "./VerticalLayout/PageHeaderContext";

/**
 * The header ~70 screens render -- now a hand-off to the shared one.
 *
 * It used to draw its own title block inside the page, which meant two headers
 * on screen once VerticalLayout started rendering PageHeader for every route:
 * the layout's bar at the top, then this one again below it. Rather than edit
 * 69 call sites, this keeps the same props and forwards them.
 *
 * So it renders nothing of its own now. `title` and `subTitle` go up through
 * context, `extraFields` through the actions portal, and the screens calling it
 * are unchanged.
 */
const MainHeaderComp = ({ title = "", subTitle = "", extraFields = null, titleBadge = null, onRefresh = null, refreshing = false }) => {
    // The header lives in context, so a changing callback would republish it on every render.
    // Hand it a stable wrapper that always calls the latest onRefresh.
    const refreshRef = useRef(onRefresh);
    useEffect(() => { refreshRef.current = onRefresh; });
    const stableRefresh = useCallback(() => refreshRef.current?.(), []);

    usePageHeaderTitle(title, subTitle, titleBadge?.text, titleBadge?.tone, onRefresh ? stableRefresh : null, refreshing);

    return extraFields ? <PageHeaderActions>{extraFields}</PageHeaderActions> : null;
};

export default MainHeaderComp;

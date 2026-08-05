import { Button, Input, Label } from "@/components/ui";
import MainHeaderComp from "../MainHeaderCom";
import { useState } from "react";
import AWBPage from "./AWBPage";

const AWBPrintPage = () => {
    const [awbNo, setAwbNo] = useState("");
    const [showPage, setShowPage] = useState(false);

    const handlePrint = () => {
        if (!awbNo.trim()) {
            alert("Please enter AWB No");
            return;
        }
        setShowPage(true);
    };

    // When Print is clicked → Load AWBPage
    if (showPage) {
        return <AWBPage awbNo={awbNo} onBack={() => {
            setShowPage(false)
        }} />;
    }

    return (
        /* No page-fit: one field and a button, far shorter than the viewport,
           so there is no leftover height to hand out. */
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            {/* No sticky wrapper: MainHeaderComp draws nothing inline now, it
                hands the title to the layout's PageHeader, which is already
                fixed above the scroll box. */}
            <MainHeaderComp
                title="AWB Label Print"
                subTitle="Look up a shipment and print its label."
            />

            <div className="container-fluid relative z-10 px-4 pb-4">
                {/* One row with the action on the field's baseline. The button
                    was carrying marginBottom:15px to fake its way back into
                    alignment past the label above the input; items-end does it
                    properly, and holds once the row wraps on a phone.

                    Enter submits: this screen is one field, and reaching for
                    the mouse to print each label is the slow path. */}
                <form
                    className="filter-row"
                    onSubmit={(e) => { e.preventDefault(); handlePrint(); }}
                >
                    <div className="filter-group">
                        <div className="flex w-full flex-col gap-1.5 sm:w-56">
                            <Label className="form-label m-0 font-bold text-ink-muted">
                                AWB
                            </Label>
                            <Input
                                type="text"
                                placeholder="Enter AWB No."
                                value={awbNo}
                                onChange={(e) => setAwbNo(e.target.value)}
                                style={{ height: "38px" }}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="table-action-btn table-action-btn-primary"
                        >
                            Print
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AWBPrintPage;

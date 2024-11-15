import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";

export const AppBridgeV4Modal = ({
    title,
    id,
    dirty,
    src,
    saveModal,
    resetModal,
}: Omit<ReturnType<typeof useAppBridgeV4Modal>, "openModal">) => {
    // tbh I don't really understand useRef but someone smart at shopify posted a demo of the modal with it and I figure she probably knows what shes doing so im keeping it
    const modalRef = useRef<UIModalElement>(null);
    return (
        <>
            <Modal
                ref={modalRef}
                src={src}
                id={id}
                variant={"max"}
            >
                <TitleBar title={title}>
                    <button disabled={dirty} onClick={() => resetModal()}>
                        Reset
                    </button>
                    <button disabled={!dirty} onClick={() => saveModal()} variant="primary">Save</button>
                </TitleBar>
            </Modal>
        </>
    );
};
type AppBridgeV4ModalArgs = {
    src: string;
    id: string;
    title: string;
};
export function useAppBridgeV4Modal({
    src,
    id,
    title,
}: AppBridgeV4ModalArgs) {
    const [dirty, setDirty] = useState(false);
    const shopify = useAppBridge();
    const openModal = useCallback(() => {
        void shopify.modal.show(id);
    }, [id]);

    useEffect(() => {
        function handleMessageFromModal(ev: MessageEvent<{ dirty: boolean, actionSuccess?: boolean, message?: string }>) {
            if (ev.data.dirty) {
                setDirty(true);
            }
            if (ev.data?.dirty === false) {
                setDirty(false);
            }
            if (ev.data?.actionSuccess === true) {
                shopify.toast.show(ev.data.message ?? "Success")
            }
            if (ev.data?.actionSuccess === false) {
                shopify.toast.show(ev.data.message ?? "Failed", { isError: true })
            }
        }

        window.addEventListener("message", handleMessageFromModal);
        return () => {
            window.removeEventListener("message", handleMessageFromModal);
        };
    }, []);

    const saveModal = useCallback(() => {
        document
            .getElementById(id)
            ?.contentWindow?.postMessage("save", location.origin);
    }, [id]);

    const resetModal = useCallback(() => {
        document
            .getElementById(id)
            ?.contentWindow?.postMessage("reset", location.origin);
    }, [id]);

    return {
        id,
        title: title,
        src,
        openModal,
        saveModal,
        resetModal,
        dirty,
    };
}

export function useInnerAppBridgeV4Modal({
    onSave,
    onReset,
    dirty,
    actionData,
}: {
    onSave: () => void;
    onReset: () => void;
    dirty: boolean;
    actionData?: RouteResponse<{ message: string }>;
}) {
    const [allowToastOnIdle, setAllowToastOnIdle] = useState<boolean>(
        actionData !== undefined,
    );
    const navigateState = useNavigateState();
    const toggleIsDirty = useCallback((dirty: boolean) => {
        window.opener?.postMessage({ dirty }, location.origin);
    }, []);
    useEffect(() => {
        if (navigateState !== "idle") {
            if (!allowToastOnIdle) {
                setAllowToastOnIdle(true);
            }
            return;
        }
        if (actionData?.message && typeof actionData?.success === "boolean") {
            if (actionData?.success) {
                window.opener?.postMessage(
                    {
                        actionSuccess: true,
                        message: actionData?.message,
                    },
                    location.origin,
                );
            } else {
                window.opener?.postMessage(
                    {
                        actionSuccess: false,
                        message: actionData?.message,
                    },
                    location.origin,
                );
            }
            setAllowToastOnIdle(false);
        }
    }, [actionData?.message, actionData?.success, navigateState, onReset]);
    useEffect(() => {
        if (dirty) {
            toggleIsDirty(true);
        } else {
            toggleIsDirty(false);
        }
    }, [dirty, toggleIsDirty]);
    useEffect(() => {
        function handleMessageFromMainApp(ev: MessageEvent<"save" | "reset">) {
            if (ev.data === "save") {
                onSave();
            }
            if (ev.data === "reset") {
                onReset();
            }
        }

        window.addEventListener("message", handleMessageFromMainApp);
        return () => {
            window.removeEventListener("message", handleMessageFromMainApp);
        };
    }, [onSave, onReset]);
}

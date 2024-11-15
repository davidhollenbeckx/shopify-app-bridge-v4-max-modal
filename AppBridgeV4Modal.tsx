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
                    <button disabled={!dirty} onClick={() => saveModal} variant="primary">Save</button>
                </TitleBar>
            </Modal>
        </>
    );
};
type AppBridgeV4ModalArgs = {
    title: string;
    id: string;
    // this is specific to my implementation - you can get rid of this or replace with whats relevant to you.
    resource: "tiles" | "rules" | "layouts";
};
export function useAppBridgeV4Modal({
    resource,
    id,
    title,
}: AppBridgeV4ModalArgs) {
    const [dirty, setDirty] = useState(false);
    const shopify = useAppBridge();
    const modalId = useMemo(() => `modal-${resource}-${id}`, [id, resource]);
    const modalSrc = useMemo(() => `/modal/${resource}/${id}`, [id, resource]);
    const openModal = useCallback(() => {
        void shopify.modal.show(modalId);
    }, [modalId, shopify.modal]);

    useEffect(() => {
        function handleMessageFromModal(ev: MessageEvent<{ dirty: boolean }>) {
            if (ev.data.dirty) {
                setDirty(true);
            }
            if (ev.data?.dirty === false) {
                setDirty(false);
            }
        }

        window.addEventListener("message", handleMessageFromModal);
        return () => {
            window.removeEventListener("message", handleMessageFromModal);
        };
    }, []);

    const saveModal = useCallback(() => {
        document
            .getElementById(modalId)
            ?.contentWindow?.postMessage("save", location.origin);
    }, [modalId]);

    const resetModal = useCallback(() => {
        document
            .getElementById(modalId)
            ?.contentWindow?.postMessage("reset", location.origin);
    }, [modalId]);

    return {
        id: modalId,
        title: title,
        src: modalSrc,
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
}: {
    onSave: () => void;
    onReset: () => void;
    dirty: boolean;
}) {
    const toggleIsDirty = useCallback((dirty: boolean) => {
        window.opener.postMessage({ dirty }, location.origin);
    }, []);
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
    }, []);
}

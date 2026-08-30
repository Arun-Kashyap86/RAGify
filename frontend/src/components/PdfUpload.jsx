import { useRef } from "react";

function PdfUpload({ uploading, onUpload }) {
    const inputRef = useRef(null);

    function handleChange(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        onUpload(file);
        event.target.value = "";
    }

    return (
        <div className="upload-section">
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                onChange={handleChange}
                hidden
            />

            <button
                className="upload-button"
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
            >
                {uploading ? "Processing PDF..." : "Upload PDF"}
            </button>
        </div>
    );
}

export default PdfUpload;
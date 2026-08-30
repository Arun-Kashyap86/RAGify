function ErrorMessage({ message, onClose }) {
    if (!message) return null;

    return (
        <div className="error-message">
            <span>{message}</span>

            {onClose && (
                <button type="button" onClick={onClose}>
                    Close
                </button>
            )}
        </div>
    );
}

export default ErrorMessage;
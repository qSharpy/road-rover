export function initializeUILogger() {
    const logContainer = document.createElement('div');
    logContainer.id = 'ui-log-container';
    logContainer.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        right: 10px;
        max-height: 30vh;
        overflow-y: auto;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
    `;
    document.body.appendChild(logContainer);
}

export function logToUI(message, type = 'info') {
    const logContainer = document.getElementById('ui-log-container');
    if (!logContainer) {
        console.error('UI log container not found');
        return;
    }

    const logEntry = document.createElement('div');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEntry.style.color = type === 'error' ? 'red' : type === 'warn' ? 'yellow' : 'white';

    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;

    // Limit the number of log entries to prevent performance issues
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}
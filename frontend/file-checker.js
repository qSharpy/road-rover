export function checkFileExistence(url) {
    return fetch(url, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                return { exists: true, contentType: response.headers.get('Content-Type') };
            } else {
                return { exists: false, status: response.status };
            }
        })
        .catch(error => {
            return { exists: false, error: error.message };
        });
}
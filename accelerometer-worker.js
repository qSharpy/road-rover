let collecting_worker = false;

self.onmessage = function(e) {
    if (e.data.command === 'start') {
        collecting_worker = true;
        collectData();
    } else if (e.data.command === 'stop') {
        collecting_worker = false;
    }
};

function collectData() {
    if (collecting_worker) {
        if ('DeviceMotionEvent' in self) {
            self.addEventListener('devicemotion', (event) => {
                const { x, y, z } = event.accelerationIncludingGravity;
                self.postMessage({ x, y, z, timestamp: new Date().toISOString() });
            }, true);
        } else {
            console.error('DeviceMotionEvent is not supported in this context');
            alert('DeviceMotionEvent is not supported in this context');
        }
    }
}

let collecting-worker = false;

self.onmessage = function(e) {
    if (e.data.command === 'start') {
        collecting-worker = true;
        collectData();
    } else if (e.data.command === 'stop') {
        collecting-worker = false;
    }
};

function collectData() {
    if (collecting-worker) {
        if ('DeviceMotionEvent' in self) {
            self.addEventListener('devicemotion', (event) => {
                const { x, y, z } = event.accelerationIncludingGravity;
                self.postMessage({ x, y, z, timestamp: new Date().toISOString() });
            }, true);
        } else {
            console.error('DeviceMotionEvent is not supported in this context');
        }
    }
}

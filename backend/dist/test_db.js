"use strict";
async function testDebug() {
    try {
        console.log('Fetching http://localhost:3001/api/questions...');
        const res = await fetch('http://localhost:3001/api/questions');
        const json = await res.json();
        console.log('Response Success:', json.success);
        console.log('Response Count:', json.data?.length);
        if (json.data && json.data.length > 0) {
            console.log('First Question:', json.data[0]);
        }
    }
    catch (err) {
        console.error('Fetch error:', err);
    }
}
testDebug();

"use strict";
async function testEndpoint() {
    try {
        console.log('Fetching http://localhost:3001/api/questions...');
        const res = await fetch('http://localhost:3001/api/questions');
        const json = await res.json();
        console.log('Success:', json.success);
        console.log('Questions count:', json.data?.length);
        if (json.data && json.data.length > 0) {
            console.log('First question:', json.data[0]);
        }
    }
    catch (err) {
        console.error('Fetch error:', err);
    }
}
testEndpoint();

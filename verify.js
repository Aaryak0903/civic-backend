const http = require('http');

function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(body);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('=== Testing Signup ===');
        const signupRes = await request('/api/auth/signup', 'POST', JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        }));
        console.log('Status:', signupRes.status);
        console.log('Response:', signupRes.body);

        console.log('\n=== Testing Login (Success) ===');
        const loginRes = await request('/api/auth/login', 'POST', JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
        }));
        console.log('Status:', loginRes.status);
        console.log('Response:', loginRes.body);

        console.log('\n=== Testing Login (Failure) ===');
        const failRes = await request('/api/auth/login', 'POST', JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword'
        }));
        console.log('Status:', failRes.status);
        console.log('Response:', failRes.body);

        console.log('\n=== Testing Validation (Missing Fields) ===');
        const validationRes = await request('/api/auth/signup', 'POST', JSON.stringify({
            email: 'test2@example.com'
        }));
        console.log('Status:', validationRes.status);
        console.log('Response:', validationRes.body);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTests();

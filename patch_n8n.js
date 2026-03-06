const fs = require('fs');
const https = require('https');

const API_KEY = fs.readFileSync('C:/Users/lr103/Desktop/Elytra/Finance Friend/finance-app/.env.local', 'utf8')
    .split('\n')
    .find(l => l.startsWith('N8N_API_KEY='))
    .split('=')[1]
    .trim();

const options = {
    hostname: 'n8n.srv1091457.hstgr.cloud',
    port: 443,
    path: '/api/v1/workflows/kwosYYjUrE5JXZKt',
    method: 'GET',
    headers: {
        'X-N8N-API-KEY': API_KEY,
        'Accept': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        let wf = JSON.parse(data);

        // Patch nodes
        for (let node of wf.nodes) {
            if (node.name === 'Check Budget Alerts') {
                node.parameters.jsCode = `let inserted = [];\ntry { inserted = $('Upsert Transactions').all().map(i => i.json); } catch(e) {}\nif (inserted.length === 0) {\ntry { inserted = $('Process AI Output').all().map(i => i.json); } catch(e) {}\n}\nconst spendMap = {};\nfor (const tx of inserted) {\nif (tx.type !== 'despesa') continue;\nconst key = \`\${tx.category}||\${tx.month}\`;\nif (!spendMap[key]) spendMap[key] = { category: tx.category, month: tx.month, total: 0 };\nspendMap[key].total += parseFloat(tx.amount || 0);\n}\nreturn Object.values(spendMap).map(s => ({ json: s }));`;

                // Remove alwaysOutputData
                delete node.alwaysOutputData;
            }
            if (node.name === 'Respond to Webhook') {
                node.parameters.responseBody = "={{ JSON.stringify({ success: true, transactionsProcessed: $node['Upsert Transactions'] ? $node['Upsert Transactions'].all().length : 0, message: 'Extrato processado com sucesso' }) }}";
            }
        }

        // Send back
        const putOptions = {
            ...options,
            method: 'PUT',
            headers: { ...options.headers, 'Content-Type': 'application/json' }
        };

        const putReq = https.request(putOptions, (putRes) => {
            let putData = '';
            putRes.on('data', (c) => putData += c);
            putRes.on('end', () => console.log('Update complete:', putRes.statusCode, putData));
        });
        putReq.write(JSON.stringify(wf));
        putReq.end();
    });
});
req.on('error', (err) => console.error("GET Error:", err));
req.end();

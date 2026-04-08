const { execSync } = require('child_process');

const port = 5000;

try {
  // Get process using the port
  const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
  const pid = result.match(/\s(\d+)\s*$/)?.[1];
  
  if (pid) {
    console.log(`Found process ${pid} on port ${port}`);
    console.log(`Killing process ${pid}...`);
    execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
    console.log(`✅ Process ${pid} killed successfully`);
  } else {
    console.log(`✅ Port ${port} is already free`);
  }
} catch (error) {
  console.log(`Port ${port} check completed`);
}

console.log('Waiting 2 seconds...');
setTimeout(() => {
  process.exit(0);
}, 2000);

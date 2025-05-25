
import * as functions from 'firebase-functions';
import next from 'next';
import path from 'path';

// Determine if running in development or production
const dev = process.env.NODE_ENV !== 'production';
const projectRoot = path.resolve(__dirname, '../'); // Assumes functions folder is a direct child of project root

console.log('nextjsServer: Initializing Next.js app. Dev mode:', dev, 'Project root:', projectRoot);

// Initialize Next.js app
// 'dir' should point to the root of your Next.js project (where pages, .next, next.config.js are)
const app = next({
  dev,
  conf: { distDir: '.next' }, // Specifies the Next.js build output directory relative to 'dir'
  dir: projectRoot, // The root of your Next.js project
});

const handle = app.getRequestHandler();

export const nextjsServer = functions.https.onRequest(async (req, res) => {
  console.log('nextjsServer: HTTP function triggered for URL:', req.url); // More specific initial log
  try {
    // Ensure Next.js is prepared before handling requests
    console.log('nextjsServer: Preparing Next.js app...');
    await app.prepare();
    console.log('nextjsServer: Next.js app prepared successfully.');
    return handle(req, res);
  } catch (error) {
    console.error('nextjsServer: Critical error during Next.js request handling or app preparation:', error);
    // Send a generic 500 error response
    res.status(500).send('Internal Server Error - Please check function logs in Firebase Console for details.');
  }
});

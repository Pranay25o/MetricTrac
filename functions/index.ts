
import * as functions from 'firebase-functions';
import next from 'next';
import path from 'path';

// Determine if running in development or production
const dev = process.env.NODE_ENV !== 'production';

// Initialize Next.js app
// 'dir' should point to the root of your Next.js project (where pages, .next, next.config.js are)
// From the 'functions' directory, '../' goes up to the project root.
const app = next({
  dev,
  conf: { distDir: '.next' }, // Specifies the Next.js build output directory
  dir: path.resolve(__dirname, '../'),
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
    // It's good practice to also log the error to Firebase Functions logs (Firebase does this automatically for console.error)
    // functions.logger.error('nextjsServer: Critical error:', error); // This is redundant if using console.error
    // Send a generic 500 error response
    res.status(500).send('Internal Server Error - Please check function logs in Firebase Console for details.');
  }
});


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
  try {
    // Ensure Next.js is prepared before handling requests
    await app.prepare();
    return handle(req, res);
  } catch (error) {
    console.error('Error handling Next.js request:', error);
    // It's good practice to also log the error to Firebase Functions logs
    functions.logger.error('Next.js request handler error', error);
    res.status(500).send('Internal Server Error');
  }
});

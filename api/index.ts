import { createServer } from '../server';

let cachedApp: any = null;

export default async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      const { app } = await createServer();
      cachedApp = app;
    }
    return cachedApp(req, res);
  } catch (error: any) {
    console.error('Vercel Function Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error during initialization',
      message: error.message,
      stack: error.stack 
    });
  }
};

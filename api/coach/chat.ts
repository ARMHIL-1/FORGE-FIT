import configureApp from '@vendia/serverless-express';
import app from '../../server';

// This handles routing all incoming Vercel requests straight into your Express server instance
export default configureApp({ app });
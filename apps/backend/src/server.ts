import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './Presentation/Routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
      : process.env.VERCEL_URL
        ? [`https://${process.env.VERCEL_URL}`]
        : true,
  })
);
app.use(helmet());
app.use(express.json());
app.use('/api', routes);

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`CxP Backend running on port ${PORT}`);
  });
}
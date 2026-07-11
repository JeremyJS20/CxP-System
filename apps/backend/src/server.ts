import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './Presentation/Routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`CxP Backend running on port ${PORT}`);
});

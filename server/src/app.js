import 'dotenv/config';
import express     from 'express';
import helmet      from 'helmet';
import cors        from 'cors';
import compression from 'compression';
import morgan      from 'morgan';
import fs          from 'fs';

import { config }         from './config/index.js';

import {
  globalLimiter, errorHandler, notFound,
  requestLogger, securityHeaders,
} from './middleware/index.js';

import authRouter       from './modules/auth/auth.router.js';
import jobCardsRouter   from './modules/job_cards/job_cards.router.js';
import trajectoryRouter from './modules/trajectory/trajectory.router.js';
import salaryRouter     from './modules/salary/salary.router.js';
import profilesRouter   from './modules/profiles/profiles.router.js';
import roadmapsRouter   from './modules/roadmaps/roadmaps.router.js';
import mentorsRouter    from './modules/mentors/mentors.router.js';
import communityRouter  from './modules/community/community.router.js';
import creatorRouter    from './modules/creator/creator.router.js';
import usersRouter      from './modules/users/users.router.js';
import employersRouter  from './modules/employers/employers.router.js';
import educationRouter  from './modules/education/education.router.js';
import societyRouter    from './modules/society/society.router.js';
import searchRouter     from './modules/search/search.router.js';
import feedRouter       from './modules/feed/feed.router.js';
import storiesRouter    from './modules/stories/stories.router.js';

const API = `/api/${config.apiVersion}`;

fs.mkdirSync(config.upload.dir, { recursive: true });
fs.mkdirSync('logs', { recursive: true });

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: config.isProd ? undefined : false,
}));

app.use(cors({
  origin:         config.corsOrigins,
  credentials:    true,
  methods:        ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Request-Id'],
}));

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(globalLimiter);
app.use(securityHeaders);
app.use(requestLogger);

if (!config.isProd) app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({
  status: 'ok', env: config.env,
  uptime: Math.round(process.uptime()), ts: new Date().toISOString(),
}));

app.get('/health/ready', async (req, res) => {
  res.json({ status: 'ready' });
});

app.use(`${API}/auth`,       authRouter);
app.use(`${API}/job-cards`,  jobCardsRouter);
app.use(`${API}/trajectory`, trajectoryRouter);
app.use(`${API}/salary`,     salaryRouter);
app.use(`${API}/profiles`,   profilesRouter);
app.use(`${API}/roadmaps`,   roadmapsRouter);
app.use(`${API}/mentors`,    mentorsRouter);
app.use(`${API}/community`,  communityRouter);
app.use(`${API}/creator`,    creatorRouter);
app.use(`${API}/users`,      usersRouter);
app.use(`${API}/employers`,  employersRouter);
app.use(`${API}/education`,  educationRouter);
app.use(`${API}/society`,    societyRouter);
app.use(`${API}/search`,     searchRouter);
app.use(`${API}/feed`,       feedRouter);
app.use(`${API}/stories`,    storiesRouter);

app.use(notFound);
app.use(errorHandler);

export { API };
export default app;

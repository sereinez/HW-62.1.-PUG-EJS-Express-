import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import session from 'express-session';
import ejs from 'ejs';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import articlesRouter from './routes/articles.js';

import { logRequests } from './middlewares/logger.js';
import { textResponse } from './middlewares/textResponse.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ---------- Шаблонізатори ----------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');          // PUG — за замовчуванням (файли .pug)
app.engine('ejs', ejs.__express);       // EJS — для файлів .ejs

// ---------- Мідлвари (порядок має значення!) ----------
app.use(logRequests);                                              // 1. логування
app.use(express.static(path.join(__dirname, '..', 'public')));     // 2. статика (CSS) — ДО textResponse
app.use(textResponse);                                             // 3. за замовчуванням відповіді — text/plain
app.use(express.json());                                           // 4. парсинг JSON-тіла
app.use(express.urlencoded({ extended: true }));                   //    і форм
app.use(
  session({                                                        // 5. сесії
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 60 * 60 * 1000 },            // 1 година
  })
);

// ---------- Маршрути ----------
app.use('/', indexRouter);
app.use('/users', usersRouter);          // сторінки на PUG
app.use('/articles', articlesRouter);    // сторінки на EJS

app.use(notFound);                                                 // 404
app.use(errorHandler);                                             // обробка помилок (останнім)

export default app;

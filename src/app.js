import express from 'express';
import session from 'express-session';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import articlesRouter from './routes/articles.js';

import { logRequests } from './middlewares/logger.js';
import { textResponse } from './middlewares/textResponse.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Порядок підключення має значення!
app.use(logRequests);                                   // 1. логування
app.use(textResponse);                                  // 2. усі відповіді — text/plain
app.use(express.json());                                // 3. парсинг JSON-тіла
app.use(express.urlencoded({ extended: true }));        //    і форм
app.use(
  session({                                             // 4. сесії
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 60 * 60 * 1000 }, // 1 година
  })
);

app.use('/', indexRouter);                              // 5. маршрути
app.use('/users', usersRouter);
app.use('/articles', articlesRouter);

app.use(notFound);                                      // 6. 404
app.use(errorHandler);                                  // 7. обробка помилок (останнім)

export default app;

export function home(req, res) {
  res.send(
    [
      'Ласкаво просимо до Express-сервера з мідлварами та шаблонізаторами!',
      '',
      'HTML-сторінки:',
      'GET    /users                (PUG)',
      'GET    /users/:userId        (PUG)',
      'GET    /articles             (EJS)',
      'GET    /articles/:articleId  (EJS)',
      '',
      'Текстові маршрути (зміна даних):',
      'POST   /users, PUT /users/:userId, DELETE /users/:userId',
      'POST   /articles, PUT /articles/:articleId, DELETE /articles/:articleId',
    ].join('\n')
  );
}

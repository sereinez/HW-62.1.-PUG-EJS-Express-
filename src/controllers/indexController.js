export function home(req, res) {
  res.send(
    [
      'Ласкаво просимо до Express-сервера з мідлварами!',
      '',
      'Доступні маршрути:',
      'GET    /',
      'GET    /users, POST /users',
      'GET    /users/:userId, PUT /users/:userId, DELETE /users/:userId',
      'GET    /articles, POST /articles',
      'GET    /articles/:articleId, PUT /articles/:articleId, DELETE /articles/:articleId',
    ].join('\n')
  );
}

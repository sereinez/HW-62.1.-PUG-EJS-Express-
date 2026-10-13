import * as User from '../models/userModel.js';

// У шаблони передаємо лише безпечні поля (без пароля).
const publicUser = ({ id, username, role }) => ({ id, username, role });

/**
 * Автентифікація + сесії.
 * 1) Якщо в сесії вже є userId — користувач автентифікований.
 * 2) Інакше очікуємо заголовок Authorization: Basic base64(username:password).
 *    Після успішного входу userId зберігається в req.session,
 *    тому наступні запити можуть іти лише з cookie сесії.
 */
export function authenticate(req, res, next) {
  // 1. Сесія
  if (req.session.userId) {
    const sessionUser = User.getById(req.session.userId);
    if (sessionUser) {
      req.user = sessionUser;
      res.locals.currentUser = publicUser(sessionUser); // доступний у PUG/EJS-шаблонах
      return next();
    }
    // користувача видалили — сесія застаріла
    delete req.session.userId;
  }

  // 2. Basic-заголовок
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="express-middleware-app"');
    return res
      .status(401)
      .send('Доступ заборонено. Передайте заголовок Authorization: Basic base64(username:password).');
  }

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  const username = separator === -1 ? decoded : decoded.slice(0, separator);
  const password = separator === -1 ? '' : decoded.slice(separator + 1);

  const user = User.getByUsername(username);
  if (!user || user.password !== password) {
    res.set('WWW-Authenticate', 'Basic realm="express-middleware-app"');
    return res.status(401).send('Невірний логін або пароль.');
  }

  req.session.userId = user.id;
  req.user = user;
  res.locals.currentUser = publicUser(user); // доступний у PUG/EJS-шаблонах
  next();
}

/** Дозволяє доступ лише користувачам із вказаною роллю. */
export const requireRole = role => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).send(`Доступ заборонено. Потрібна роль: ${role}.`);
  }
  next();
};

/** Дозволяє доступ адміністратору або самому користувачу (за :param). */
export const selfOrAdmin = paramName => (req, res, next) => {
  const isSelf = req.user.id === Number(req.params[paramName]);
  if (req.user.role === 'admin' || isSelf) return next();
  res.status(403).send('Доступ заборонено. Можна змінювати лише власний профіль.');
};

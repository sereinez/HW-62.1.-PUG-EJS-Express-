const ROLES = ['user', 'admin'];

/** Перевіряє, що параметр маршруту (наприклад :userId) — додатне ціле число. */
export const validateIdParam = paramName => (req, res, next) => {
  const raw = req.params[paramName];
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    return res.status(400).send(`Параметр ${paramName} має бути додатним цілим числом.`);
  }
  next();
};

const isNonEmptyString = (value, min) =>
  typeof value === 'string' && value.trim().length >= min;

/** Валідація тіла запиту для створення/оновлення користувача. */
export function validateUserBody(req, res, next) {
  const { username, password, role } = req.body ?? {};
  const errors = [];

  if (!isNonEmptyString(username, 3)) errors.push('username: обов\'язкове, мінімум 3 символи');
  if (!isNonEmptyString(password, 4)) errors.push('password: обов\'язкове, мінімум 4 символи');
  if (role !== undefined && !ROLES.includes(role)) {
    errors.push(`role: має бути одним із [${ROLES.join(', ')}]`);
  }

  if (errors.length > 0) {
    return res.status(400).send(`Помилка валідації:\n${errors.join('\n')}`);
  }
  next();
}

/** Валідація тіла запиту для створення/оновлення статті. */
export function validateArticleBody(req, res, next) {
  const { title, content } = req.body ?? {};
  const errors = [];

  if (!isNonEmptyString(title, 3)) errors.push('title: обов\'язкове, мінімум 3 символи');
  if (!isNonEmptyString(content, 1)) errors.push('content: обов\'язкове');

  if (errors.length > 0) {
    return res.status(400).send(`Помилка валідації:\n${errors.join('\n')}`);
  }
  next();
}

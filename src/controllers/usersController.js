import * as User from '../models/userModel.js';

const format = user => `#${user.id} ${user.username} (${user.role})`;

export function list(req, res) {
  res.send(User.getAll().map(format).join('\n'));
}

export function getOne(req, res) {
  const user = User.getById(Number(req.params.userId));
  if (!user) return res.status(404).send('Користувача не знайдено.');
  res.send(format(user));
}

export function create(req, res) {
  const { username, password, role } = req.body;

  if (User.getByUsername(username.trim())) {
    return res.status(409).send('Користувач із таким username вже існує.');
  }

  const user = User.create({ username: username.trim(), password, role });
  res.status(201).send(`Користувача створено: ${format(user)}`);
}

export function update(req, res) {
  const id = Number(req.params.userId);
  const existing = User.getById(id);
  if (!existing) return res.status(404).send('Користувача не знайдено.');

  const { username, password, role } = req.body;
  const taken = User.getByUsername(username.trim());
  if (taken && taken.id !== id) {
    return res.status(409).send('Користувач із таким username вже існує.');
  }

  // Звичайний користувач не може підвищити собі роль.
  const newRole = req.user.role === 'admin' ? (role ?? existing.role) : existing.role;

  const user = User.update(id, { username: username.trim(), password, role: newRole });
  res.send(`Користувача оновлено: ${format(user)}`);
}

export function remove(req, res) {
  const id = Number(req.params.userId);
  if (!User.remove(id)) return res.status(404).send('Користувача не знайдено.');
  res.send(`Користувача #${id} видалено.`);
}

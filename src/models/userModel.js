// Модель користувачів (зберігання в пам'яті — для навчального проєкту достатньо).
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'user', password: 'user123', role: 'user' },
];
let nextId = 3;

export const getAll = () => users;

export const getById = id => users.find(user => user.id === id);

export const getByUsername = username =>
  users.find(user => user.username === username);

export function create({ username, password, role = 'user' }) {
  const user = { id: nextId++, username, password, role };
  users.push(user);
  return user;
}

export function update(id, data) {
  const user = getById(id);
  if (!user) return undefined;
  Object.assign(user, data);
  return user;
}

export function remove(id) {
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}

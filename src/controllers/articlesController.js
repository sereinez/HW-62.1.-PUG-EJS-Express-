import * as Article from '../models/articleModel.js';

const format = article =>
  `#${article.id} "${article.title}" (автор: #${article.authorId})\n${article.content}`;

export function list(req, res) {
  res.send(Article.getAll().map(format).join('\n\n'));
}

export function getOne(req, res) {
  res.send(format(req.article));
}

export function create(req, res) {
  const { title, content } = req.body;
  const article = Article.create({
    title: title.trim(),
    content,
    authorId: req.user.id,
  });
  res.status(201).send(`Статтю створено:\n${format(article)}`);
}

export function update(req, res) {
  const { title, content } = req.body;
  const article = Article.update(req.article.id, { title: title.trim(), content });
  res.send(`Статтю оновлено:\n${format(article)}`);
}

export function remove(req, res) {
  Article.remove(req.article.id);
  res.send(`Статтю #${req.article.id} видалено.`);
}

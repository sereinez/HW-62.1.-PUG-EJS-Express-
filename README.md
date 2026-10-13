
- **PUG** — сторінки користувачів (`/users`, `/users/:userId`)
- **EJS** — сторінки статей (`/articles`, `/articles/:articleId`)

Проєкт побудований за патерном **MVC**: Model (`models/`), View (шаблони в `views/`),
Controller (`controllers/`). Для сторінок додано **CSS-стилі** (`public/css/style.css`).
Маршрути, що змінюють дані (`POST` / `PUT` / `DELETE`), а також `/` і повідомлення про
помилки, як і раніше, віддають **текст** (`text/plain`).

## Можливості

- Сторінки на **PUG**: список користувачів і деталі користувача (зі списком його статей)
- Сторінки на **EJS**: список статей (картки з уривком) і деталі статті
- Спільний вигляд: навігація, адаптивна верстка, CSS-стилі
- Автентифікація (Basic Auth) + **сесії** (`express-session`) — браузер показує вікно логіну
- Валідація параметрів і тіла запитів, ролі `admin` / `user`, права доступу до статей
- Логування запитів, обробка 404 та помилок
- Сервер слухає порт **3000**

## Встановлення та запуск

Потрібен Node.js 18+.

```bash
npm install
npm start
```

Режим розробки (автоперезапуск): `npm run dev`.
Для Yarn: `yarn install` та `yarn start`.

Відкрийте в браузері <http://localhost:3000/users> — з'явиться вікно логіну.

> Якщо PowerShell забороняє запуск `npm` (помилка *execution policies*), виконайте один раз:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

Необов'язкові змінні середовища:

| Змінна           | За замовчуванням       | Опис                     |
| ---------------- | ---------------------- | ------------------------ |
| `PORT`           | `3000`                 | Порт сервера             |
| `SESSION_SECRET` | `dev-secret-change-me` | Секрет для підпису сесій |

## Тестові користувачі

| Логін   | Пароль     | Роль    |
| ------- | ---------- | ------- |
| `admin` | `admin123` | `admin` |
| `user`  | `user123`  | `user`  |

Дані зберігаються в пам'яті, тому після перезапуску повертаються до початкових.
Паролі зберігаються у відкритому вигляді лише для навчальних цілей.

## Структура проєкту

```
express-templates-app/
├── package.json
├── README.md
├── public/
│   └── css/
│       └── style.css               # стилі для всіх сторінок
└── src/
    ├── server.js                   # запуск сервера (порт 3000)
    ├── app.js                      # налаштування шаблонізаторів, мідлварів, маршрутів
    ├── models/
    │   ├── userModel.js
    │   └── articleModel.js
    ├── controllers/
    │   ├── indexController.js
    │   ├── usersController.js      # рендерить PUG-сторінки
    │   └── articlesController.js   # рендерить EJS-сторінки
    ├── routes/
    │   ├── index.js
    │   ├── users.js
    │   └── articles.js
    ├── middlewares/
    │   ├── logger.js
    │   ├── textResponse.js
    │   ├── auth.js
    │   ├── validate.js
    │   ├── articleAccess.js
    │   └── errorHandler.js
    └── views/
        ├── layout.pug              # базовий макет PUG
        ├── includes/
        │   └── nav.pug             # навігація (PUG)
        ├── users/
        │   ├── list.pug            # список користувачів
        │   └── details.pug         # деталі користувача
        ├── partials/
        │   ├── header.ejs          # шапка + навігація (EJS)
        │   └── footer.ejs          # футер (EJS)
        └── articles/
            ├── list.ejs            # список статей
            └── details.ejs         # деталі статті
```

## Як підключені шаблонізатори

У `src/app.js`:

```js
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');     // PUG — за замовчуванням
app.engine('ejs', ejs.__express);  // EJS — для файлів із розширенням .ejs
```

Express обирає шаблонізатор за **розширенням файлу**, який передано в `res.render`:

```js
res.render('users/list.pug', {...});      // PUG
res.render('articles/list.ejs', {...});   // EJS
```

Інші важливі деталі:

- **Статичні файли** (`/css/style.css`) підключені через `express.static` **до** мідлвара
  `textResponse`, інакше CSS віддавався б як `text/plain` і браузер його б проігнорував.
- Для сторінок контролер явно ставить `Content-Type: text/html` (`res.type('html')`),
  а помилки (401, 400, 403, 404) залишаються текстовими.
- Змінна `currentUser` (без пароля) доступна у всіх шаблонах — через `res.locals`
  у мідлварі `authenticate`; з неї навігація показує, хто увійшов.
- Шаблони **автоматично екранують** вивід (`#{}` / `=` у PUG, `<%= %>` в EJS), тому
  введений користувачем HTML/`<script>` відображається як текст, а не виконується.
- У шаблони ніколи не передається пароль — контролери віддають лише `id`, `username`, `role`.

## Маршрути

### `/` — текст

| Метод | Шлях | Мідлвари  | Відповідь                                  |
| ----- | ---- | --------- | ------------------------------------------ |
| GET   | `/`  | логування | `200` — текстовий опис доступних маршрутів |

### `/users` і `/users/:userId` — PUG

На всі маршрути діє `authenticate`.

| Метод  | Шлях             | Мідлвари                                             | Відповіді                                                                       |
| ------ | ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| GET    | `/users`         | —                                                    | `200` **HTML** (`users/list.pug`): таблиця користувачів                         |
| GET    | `/users/:userId` | `validateIdParam`                                    | `200` **HTML** (`users/details.pug`): картка + статті користувача; `400`; `404` |
| POST   | `/users`         | `requireRole('admin')`, `validateUserBody`           | `201` текст; `400`; `403`; `409`                                                |
| PUT    | `/users/:userId` | `validateIdParam`, `selfOrAdmin`, `validateUserBody` | `200` текст; `400`; `403`; `404`; `409`                                         |
| DELETE | `/users/:userId` | `validateIdParam`, `requireRole('admin')`            | `200` текст; `400`; `403`; `404`                                                |

### `/articles` і `/articles/:articleId` — EJS

На всі маршрути діє `authenticate`.

| Метод  | Шлях                   | Мідлвари                                                                    | Відповіді                                                                   |
| ------ | ---------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| GET    | `/articles`            | —                                                                           | `200` **HTML** (`articles/list.ejs`): картки статей з уривком і автором     |
| GET    | `/articles/:articleId` | `validateIdParam`, `loadArticle`                                            | `200` **HTML** (`articles/details.ejs`): повний текст і автор; `400`; `404` |
| POST   | `/articles`            | `validateArticleBody`                                                       | `201` текст; `400`                                                          |
| PUT    | `/articles/:articleId` | `validateIdParam`, `loadArticle`, `canModifyArticle`, `validateArticleBody` | `200` текст; `400`; `403` не автор; `404`                                   |
| DELETE | `/articles/:articleId` | `validateIdParam`, `loadArticle`, `canModifyArticle`                        | `200` текст; `400`; `403` не автор; `404`                                   |

### Загальні відповіді (текст)

| Код   | Коли                                                             |
| ----- | ---------------------------------------------------------------- |
| `401` | Немає або неправильні облікові дані (`Authorization: Basic ...`) |
| `404` | Неіснуючий маршрут                                               |
| `500` | Внутрішня помилка сервера                                        |

## Мідлвари

Порядок підключення в `src/app.js` має значення:

| №   | Мідлвар                            | Що робить                                                              |
| --- | ---------------------------------- | ---------------------------------------------------------------------- |
| 1   | `logRequests`                      | Логує `ISO-час - МЕТОД URL -> статус (мс)` для кожного запиту          |
| 2   | `express.static`                   | Віддає CSS з `public/`                                                 |
| 3   | `textResponse`                     | За замовчуванням ставить `Content-Type: text/plain`                    |
| 4   | `express.json()` / `urlencoded`    | Розбір тіла запиту                                                     |
| 5   | `express-session`                  | Сесії (cookie, 1 година)                                               |
| 6   | `authenticate`                     | Сесія → Basic-заголовок; записує `req.user` і `res.locals.currentUser` |
|     | `requireRole`, `selfOrAdmin`       | Перевірка ролі / власного профілю                                      |
|     | `validateIdParam`, `validate*Body` | Валідація параметрів і тіла запитів                                    |
|     | `loadArticle`, `canModifyArticle`  | Завантаження статті та перевірка прав автора                           |
| 7   | `notFound` → `errorHandler`        | 404 та централізована обробка помилок (останніми)                      |

## Приклади

Сторінки відкривайте в браузері (логін `admin` / `admin123`):

- <http://localhost:3000/users>
- <http://localhost:3000/users/2>
- <http://localhost:3000/articles>
- <http://localhost:3000/articles/1>

Запити, що змінюють дані (у **PowerShell** використовуйте `curl.exe`):

```bash
# Створити статтю (текстова відповідь)
curl.exe -u user:user123 -X POST http://localhost:3000/articles -H "Content-Type: application/json" -d "{\"title\":\"Моя стаття\",\"content\":\"Текст\"}"

# Створити користувача (лише admin)
curl.exe -u admin:admin123 -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"username\":\"ivan\",\"password\":\"1234\"}"
```

Після створення оновіть сторінки `/articles` або `/users` — нові записи з'являться у списку.



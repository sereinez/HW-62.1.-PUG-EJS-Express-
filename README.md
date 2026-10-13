

## Можливості

- Логування кожного запиту (час, метод, URL, статус, тривалість)
- Автентифікація (Basic Auth) із збереженням входу в **сесії** (`express-session`)
- Валідація параметрів маршруту (`:userId`, `:articleId`) і тіла запиту
- Перевірка прав доступу: ролі `admin` / `user`, доступ до статей лише для автора або адміністратора
- Обробка 404 та централізований обробник помилок
- Сервер слухає порт **3000**

## Встановлення та запуск

Потрібен Node.js 18+.

```bash
npm install
npm start
```

Режим розробки (автоперезапуск при змінах):

```bash
npm run dev
```

Сервер буде доступний за адресою: <http://localhost:3000>

Необов'язкові змінні середовища:

| Змінна           | За замовчуванням        | Опис                       |
| ---------------- | ----------------------- | -------------------------- |
| `PORT`           | `3000`                  | Порт сервера               |
| `SESSION_SECRET` | `dev-secret-change-me`  | Секрет для підпису сесій   |

> Для використання Yarn замість npm: `yarn install` і `yarn start`.

## Структура проєкту (MVC)

```
express-middleware-app/
├── package.json
├── README.md
└── src/
    ├── server.js                 # запуск сервера (порт 3000)
    ├── app.js                    # створення app, підключення мідлварів і маршрутів
    ├── models/                   # Model — дані
    │   ├── userModel.js
    │   └── articleModel.js
    ├── controllers/              # Controller — логіка обробки запитів
    │   ├── indexController.js
    │   ├── usersController.js
    │   └── articlesController.js
    ├── routes/                   # маршрути + підключення мідлварів до них
    │   ├── index.js
    │   ├── users.js
    │   └── articles.js
    └── middlewares/              # мідлвари
        ├── logger.js
        ├── textResponse.js
        ├── auth.js
        ├── validate.js
        ├── articleAccess.js
        └── errorHandler.js
```

«View» у цьому проєкті — це текстова відповідь, яку формують контролери.

## Тестові користувачі

| Логін   | Пароль     | Роль    |
| ------- | ---------- | ------- |
| `admin` | `admin123` | `admin` |
| `user`  | `user123`  | `user`  |

Дані зберігаються в пам'яті, тому після перезапуску сервера повертаються до початкових.
Паролі зберігаються у відкритому вигляді лише для навчальних цілей — у реальному проєкті
потрібне хешування (наприклад, bcrypt).

## Мідлвари

Порядок підключення в `src/app.js` має значення:

| №  | Мідлвар                        | Файл                       | Що робить                                                                                       |
| -- | ------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------- |
| 1  | `logRequests`                  | `middlewares/logger.js`    | Логує кожен запит: `ISO-час - МЕТОД URL -> статус (мс)`. Діє на всіх маршрутах, зокрема на `/`. |
| 2  | `textResponse`                 | `middlewares/textResponse.js` | Встановлює `Content-Type: text/plain` для всіх відповідей.                                   |
| 3  | `express.json()` / `urlencoded`| вбудовані                  | Розбір тіла запиту (JSON і форми).                                                              |
| 4  | `express-session`              | пакет                      | Керування сесіями (cookie, 1 година).                                                           |
| 5  | `authenticate`                 | `middlewares/auth.js`      | Автентифікація: спершу сесія, потім заголовок `Authorization: Basic`. Після входу зберігає `userId` у сесії. |
|    | `requireRole(role)`            | `middlewares/auth.js`      | Дозволяє доступ лише певній ролі (403 інакше).                                                  |
|    | `selfOrAdmin(param)`           | `middlewares/auth.js`      | Дозволяє адміністратору або самому користувачу.                                                 |
|    | `validateIdParam(name)`        | `middlewares/validate.js`  | Перевіряє, що `:userId` / `:articleId` — додатне ціле число (400 інакше).                       |
|    | `validateUserBody`             | `middlewares/validate.js`  | Валідує `username` (≥3 символи), `password` (≥4), `role` (`user` / `admin`).                    |
|    | `validateArticleBody`          | `middlewares/validate.js`  | Валідує `title` (≥3 символи) і `content` (обов'язкове).                                         |
|    | `loadArticle`                  | `middlewares/articleAccess.js` | Завантажує статтю в `req.article` (404, якщо не існує).                                     |
|    | `canModifyArticle`             | `middlewares/articleAccess.js` | Змінювати/видаляти статтю може лише автор або адміністратор (403 інакше).                   |
| 6  | `notFound`                     | `middlewares/errorHandler.js` | Передає помилку 404 для неіснуючих маршрутів.                                                |
| 7  | `errorHandler`                 | `middlewares/errorHandler.js` | Централізований обробник помилок (підключений останнім). Некоректний JSON → 400.            |

## Маршрути

### `/`

| Метод | Шлях | Мідлвари        | Відповідь                          |
| ----- | ---- | --------------- | ---------------------------------- |
| GET   | `/`  | логування       | `200` — привітання та список маршрутів |

### `/users` і `/users/:userId`

На всі маршрути діє `authenticate`.

| Метод  | Шлях             | Додаткові мідлвари                                          | Відповіді                                                  |
| ------ | ---------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| GET    | `/users`         | —                                                           | `200` список користувачів                                  |
| POST   | `/users`         | `requireRole('admin')`, `validateUserBody`                  | `201` створено; `400` невалідні дані; `403` не адмін; `409` username зайнятий |
| GET    | `/users/:userId` | `validateIdParam`                                           | `200` користувач; `400` некоректний id; `404` не знайдено  |
| PUT    | `/users/:userId` | `validateIdParam`, `selfOrAdmin`, `validateUserBody`        | `200` оновлено; `400`; `403` чужий профіль; `404`; `409`  |
| DELETE | `/users/:userId` | `validateIdParam`, `requireRole('admin')`                   | `200` видалено; `400`; `403`; `404`                        |

Звичайний користувач не може підвищити собі роль через `PUT` — поле `role` ігнорується.

### `/articles` і `/articles/:articleId`

На всі маршрути діє `authenticate` (щоб знати, хто робить запит).

| Метод  | Шлях                    | Додаткові мідлвари                                                         | Відповіді                                              |
| ------ | ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| GET    | `/articles`             | —                                                                          | `200` список статей                                    |
| POST   | `/articles`             | `validateArticleBody`                                                      | `201` створено (автор — поточний користувач); `400`    |
| GET    | `/articles/:articleId`  | `validateIdParam`, `loadArticle`                                           | `200` стаття; `400`; `404`                             |
| PUT    | `/articles/:articleId`  | `validateIdParam`, `loadArticle`, `canModifyArticle`, `validateArticleBody`| `200` оновлено; `400`; `403` не автор; `404`           |
| DELETE | `/articles/:articleId`  | `validateIdParam`, `loadArticle`, `canModifyArticle`                       | `200` видалено; `400`; `403` не автор; `404`           |

### Загальні відповіді

| Код   | Коли                                                                 |
| ----- | -------------------------------------------------------------------- |
| `401` | Немає або неправильні облікові дані (`Authorization: Basic ...`)     |
| `404` | Неіснуючий маршрут                                                   |
| `500` | Внутрішня помилка сервера                                            |

## Приклади запитів

> У **PowerShell** використовуйте `curl.exe` (а не `curl`, який є аліасом для `Invoke-WebRequest`).
> Також можна використовувати Postman: вкладка *Authorization* → *Basic Auth*.

```bash
# Головна (без авторизації)
curl.exe http://localhost:3000/

# Без авторизації -> 401
curl.exe -i http://localhost:3000/users

# Список користувачів
curl.exe -u admin:admin123 http://localhost:3000/users

# Створення користувача (лише admin)
curl.exe -u admin:admin123 -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"username\":\"ivan\",\"password\":\"1234\"}"

# Невалідні дані -> 400
curl.exe -u admin:admin123 -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"username\":\"a\"}"

# Створення статті
curl.exe -u user:user123 -X POST http://localhost:3000/articles -H "Content-Type: application/json" -d "{\"title\":\"Моя стаття\",\"content\":\"Текст\"}"

# Спроба змінити чужу статтю -> 403
curl.exe -u user:user123 -X PUT http://localhost:3000/articles/1 -H "Content-Type: application/json" -d "{\"title\":\"Hack\",\"content\":\"x\"}"
```

### Сесії

Після першого успішного входу сервер видає cookie сесії. Далі можна обходитись без пароля:

```bash
curl.exe -c cookies.txt -u user:user123 http://localhost:3000/users/2   # вхід, збереження cookie
curl.exe -b cookies.txt http://localhost:3000/users/2                   # без пароля, по cookie
```

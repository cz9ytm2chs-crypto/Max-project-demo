# MAX · веб-чат через GREEN-API

Простой веб-чат на React (Next.js) для отправки и получения текстовых сообщений в мессенджере **MAX** через [GREEN-API](https://green-api.com/max).

Интерфейс сделан как небольшой прототип в духе [web.max.ru](https://web.max.ru/).

## Что умеет

- вход по данным инстанса из личного кабинета GREEN-API
- создание чата по номеру телефона
- отправка текстовых сообщений
- получение входящих сообщений через HTTP API

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Как пользоваться

1. Создайте и авторизуйте инстанс MAX в [личном кабинете GREEN-API](https://console.green-api.com).
2. Для получения сообщений через HTTP API оставьте `webhookUrl` пустым и включите входящие уведомления.
3. На сайте введите ID инстанса, API-токен и при необходимости адрес API.
4. Создайте чат по номеру телефона получателя, например `79991234567`.
5. Отправьте сообщение и дождитесь ответа из MAX — он появится в чате.

## Технические детали

- интерфейс: React + Next.js + TypeScript
- запросы к GREEN-API идут через серверный прокси `/api/green-api` (чтобы обойти CORS)
- методы: `sendMessage`, `receiveNotification`, `deleteNotification`, `checkAccount`
- если адрес API не указан, используется `https://{первые 4 цифры idInstance}.api.green-api.com`

## Документация

- [Отправка сообщения](https://green-api.com/v3/docs/api/sending/SendMessage/)
- [Получение через HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/)
- [Проверка аккаунта](https://green-api.com/v3/docs/api/service/CheckAccount/)

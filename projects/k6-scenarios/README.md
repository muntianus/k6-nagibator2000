Готово. Разобрал твой JWT (HS256):

### Декодирование

**Header**

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload**

```json
{
  "clientId": "web",
  "secretKey": "aE2ODAyNiwiaWF0IjoxNzAzMTY4MDI2fQz",
  "iat": 1756753029,
  "exp": 1756756629
}
```

**Подпись (base64url):**

```
STL8wHR_OJn-wRutfh_E1mrlFvnJQl6GOlJczN0biI0
```

### Время (из payload)

| Поле | UTC                 | Europe/Berlin       |
| ---- | ------------------- | ------------------- |
| iat  | 2025-09-01 18:57:09 | 2025-09-01 20:57:09 |
| exp  | 2025-09-01 19:57:09 | 2025-09-01 21:57:09 |

TTL ≈ 1 час.

> Примечание по безопасности: `secretKey` в payload — **виден всем**, т.к. payload это просто base64url, а не шифрование. Если это реальный секрет — его нельзя класть внутрь JWT. Секрет должен быть только на стороне сервера и использоваться для подписи/проверки, но не в payload.

---

## Проверка подписи (теория)

Для HS256 подписывается строка `"base64url(header).base64url(payload)"` с HMAC-SHA256 и секретом **сервера**, результат кодируется base64url и сравнивается с `signature`. Без знания секрета подпись **нельзя** проверить.

---

## k6: как распарсить payload и (опц.) проверить подпись

### 1) Декодировать payload в k6

```javascript
import { check } from "k6";
import encoding from "k6/encoding";

export function parseJwt(jwt) {
  const [h, p, s] = jwt.split(".");
  const json = encoding.b64decode(p, "rawurl"); // base64url -> bytes
  return JSON.parse(encoding.encode(json, "utf8")); // bytes -> string -> JSON
}

// пример
export default function () {
  const jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6IndlYiIsInNlY3JldEtleSI6ImFFMk9EQXlOaXdpYVdGMElqb3hOekF6TVRZNE1ESTJmUXoiLCJpYXQiOjE3NTY3NTMwMjksImV4cCI6MTc1Njc1NjYyOX0.STL8wHR_OJn-wRutfh_E1mrlFvnJQl6GOlJczN0biI0`;
  const payload = parseJwt(jwt);
  check(payload, {
    "has clientId": (p) => p.clientId === "web",
    "not expired": (p) => Date.now() / 1000 < p.exp,
  });
}
```

### 2) (Опционально) Проверить подпись HS256 в k6 (только если знаешь секрет)

```javascript
import encoding from "k6/encoding";
import { hmac } from "k6/crypto";

function base64url(inputBytes) {
  return encoding.b64encode(inputBytes, "rawurl"); // без = и с - _
}

function verifyHS256(jwt, secret) {
  const [h, p, s] = jwt.split(".");
  const signingInput = `${h}.${p}`;
  const mac = hmac("sha256", secret, signingInput, "binary"); // bytes
  const sig = base64url(mac);
  return sig === s;
}

// usage:
// const ok = verifyHS256(jwt, __ENV.JWT_SECRET);
// if (!ok) fail("JWT signature invalid");
```

---

## Резюме

* Токен валидный по структуре, `iat/exp` → 1 час, окно: 20:57–21:57 (Berlin) 01-сен-2025.
* В payload есть поле `secretKey` — **утечка секрета**, убрать немедленно.
* Для реальной валидации подписи нужен серверный секрет; без него мы можем только **декодировать**, но не **верифицировать**.

import { group, sleep, check } from "k6";
import http from "k6/http";
import { crypto } from "k6/crypto";
import { encoding } from "k6/encoding";

// --- Конфигурация --- 
export const options = {
  stages: [
    { target: 20, duration: "1m" },
    { target: 20, duration: "8m" },
    { target: 0, duration: "1m" },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // < 1% ошибок
    http_req_duration: ["p(95)<500"], // 95% запросов быстрее 500ms
  },
};

const BASE_URL = "https://grocery.kravemart.com";
const API_URL = "https://apigrocery.kravemart.com/api";

const HEADERS = {
  // ... (заголовки остаются те же)
};

// --- Функции-хелперы ---

/**
 * TODO: Шаг 1 - Аутентификация и извлечение секрета
 * @returns {string} The secret key for encryption.
 */
function getSecretKey() {
  // TODO: Заменить на реальный эндпоинт и тело запроса для аутентификации
  const authPayload = JSON.stringify({
    // email: "user@example.com",
    // password: "password"
  });
  
  // const authRes = http.post(`${API_URL}/login`, authPayload, { headers: HEADERS.api });
  // const jwt = authRes.json("token");
  const jwt = "ЗАГЛУШКА.СЮДА.ДОЛЖЕН.ПРИЙТИ.РЕАЛЬНЫЙ.JWT"; // Заменить реальным запросом

  // Декодируем вторую часть (payload) JWT
  const jwtPayload = JSON.parse(encoding.b64decode(jwt.split('.')[1], 'url'));

  // TODO: Заменить 'secretKeyField' на реальное имя поля в JWT, где лежит ключ
  const secretKey = jwtPayload.secretKeyField; 

  if (!secretKey) {
    fail('Could not retrieve secret key from JWT');
  }

  return secretKey;
}

/**
 * TODO: Шаг 2 - Реализовать логику шифрования с динамическим ключом
 * @param {string} payload - The JSON string to encrypt.
 * @param {string} secretKey - The key retrieved from the JWT.
 * @returns {{iv: string, payload: string}} The encrypted data and IV.
 */
function encryptRequestPayload(payload, secretKey) {
  const iv = crypto.randomBytes(16).buffer;
  const ivHex = Array.from(new Uint8Array(iv)).map(b => b.toString(16).padStart(2, '0')).join('');

  // TODO: Реализовать реальный алгоритм шифрования (AES-GCM, AES-CBC и т.д.)
  // const encryptedPayload = crypto.aesEncrypt(payload, secretKey, iv, 'gcm');
  const encryptedPayload = "ЗАГЛУШКА_ДЛЯ_ЗАШИФРОВАННЫХ_ДАННЫХ";

  return { 
    iv: ivHex, 
    payload: encryptedPayload 
  };
}

// --- Основной сценарий --- 
export default function () {
  // Этот код выполняется один раз для каждого виртуального пользователя
  const secretKey = getSecretKey();

  group("KraveMart User Journey", function () {
    const originalPayload = { /* ... some data ... */ };
    const encrypted = encryptRequestPayload(JSON.stringify(originalPayload), secretKey);

    const apiHeaders = Object.assign({}, HEADERS.api, { 'x-iv': encrypted.iv });

    const apiResp = http.post(API_URL, encrypted.payload, { headers: apiHeaders });

    check(apiResp, {
      "API request status is 200": (r) => r.status === 200,
    });
  });

  sleep(2);
}
const GOOGLE_SCRIPT_WEB_APP_URL = process.env.GOOGLE_SCRIPT_WEB_APP_URL;

async function getPrices() {
  return callGoogleScriptGet('getPriceTable');
}

async function submitOrder(orderData) {
  return callGoogleScriptPost({
    action: 'submitOrder',
    orderData,
  });
}

async function callGoogleScriptGet(action) {
  const scriptUrl = getScriptUrl();
  const url = new URL(scriptUrl);
  url.searchParams.set('action', action);

  const response = await fetch(url);
  return parseGoogleScriptResponse(response);
}

async function callGoogleScriptPost(payload) {
  const scriptUrl = getScriptUrl();

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  return parseGoogleScriptResponse(response);
}

function getScriptUrl() {
  if (!GOOGLE_SCRIPT_WEB_APP_URL) {
    const error = new Error('Thiếu GOOGLE_SCRIPT_WEB_APP_URL trong biến môi trường.');
    error.statusCode = 500;
    throw error;
  }

  return GOOGLE_SCRIPT_WEB_APP_URL;
}

async function parseGoogleScriptResponse(response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  console.log('Apps Script status code:', response.status);
  console.log('Apps Script content-type:', contentType);
  console.log('Apps Script response preview:', text.slice(0, 500));

  const data = parseJsonResponse(text);

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || data.error || 'Google Apps Script trả về lỗi.');
    error.statusCode = response.ok ? 502 : response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function parseJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const invalidResponseError = new Error('Google Apps Script không trả về JSON hợp lệ.');
    invalidResponseError.statusCode = 502;
    invalidResponseError.details = {
      success: false,
      message: invalidResponseError.message,
      responsePreview: text.slice(0, 500),
      probableCause: detectHtmlCause(text),
    };
    throw invalidResponseError;
  }
}

function detectHtmlCause(text) {
  const preview = String(text || '').slice(0, 1000);

  if (/Không tìm thấy hàm tập lệnh: doPost|Script function not found: doPost/i.test(preview)) {
    return 'Apps Script URL đang trỏ tới deployment chưa có doPost hoặc chưa deploy bản mới.';
  }

  if (/MISU Order App|sandboxFrame|HtmlService/i.test(preview)) {
    return 'Apps Script doGet đang trả HTML giao diện, nghĩa là deployment /exec hiện tại chưa phải bản JSON-only hoặc đang gọi sai deployment.';
  }

  if (/Authorization|permission|access|not authorized|Sign in|Đăng nhập/i.test(preview)) {
    return 'Apps Script có thể đang lỗi quyền truy cập hoặc URL không public đúng.';
  }

  if (/Exception|Error|Lỗi/i.test(preview)) {
    return 'Apps Script đang gặp exception và trả trang HTML lỗi.';
  }

  if (/<!doctype html|<html/i.test(preview)) {
    return 'Apps Script trả HTML, thường do gọi sai URL /exec, sai action, hoặc doGet trả HtmlService.';
  }

  return 'Response không phải JSON.';
}

module.exports = {
  getPrices,
  submitOrder,
};

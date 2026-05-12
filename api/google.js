module.exports = async function handler(request, response) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_WEB_APP_URL;

  if (!scriptUrl) {
    response.status(500).json({
      success: false,
      message: 'Thiếu GOOGLE_SCRIPT_WEB_APP_URL trong Vercel Environment Variables.',
    });
    return;
  }

  try {
    const payload = request.method === 'GET'
      ? { action: request.query.action || 'getPriceTable' }
      : normalizeBody(request.body);

    const googleResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const text = await googleResponse.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      data = {
        success: false,
        message: 'Apps Script không trả về JSON hợp lệ.',
        raw: text.slice(0, 300),
      };
    }

    response.status(googleResponse.ok ? 200 : googleResponse.status).json(data);
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Không gọi được Google Apps Script.',
    });
  }
};

function normalizeBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  return body;
}

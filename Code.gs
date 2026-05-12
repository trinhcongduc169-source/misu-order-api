const PRICE_TABLE_SHEET = 'PRICE_TABLE';
const WEB_ORDERS_SHEET = 'WEB_ORDERS';

const PRICE_HEADERS = [
  'SKU',
  'Chiều cao',
  'Chiều rộng',
  'Độ sâu',
  'Màu sắc',
  'Giá bán',
  'Trạng thái',
];

const ORDER_HEADERS = [
  'Mã đơn',
  'Thời gian',
  'Tên khách',
  'SĐT',
  'Địa chỉ',
  'Chi tiết đơn',
  'Tổng tạm tính',
  'Trạng thái',
  'Ghi chú',
];

const HEIGHTS = [50, 70, 90, 110, 130, 150, 170, 190, 210];
const WIDTHS = [40, 50, 60, 70, 80, 90, 100];
const DEPTHS = [30, 35, 40, 45, 50];
const COLORS = ['Walnut / Óc chó', 'Gỗ vàng'];

function doGet(e) {
  try {
    const action = getRequestAction_(e);

    if (action === 'getPriceTable') {
      return jsonResponse_({
        success: true,
        priceTable: getPriceTable(),
      });
    }

    return jsonResponse_({
      success: false,
      error: 'Action không hợp lệ.',
      action,
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: error.message || 'Không xử lý được GET request.',
      stack: error.stack || '',
    });
  }
}

function doPost(e) {
  try {
    const payload = parsePostPayload_(e);
    const action = payload.action || '';

    if (action === 'submitOrder') {
      return jsonResponse_(submitOrder(payload.orderData));
    }

    if (action === 'getPriceTable') {
      return jsonResponse_({
        success: true,
        priceTable: getPriceTable(),
      });
    }

    return jsonResponse_({
      success: false,
      error: 'Action không hợp lệ.',
      action,
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: error.message || 'Không xử lý được POST request.',
      stack: error.stack || '',
    });
  }
}

function getPriceTable() {
  const sheet = getOrCreateSheet_(PRICE_TABLE_SHEET, PRICE_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => ({
      sku: String(row[0] || ''),
      height: Number(row[1]),
      width: Number(row[2]),
      depth: Number(row[3]),
      color: String(row[4] || '').trim(),
      price: Number(row[5]) || 0,
      status: String(row[6] || '').trim(),
    }))
    .filter(item => item.sku && item.status !== 'Ngừng bán');
}

function submitOrder(orderData) {
  const cleanOrder = sanitizeOrderData_(orderData);
  const priceMap = buildPriceMap_(getPriceTable());
  const pricedItems = cleanOrder.items.map(item => enrichItemWithPrice_(item, priceMap));
  const total = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const orderCode = cleanOrder.orderCode || createOrderCode_();
  const hasUnconfirmedPrice = pricedItems.some(item => item.needsConfirmation);

  const sheet = getOrCreateSheet_(WEB_ORDERS_SHEET, ORDER_HEADERS);
  sheet.appendRow([
    orderCode,
    new Date(),
    cleanOrder.customerName,
    cleanOrder.phone,
    cleanOrder.address,
    formatOrderDetails_(pricedItems),
    total,
    hasUnconfirmedPrice ? 'Chờ xác nhận giá' : 'Đơn mới',
    cleanOrder.note,
  ]);

  return {
    success: true,
    orderCode,
    total,
    hasUnconfirmedPrice,
    message: hasUnconfirmedPrice
      ? 'MISU đã nhận đơn. Một số dòng kệ cần xác nhận giá.'
      : 'MISU đã nhận đơn của bạn.',
  };
}

function setupMISUOrderApp() {
  const priceSheet = getOrCreateSheet_(PRICE_TABLE_SHEET, PRICE_HEADERS);
  const orderSheet = getOrCreateSheet_(WEB_ORDERS_SHEET, ORDER_HEADERS);

  formatHeader_(priceSheet, PRICE_HEADERS.length);
  formatHeader_(orderSheet, ORDER_HEADERS.length);

  if (priceSheet.getLastRow() <= 1) {
    const defaultPriceRows = buildDefaultPriceRows_();
    priceSheet.getRange(2, 1, defaultPriceRows.length, PRICE_HEADERS.length)
      .setValues(defaultPriceRows);
  }

  priceSheet.autoResizeColumns(1, PRICE_HEADERS.length);
  orderSheet.autoResizeColumns(1, ORDER_HEADERS.length);
  orderSheet.setColumnWidth(6, 420);
  orderSheet.getRange('B:B').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  orderSheet.getRange('G:G').setNumberFormat('#,##0');
  orderSheet.getRange('F:F').setWrap(true).setVerticalAlignment('top');

  Logger.log('MISU Order App đã sẵn sàng.');
}

function getOrCreateSheet_(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const shouldResetHeaders = headers.some((header, index) => currentHeaders[index] !== header);

  if (shouldResetHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function buildDefaultPriceRows_() {
  const rows = [];

  HEIGHTS.forEach(height => {
    WIDTHS.forEach(width => {
      DEPTHS.forEach(depth => {
        COLORS.forEach(color => {
          const colorCode = color === 'Walnut / Óc chó' ? 'WN' : 'GV';
          rows.push([
            `MISU-${height}-${width}-${depth}-${colorCode}`,
            height,
            width,
            depth,
            color,
            calculateSamplePrice_(height, width, depth, color),
            'Đang bán',
          ]);
        });
      });
    });
  });

  return rows;
}

function calculateSamplePrice_(height, width, depth, color) {
  const base = 390000;
  const sizeFactor = (height * 1800) + (width * 2400) + (depth * 1800);
  const colorFactor = color === 'Walnut / Óc chó' ? 50000 : 0;
  return Math.round((base + sizeFactor + colorFactor) / 10000) * 10000;
}

function buildPriceMap_(priceTable) {
  return priceTable.reduce((map, item) => {
    map[createPriceKey_(item)] = item;
    return map;
  }, {});
}

function enrichItemWithPrice_(item, priceMap) {
  const priceInfo = priceMap[createPriceKey_(item)];
  const quantity = Number(item.quantity) || 1;
  const needsConfirmation = !priceInfo;
  const unitPrice = needsConfirmation ? 0 : Number(priceInfo.price) || 0;

  return {
    shelfType: item.shelfType,
    height: Number(item.height),
    width: Number(item.width),
    depth: Number(item.depth),
    color: item.color,
    quantity,
    sku: priceInfo ? priceInfo.sku : '',
    unitPrice,
    lineTotal: unitPrice * quantity,
    needsConfirmation,
  };
}

function formatOrderDetails_(items) {
  return items.map((item, index) => {
    const sizeText = `${item.height}x${item.width}x${item.depth} cm`;
    const priceText = item.needsConfirmation
      ? 'Cần MISU xác nhận giá'
      : `${formatVnd_(item.unitPrice)} x ${item.quantity} = ${formatVnd_(item.lineTotal)}`;
    const skuText = item.sku ? ` | SKU: ${item.sku}` : '';

    return [
      `${index + 1}. ${item.shelfType}`,
      `Kích thước: ${sizeText}`,
      `Màu: ${item.color}`,
      `SL: ${item.quantity}`,
      priceText + skuText,
    ].join(' | ');
  }).join('\n');
}

function formatVnd_(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function createPriceKey_(item) {
  return [
    Number(item.height),
    Number(item.width),
    Number(item.depth),
    String(item.color || '').trim(),
  ].join('|');
}

function sanitizeOrderData_(orderData) {
  if (!orderData) {
    throw new Error('Không có dữ liệu đơn hàng.');
  }

  const customerName = String(orderData.customerName || '').trim();
  const phone = String(orderData.phone || '').trim();
  const address = String(orderData.address || '').trim();
  const note = String(orderData.note || '').trim();
  const orderCode = String(orderData.orderCode || '').trim();
  const items = Array.isArray(orderData.items) ? orderData.items : [];

  if (!customerName || !phone || !address) {
    throw new Error('Vui lòng nhập đủ họ tên, số điện thoại và địa chỉ giao hàng.');
  }

  if (!items.length) {
    throw new Error('Vui lòng thêm ít nhất một dòng kệ.');
  }

  return {
    orderCode,
    customerName,
    phone,
    address,
    note,
    items: items.map(item => ({
      shelfType: String(item.shelfType || 'Hệ kệ đứng độc lập').trim(),
      height: clampChoice_(item.height, HEIGHTS, HEIGHTS[0]),
      width: clampChoice_(item.width, WIDTHS, WIDTHS[0]),
      depth: clampChoice_(item.depth, DEPTHS, DEPTHS[0]),
      color: normalizeColor_(item.color),
      quantity: Math.min(Math.max(Number(item.quantity) || 1, 1), 10),
    })),
  };
}

function normalizeColor_(color) {
  const cleanColor = String(color || '').trim();
  return COLORS.indexOf(cleanColor) >= 0 ? cleanColor : cleanColor || COLORS[0];
}

function clampChoice_(value, allowedValues, fallback) {
  const numberValue = Number(value);
  return allowedValues.indexOf(numberValue) >= 0 ? numberValue : fallback;
}

function createOrderCode_() {
  const dateText = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  const randomText = Math.floor(Math.random() * 900 + 100);
  return `MISU-${dateText}-${randomText}`;
}

function formatHeader_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setBackground('#6f4e37')
    .setFontColor('#fffaf2')
    .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
}

function getRequestAction_(e) {
  return e && e.parameter ? String(e.parameter.action || '') : '';
}

function parsePostPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  return JSON.parse(e.postData.contents);
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function validateOrder(orderData) {
  if (!orderData || typeof orderData !== 'object' || Array.isArray(orderData)) {
    throwValidationError('Dữ liệu đơn hàng không hợp lệ.');
  }

  const customerName = normalizeText(orderData.customerName);
  const phone = normalizeText(orderData.phone);
  const address = normalizeText(orderData.address);
  const note = normalizeText(orderData.note);
  const orderCode = normalizeText(orderData.orderCode) || createOrderCode();
  const items = Array.isArray(orderData.items) ? orderData.items : [];

  if (!customerName) {
    throwValidationError('Vui lòng nhập tên khách hàng.');
  }

  if (!isValidPhone(phone)) {
    throwValidationError('Số điện thoại không hợp lệ.');
  }

  if (!address) {
    throwValidationError('Vui lòng nhập địa chỉ giao hàng.');
  }

  if (items.length === 0) {
    throwValidationError('Đơn hàng cần có ít nhất 1 sản phẩm.');
  }

  return {
    ...orderData,
    orderCode,
    customerName,
    phone,
    address,
    note,
    items: items.map(validateOrderItem),
  };
}

function validateOrderItem(item, index) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throwValidationError(`Sản phẩm dòng ${index + 1} không hợp lệ.`);
  }

  const shelfType = normalizeText(item.shelfType);
  const color = normalizeText(item.color);
  const height = toPositiveNumber(item.height);
  const width = toPositiveNumber(item.width);
  const depth = toPositiveNumber(item.depth);
  const quantity = toPositiveInteger(item.quantity || 1);

  if (!shelfType) {
    throwValidationError(`Vui lòng chọn loại kệ ở dòng ${index + 1}.`);
  }

  if (!height || !width || !depth) {
    throwValidationError(`Kích thước ở dòng ${index + 1} không hợp lệ.`);
  }

  if (!color) {
    throwValidationError(`Vui lòng chọn màu ở dòng ${index + 1}.`);
  }

  if (!quantity) {
    throwValidationError(`Số lượng ở dòng ${index + 1} không hợp lệ.`);
  }

  return {
    ...item,
    shelfType,
    height,
    width,
    depth,
    color,
    quantity,
  };
}

function normalizeText(value) {
  return String(value || '').trim();
}

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function isValidPhone(phone) {
  return /^[0-9+\-\s().]{8,20}$/.test(phone);
}

function createOrderCode() {
  const now = new Date();
  const dateText = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
  const randomText = Math.floor(Math.random() * 900 + 100);

  return `MISU-${dateText}-${randomText}`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function throwValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

module.exports = {
  validateOrder,
  createOrderCode,
};

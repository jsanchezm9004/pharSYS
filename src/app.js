const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const items = [...document.querySelectorAll('.cart-item')];
const subtotalEl = document.getElementById('subtotal');
const shippingEl = document.getElementById('shipping');
const discountEl = document.getElementById('discount');
const totalEl = document.getElementById('total');
const itemCountEl = document.getElementById('item-count');

const getItemSubtotal = (item) => {
  const price = Number(item.dataset.price || 0);
  const quantity = Number(item.dataset.qty || 1);
  return price * quantity;
};

const updateSummary = () => {
  const activeItems = items.filter((item) => !item.classList.contains('hidden'));
  let subtotal = 0;
  let quantityTotal = 0;

  activeItems.forEach((item) => {
    subtotal += getItemSubtotal(item);
    quantityTotal += Number(item.dataset.qty || 1);
  });

  const shipping = activeItems.length > 0 ? 12 : 0;
  const discount = 14;
  const total = subtotal + shipping - discount;

  subtotalEl.textContent = currencyFormatter.format(subtotal);
  shippingEl.textContent = currencyFormatter.format(shipping);
  discountEl.textContent = `-${currencyFormatter.format(discount)}`;
  totalEl.textContent = currencyFormatter.format(total);
  itemCountEl.textContent = quantityTotal;
};

items.forEach((item) => {
  const qtyValue = item.querySelector('.qty-value');
  const incrementBtn = item.querySelector('.increment');
  const decrementBtn = item.querySelector('.decrement');
  const removeBtn = item.querySelector('.remove-item');

  incrementBtn.addEventListener('click', () => {
    const quantity = Number(item.dataset.qty || 1);
    item.dataset.qty = String(quantity + 1);
    qtyValue.textContent = item.dataset.qty;
    updateSummary();
  });

  decrementBtn.addEventListener('click', () => {
    const quantity = Number(item.dataset.qty || 1);
    if (quantity <= 1) return;
    item.dataset.qty = String(quantity - 1);
    qtyValue.textContent = item.dataset.qty;
    updateSummary();
  });

  removeBtn.addEventListener('click', () => {
    item.classList.add('hidden');
    updateSummary();
  });
});

updateSummary();

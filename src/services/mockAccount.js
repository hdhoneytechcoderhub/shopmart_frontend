import { mockProducts } from './mockData';

// Demo data so the customer dashboard is fully browsable without a backend.

const pick = (i) => mockProducts[i % mockProducts.length];

export const mockOrders = [
  {
    id: 'SM-100238',
    createdAt: '2026-05-30T10:24:00Z',
    status: 'SHIPPED',
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    courier: 'Delhivery',
    trackingId: '12345678901234',
    estimatedDelivery: '2026-06-02T21:00:00Z',
    items: [
      { productId: pick(0).id, name: pick(0).name, image: pick(0).images[0], price: pick(0).price, quantity: 1, size: 'M', color: 'Black' },
      { productId: pick(3).id, name: pick(3).name, image: pick(3).images[0], price: pick(3).price, quantity: 2, size: 'L', color: 'Navy' },
    ],
    shipping: 0,
    address: { name: 'Dhaval Shah', line1: '24 Riverside Avenue', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', phone: '9000012345' },
    tracking: [
      { label: 'Order placed', date: '2026-05-30T10:24:00Z', done: true, note: 'ShopMart Warehouse' },
      { label: 'Order confirmed', date: '2026-05-30T12:10:00Z', done: true, note: 'Your order has been confirmed' },
      { label: 'Order picked up', date: '2026-05-31T09:00:00Z', done: true, note: 'Picked up by Delhivery · Ahmedabad, Gujarat' },
      { label: 'Reached sorting facility', date: '2026-05-31T19:30:00Z', done: true, note: 'Vadodara, Gujarat' },
      { label: 'In transit', date: '2026-06-01T08:45:00Z', done: true, note: 'In transit to the delivery hub · Ankleshwar, Gujarat' },
      { label: 'Out for delivery', date: null, done: false },
      { label: 'Delivered', date: null, done: false },
    ],
  },
  {
    id: 'SM-100195',
    createdAt: '2026-05-12T16:40:00Z',
    status: 'DELIVERED',
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    courier: 'BlueDart',
    trackingId: '99887766554433',
    estimatedDelivery: '2026-05-15T21:00:00Z',
    items: [
      { productId: pick(6).id, name: pick(6).name, image: pick(6).images[0], price: pick(6).price, quantity: 1, size: 'S', color: 'Sand' },
    ],
    shipping: 79,
    address: { name: 'Dhaval Shah', line1: '24 Riverside Avenue', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', phone: '9000012345' },
    tracking: [
      { label: 'Order placed', date: '2026-05-12T16:40:00Z', done: true },
      { label: 'Confirmed', date: '2026-05-12T17:05:00Z', done: true },
      { label: 'Shipped', date: '2026-05-13T08:30:00Z', done: true },
      { label: 'Out for delivery', date: '2026-05-15T07:50:00Z', done: true },
      { label: 'Delivered', date: '2026-05-15T13:20:00Z', done: true },
    ],
  },
  {
    id: 'SM-100142',
    createdAt: '2026-04-22T09:05:00Z',
    status: 'CANCELLED',
    paymentMethod: 'Razorpay',
    paymentStatus: 'REFUNDED',
    items: [
      { productId: pick(9).id, name: pick(9).name, image: pick(9).images[0], price: pick(9).price, quantity: 1, size: 'M', color: 'Olive' },
    ],
    shipping: 0,
    address: { name: 'Dhaval Shah', line1: '24 Riverside Avenue', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', phone: '9000012345' },
    tracking: [
      { label: 'Order placed', date: '2026-04-22T09:05:00Z', done: true },
      { label: 'Cancelled', date: '2026-04-22T18:00:00Z', done: true },
    ],
  },
];

export const orderTotal = (order) =>
  order.items.reduce((sum, it) => sum + it.price * it.quantity, 0) + (order.shipping || 0);

export const mockAddresses = [
  { id: 1, label: 'Home', name: 'Dhaval Shah', line1: '24 Riverside Avenue', line2: 'Near City Park', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', phone: '9000012345', isDefault: true },
  { id: 2, label: 'Work', name: 'Dhaval Shah', line1: 'Tech Tower, SG Highway', line2: '5th Floor', city: 'Ahmedabad', state: 'Gujarat', pincode: '380060', phone: '9000012345', isDefault: false },
];

export const mockPaymentMethods = [
  { id: 1, type: 'CARD', brand: 'Visa', last4: '4242', expiry: '08/28', isDefault: true },
  { id: 2, type: 'UPI', vpa: 'dhaval@upi', isDefault: false },
];

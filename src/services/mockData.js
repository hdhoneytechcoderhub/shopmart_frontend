// Demo data — lets the storefront render before the backend is wired up.
// Services fall back to this on network failure; remove once the API is live.

export const mockCategories = [
  { id: 1, name: 'Electronics', slug: 'electronics', image: 'https://picsum.photos/seed/electronics/400/300' },
  { id: 2, name: 'Fashion', slug: 'fashion', image: 'https://picsum.photos/seed/fashion/400/300' },
  { id: 3, name: 'Home & Living', slug: 'home-living', image: 'https://picsum.photos/seed/home/400/300' },
  { id: 4, name: 'Beauty', slug: 'beauty', image: 'https://picsum.photos/seed/beauty/400/300' },
  { id: 5, name: 'Sports', slug: 'sports', image: 'https://picsum.photos/seed/sports/400/300' },
  { id: 6, name: 'Books', slug: 'books', image: 'https://picsum.photos/seed/books/400/300' },
];

export const mockBrands = [
  { id: 1, name: 'Aurora', slug: 'aurora' },
  { id: 2, name: 'NorthPeak', slug: 'northpeak' },
  { id: 3, name: 'Lumio', slug: 'lumio' },
  { id: 4, name: 'Verde', slug: 'verde' },
  { id: 5, name: 'Cobalt', slug: 'cobalt' },
];

const titles = [
  'Wireless Noise-Cancelling Headphones', 'Smart Fitness Watch', 'Cotton Crewneck T-Shirt',
  'Ceramic Pour-Over Coffee Set', 'Ergonomic Office Chair', 'Running Shoes Pro',
  '4K Action Camera', 'Linen Throw Blanket', 'Stainless Steel Water Bottle',
  'Mechanical Keyboard', 'Leather Weekender Bag', 'Aromatherapy Diffuser',
  'Bluetooth Bookshelf Speakers', 'Yoga Mat Premium', 'Sunrise Alarm Lamp',
  'Merino Wool Beanie', 'Cast Iron Skillet', 'Portable Power Bank 20000mAh',
  'Bestselling Novel: The Long Light', 'Polarized Sunglasses',
];

export const mockProducts = titles.map((title, i) => {
  const mrp = 1499 + (i % 7) * 900;
  const price = Math.round(mrp * (0.7 + (i % 3) * 0.08));
  const cat = mockCategories[i % mockCategories.length];
  const brand = mockBrands[i % mockBrands.length];
  return {
    id: i + 1,
    name: title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description:
      'Thoughtfully designed and built to last. Premium materials, careful finishing, and a price that respects your budget. Backed by easy returns and a one-year warranty.',
    price,
    mrp,
    rating: (3.6 + ((i * 7) % 14) / 10).toFixed(1),
    reviewCount: 12 + ((i * 13) % 240),
    stock: (i % 5 === 0) ? 0 : 8 + (i % 30),
    categoryId: cat.id,
    categoryName: cat.name,
    brandId: brand.id,
    brandName: brand.name,
    featured: i % 4 === 0,
    bestSeller: i % 5 === 1,
    newArrival: i % 6 === 2,
    images: [
      `https://picsum.photos/seed/sm${i}a/600/600`,
      `https://picsum.photos/seed/sm${i}b/600/600`,
      `https://picsum.photos/seed/sm${i}c/600/600`,
    ],
    variants: {
      sizes: ['S', 'M', 'L', 'XL'].slice(0, 2 + (i % 3)),
      colors: ['Black', 'Navy', 'Sand', 'Olive'].slice(0, 2 + (i % 3)),
    },
  };
});

export const mockReviews = (productId) =>
  Array.from({ length: 4 }).map((_, i) => ({
    id: `${productId}-${i}`,
    author: ['Aanya', 'Rohan', 'Meera', 'Karthik'][i],
    rating: 5 - (i % 3),
    date: new Date(Date.now() - i * 86400000 * 9).toISOString(),
    title: ['Exactly as described', 'Great value', 'Solid build', 'Would buy again'][i],
    body: 'Shipping was quick and the product matched the photos. Happy with the purchase overall.',
  }));

export const mockBanners = [
  { id: 1, title: 'Mid-Season Sale', subtitle: 'Up to 50% off across categories', cta: 'Shop deals', href: '/shop?sort=price_asc', image: 'https://picsum.photos/seed/banner1/1200/500' },
  { id: 2, title: 'New Tech, Just Landed', subtitle: 'The latest gear, ready to ship', cta: 'Explore electronics', href: '/shop?category=electronics', image: 'https://picsum.photos/seed/banner2/1200/500' },
];

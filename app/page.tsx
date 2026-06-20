import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AddToCartButton from '@/app/shop/AddToCartButton'
import CartHeaderLink from '@/app/shop/CartHeaderLink'
import HomeSearchBar from '@/app/HomeSearchBar'
import BrandLogo from '@/components/BrandLogo'
import SafeProductImage from '@/components/SafeProductImage'
import { getActiveBanner } from '@/lib/marketing'
import {
  BadgePercent,
  Cable,
  Camera,
  Clock3,
  Headphones,
  Heart,
  Home as HomeIcon,
  Laptop,
  List,
  Menu,
  MessageCircle,
  MapPin,
  PackageCheck,
  PanelsTopLeft,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Truck,
  User,
  Wrench,
  Zap,
} from 'lucide-react'

export const revalidate = 0

const WHATSAPP_URL = 'https://wa.me/56953102476'
const INSTAGRAM_URL = 'https://www.instagram.com/multiaccesorios.cl/'
const MAP_CHACABUCO_479 = 'https://maps.app.goo.gl/jicd2cJFi37D6Qs96'
const MAP_CHACABUCO_456 = 'https://maps.app.goo.gl/uRC2hoVc8ssf1TTU7'

const CATEGORIES = [
  { value: 'Carcasa', label: 'Carcasas', icon: Smartphone },
  { value: 'Lamina', label: 'Láminas', icon: PanelsTopLeft },
  { value: 'Audifonos', label: 'Audífonos', icon: Headphones },
  { value: 'Cargador', label: 'Cargadores', icon: Zap },
  { value: 'Cable', label: 'Cables', icon: Cable },
  { value: 'Vapers', label: 'Vapers', icon: Sparkles },
  { value: 'Computacion', label: 'Cómputo', icon: Laptop },
  { value: 'Otros', label: 'Otros', icon: Sparkles },
] as const

export default async function Home() {
  const [featuredProducts, fallbackProducts, categoryCounts, activeDiscount, heroBanner, secondaryBanner] = await Promise.all([
    prisma.product.findMany({
      where: {
        stock: { gt: 0 },
        imageUrl: { not: null },
        OR: [
          { name: { contains: 'TERMO', mode: 'insensitive' } },
          { name: { contains: 'TELEFONO MLAB', mode: 'insensitive' } },
          { name: { contains: 'AUDIFONOS MLAB', mode: 'insensitive' } },
          { name: { contains: 'MAGSAFE', mode: 'insensitive' } },
          { name: { contains: 'CABLE USB', mode: 'insensitive' } },
        ],
      },
      orderBy: { stock: 'desc' },
      include: { variants: { select: { id: true }, take: 1 } },
      take: 8,
    }),
    prisma.product.findMany({
      where: { stock: { gt: 0 }, imageUrl: { not: null }, category: { in: ['Carcasa', 'Audifonos', 'Cargador', 'Cable', 'Otros'] } },
      orderBy: { createdAt: 'desc' },
      include: { variants: { select: { id: true }, take: 1 } },
      take: 10,
    }),
    prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { stock: { gt: 0 } },
    }),
    prisma.discountRule.findFirst({
      where: { active: true, productId: { not: null }, product: { stock: { gt: 0 }, imageUrl: { not: null } } },
      include: { product: { include: { variants: { select: { id: true }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    }),
    getActiveBanner('home_hero'),
    getActiveBanner('home_secondary'),
  ])

  const trending = [...featuredProducts, ...fallbackProducts]
    .filter((product, index, products) => products.findIndex((item) => item.id === product.id) === index)
    .slice(0, 5)
  const heroProducts = trending.slice(0, 3)

  const counts = categoryCounts.reduce((acc, row) => {
    if (row.category) acc[row.category] = row._count.id
    return acc
  }, {} as Record<string, number>)

  const offerProduct = activeDiscount?.product ?? trending[0] ?? null
  const offerPrice = offerProduct && activeDiscount?.type === 'percentage'
    ? Math.max(0, offerProduct.price * (1 - activeDiscount.value / 100))
    : offerProduct && activeDiscount?.type === 'fixed'
      ? Math.max(0, offerProduct.price - activeDiscount.value)
      : offerProduct?.price ?? 0
  const offerBadge = activeDiscount?.type === 'percentage'
    ? `-${activeDiscount.value}%`
    : activeDiscount?.type === '2x1'
      ? '2X1'
      : activeDiscount ? 'OFERTA' : null

  return (
    <div className="home-marketplace">
      <style>{`
        body:has(.home-marketplace) .public-navbar { display: none; }
        body:has(.home-marketplace) main { padding: 0 !important; background: #f6f6f5; }
        .home-marketplace { min-height: 100vh; background: #f6f6f5; color: #111; font-family: var(--font-inter), Inter, sans-serif; letter-spacing: 0; }
        .home-shell { max-width: 1510px; min-height: 100vh; margin: 0 auto; background: #fff; box-shadow: 0 18px 60px rgba(15,15,15,.08); overflow: hidden; animation: homeShellIn .45s ease both; }
        .home-topbar { height: 44px; padding: 0 52px; background: #111; color: #fff; display: flex; align-items: center; justify-content: space-between; border-radius: 22px 22px 0 0; font-size: 12px; font-weight: 600; }
        .home-topbar-group { display: flex; gap: 34px; align-items: center; }
        .home-topbar-item { display: inline-flex; gap: 8px; align-items: center; white-space: nowrap; color: inherit; text-decoration: none; }
        .home-topbar-item[href]:hover { color: #ff4d57; }
        .home-header { display: grid; grid-template-columns: 220px minmax(360px, 1fr) 310px; gap: 24px; align-items: center; padding: 22px 52px 16px; }
        .home-brand { display: inline-flex; align-items: center; gap: 12px; color: #111; text-decoration: none; }
        .home-brand-mark { position: relative; width: 52px; height: 52px; border-radius: 8px; display: block; overflow: hidden; background: #fff; flex: 0 0 auto; }
        .home-brand-text { font-size: 21px; line-height: .9; font-weight: 900; }
        .shop-search-control { height: 48px; border: 1px solid #d9d9d9; border-radius: 999px; display: grid; grid-template-columns: 1fr auto auto; align-items: center; overflow: hidden; background: #fff; transition: border-color .18s ease, box-shadow .18s ease; }
        .shop-search-control:focus-within { border-color: rgba(227,6,19,.55); box-shadow: 0 0 0 4px rgba(227,6,19,.08); }
        .shop-search-control input { min-width: 0; height: 100%; border: 0; outline: 0; padding: 0 22px; font-size: 13px; color: #333; }
        .shop-search-clear { width: 32px; height: 32px; border: 0; background: transparent; color: #999; font-weight: 800; }
        .shop-search-submit { width: 58px; height: 48px; border: 0; background: #e30613; color: #fff; display: grid; place-items: center; transition: background-color .18s ease, transform .18s ease; }
        .shop-search-submit:hover { background: #c90510; }
        .shop-search-submit:active { transform: scale(.96); }
        .home-header-actions { display: flex; justify-content: flex-end; align-items: center; gap: 22px; }
        .shop-header-action { display: inline-flex; align-items: center; gap: 8px; color: #111; text-decoration: none; font-size: 12px; font-weight: 700; white-space: nowrap; transition: color .16s ease, transform .16s ease; }
        .shop-header-action:hover { color: #e30613; transform: translateY(-1px); }
        .shop-header-action small { display: block; font-size: 10px; color: #666; }
        .shop-cart-icon-link { position: relative; color: #111; display: inline-flex; }
        .shop-cart-count { position: absolute; top: -9px; right: -10px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px; background: #e30613; color: #fff; display: grid; place-items: center; font-size: 9px; font-weight: 900; }
        .home-nav { height: 64px; padding: 0 52px; display: flex; align-items: center; gap: 34px; border-bottom: 1px solid #ededed; }
        .home-all-cats { height: 42px; min-width: 220px; padding: 0 16px; border-radius: 5px; background: #111; color: #fff; display: inline-flex; justify-content: space-between; align-items: center; text-decoration: none; font-size: 12px; font-weight: 800; transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease; }
        .home-all-cats:hover { transform: translateY(-1px); background: #050505; box-shadow: 0 10px 24px rgba(0,0,0,.16); }
        .home-nav-links { display: flex; gap: clamp(18px, 2.1vw, 32px); align-items: center; font-size: 12px; font-weight: 800; }
        .home-nav-links a { position: relative; display: inline-flex; align-items: center; white-space: nowrap; color: #111; text-decoration: none; transition: color .16s ease; }
        .home-nav-links a::after { content: ""; position: absolute; left: 0; right: 0; bottom: -9px; height: 2px; border-radius: 999px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform .18s ease; }
        .home-nav-links a:hover::after { transform: scaleX(1); }
        .home-nav-links a:first-child { color: #e30613; }
        .home-content { padding: 18px 52px 0; }
        .home-hero { height: 250px; border-radius: 8px; background: linear-gradient(115deg, #fff7f7 0%, #fff 48%, #fff0f0 100%); position: relative; overflow: hidden; display: flex; align-items: center; padding: 34px 38px; isolation: isolate; animation: homeRise .55s .05s ease both; }
        .home-hero::before { content: ""; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,.7) 44%, transparent 58%); transform: translateX(-115%); animation: homeHeroSheen 4.8s 1.2s ease-in-out infinite; pointer-events: none; }
        .home-hero::after { content: ""; position: absolute; inset: 0; border: 1px solid rgba(227,6,19,.08); border-radius: inherit; pointer-events: none; }
        .home-hero-copy { position: relative; z-index: 3; width: 45%; animation: homeCopyIn .5s .15s ease both; }
        .home-hero-kicker { color: #e30613; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
        .home-hero h1 { margin: 14px 0 24px; font-size: 31px; line-height: 1.12; font-weight: 900; }
        .home-hero h1 span { color: #e30613; }
        .home-hero-benefits { display: flex; gap: 24px; }
        .home-hero-benefit { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 800; color: #555; }
        .home-hero-actions { display: flex; align-items: center; gap: 10px; margin-top: 22px; }
        .home-primary-cta,
        .home-secondary-cta { height: 38px; padding: 0 18px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-size: 11px; font-weight: 900; transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease, border-color .18s ease; }
        .home-primary-cta { position: relative; overflow: hidden; background: #e30613; color: #fff; box-shadow: 0 10px 22px rgba(227,6,19,.22); }
        .home-primary-cta::after { content: ""; position: absolute; top: -40%; bottom: -40%; width: 34px; left: -44px; background: rgba(255,255,255,.38); transform: rotate(18deg); transition: left .42s ease; }
        .home-primary-cta:hover { transform: translateY(-1px); background: #c90510; box-shadow: 0 14px 28px rgba(227,6,19,.28); }
        .home-primary-cta:hover::after { left: calc(100% + 28px); }
        .home-primary-cta:active,
        .home-secondary-cta:active,
        .home-offer-link:active { transform: translateY(0) scale(.98); }
        .home-secondary-cta { border: 1px solid #ddd; color: #111; background: #fff; }
        .home-secondary-cta:hover { border-color: #111; transform: translateY(-1px); box-shadow: 0 10px 22px rgba(0,0,0,.08); }
        .home-hero-products { position: absolute; inset: 0 2% 0 45%; display: flex; align-items: flex-end; justify-content: center; gap: 2px; }
        .home-hero-banner-media { position: absolute; inset: 16px 4% 16px 48%; filter: drop-shadow(0 14px 20px rgba(0,0,0,.14)); }
        .home-hero-banner-media img { object-fit: contain; }
        .home-hero-product { position: relative; width: 24%; height: 80%; filter: drop-shadow(0 12px 12px rgba(0,0,0,.12)); animation: homeProductFloat 5.2s ease-in-out infinite; transform-origin: center bottom; will-change: transform; }
        .home-hero-product img { object-fit: contain; }
        .home-hero-product:nth-child(2) { height: 92%; animation-delay: .25s; }
        .home-hero-product:nth-child(3) { height: 68%; animation-delay: .5s; }
        .home-hero-discount { position: absolute; z-index: 4; top: 24px; right: 17%; width: 66px; height: 66px; border-radius: 50%; background: #e30613; color: #fff; display: grid; place-items: center; text-align: center; font-size: 13px; font-weight: 900; line-height: 1; box-shadow: 0 14px 26px rgba(227,6,19,.28); animation: homeBadgePop .5s .45s ease both, homeBadgePulse 2.8s 1.2s ease-in-out infinite; }
        .home-section { margin-top: 22px; animation: homeRise .52s ease both; }
        .home-section:nth-of-type(2) { animation-delay: .12s; }
        .home-section:nth-of-type(3) { animation-delay: .2s; }
        .home-section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .home-section-head h2 { font-size: 15px; font-weight: 900; }
        .home-section-head a { height: 30px; padding: 0 15px; border: 1px solid #ddd; border-radius: 4px; display: inline-flex; align-items: center; color: #111; text-decoration: none; font-size: 10px; font-weight: 800; transition: border-color .16s ease, transform .16s ease, box-shadow .16s ease; }
        .home-section-head a:hover { border-color: #111; transform: translateY(-1px); box-shadow: 0 8px 18px rgba(0,0,0,.07); }
        .home-categories { display: grid; grid-template-columns: repeat(8, minmax(0,1fr)); gap: 16px; }
        .home-category { min-height: 92px; border: 1px solid #e5e5e5; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #111; text-decoration: none; font-size: 11px; font-weight: 800; transition: transform .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease, background-color .18s ease; }
        .home-category:hover { border-color: #e30613; color: #e30613; background: #fff; transform: translateY(-3px); box-shadow: 0 14px 30px rgba(0,0,0,.08); }
        .home-category small { color: #999; font-size: 9px; font-weight: 700; }
        .home-trending-layout { display: grid; grid-template-columns: minmax(0,1fr) 290px; gap: 22px; }
        .home-product-grid { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 14px; }
        .home-product-card { border: 1px solid #e5e5e5; border-radius: 6px; background: #fff; overflow: hidden; min-width: 0; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .home-product-card:hover { transform: translateY(-4px); border-color: rgba(227,6,19,.24); box-shadow: 0 18px 36px rgba(0,0,0,.1); }
        .home-product-image { position: relative; height: 155px; display: block; padding: 12px; background: #fafafa; }
        .home-product-image img { width: 100%; height: 100%; object-fit: contain; transition: transform .22s ease; }
        .home-product-card:hover .home-product-image img { transform: scale(1.04); }
        .home-stock { position: absolute; top: 9px; left: 9px; border: 1px solid #bfe7c8; border-radius: 3px; background: #f6fff7; color: #1f9a3f; padding: 3px 6px; font-size: 8px; font-weight: 800; transition: transform .18s ease; }
        .home-product-card:hover .home-stock { transform: translateY(-1px); }
        .home-heart {
          position: absolute;
          top: 9px;
          right: 9px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #555;
          background: rgba(255,255,255,.92);
          border: 1px solid rgba(0,0,0,.06);
          box-shadow: 0 6px 16px rgba(0,0,0,.08);
          line-height: 0;
          transition: color .16s ease, transform .16s ease, box-shadow .16s ease;
        }
        .home-product-card:hover .home-heart { color: #e30613; transform: scale(1.06); box-shadow: 0 8px 20px rgba(0,0,0,.12); }
        .home-heart svg { width: 16px; height: 16px; display: block; stroke-width: 2.2; }
        .home-product-info { padding: 10px 12px 12px; }
        .home-product-name { height: 34px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #111; text-decoration: none; font-size: 10px; line-height: 1.35; font-weight: 900; text-transform: uppercase; }
        .home-product-price { display: block; margin-top: 10px; color: #e30613; font-size: 15px; font-weight: 900; }
        .home-offer { min-height: 245px; border-radius: 8px; background: linear-gradient(135deg, #fff4f4 0%, #fff 100%); padding: 24px 20px; position: relative; overflow: hidden; transition: transform .2s ease, box-shadow .2s ease; }
        .home-offer::before { content: ""; position: absolute; inset: 0; background: linear-gradient(110deg, transparent, rgba(255,255,255,.72), transparent); transform: translateX(-120%); transition: transform .65s ease; pointer-events: none; }
        .home-offer:hover { transform: translateY(-3px); box-shadow: 0 18px 36px rgba(0,0,0,.08); }
        .home-offer:hover::before { transform: translateX(120%); }
        .home-offer-kicker { color: #e30613; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .home-offer h3 { margin-top: 10px; font-size: 24px; line-height: 1; font-weight: 900; }
        .home-offer-product { position: absolute; right: 0; bottom: 0; width: 56%; height: 70%; filter: drop-shadow(0 10px 10px rgba(0,0,0,.15)); transition: transform .24s ease; }
        .home-offer-product img { object-fit: contain; }
        .home-offer:hover .home-offer-product { transform: translateY(-4px) scale(1.03); }
        .home-offer-price { position: relative; z-index: 2; margin-top: 18px; }
        .home-offer-price del { display: block; color: #999; font-size: 10px; }
        .home-offer-price strong { color: #e30613; font-size: 18px; }
        .home-offer-link { position: relative; z-index: 2; margin-top: 16px; height: 36px; padding: 0 16px; border-radius: 4px; background: #e30613; color: #fff; display: inline-flex; align-items: center; text-decoration: none; font-size: 10px; font-weight: 800; transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease; }
        .home-offer-link:hover { background: #c90510; transform: translateY(-1px); box-shadow: 0 12px 24px rgba(227,6,19,.2); }
        .home-support { margin: 30px 52px 0; border: 1px solid #e8e8e8; border-radius: 8px; background: #fff; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); overflow: hidden; }
        .home-support-item { min-height: 102px; padding: 20px 18px; border-right: 1px solid #ededed; display: flex; align-items: flex-start; gap: 12px; color: #111; text-decoration: none; transition: background-color .16s ease, transform .16s ease; }
        .home-support-item:last-child { border-right: 0; }
        .home-support-item:hover { background: #fafafa; transform: translateY(-1px); }
        .home-support-icon { width: 34px; height: 34px; border-radius: 999px; background: #f6f6f6; display: grid; place-items: center; color: #e30613; flex: 0 0 auto; }
        .home-support-item strong { display: block; font-size: 12px; font-weight: 900; }
        .home-support-item span { display: block; margin-top: 5px; color: #666; font-size: 10px; font-weight: 650; line-height: 1.45; }
        .home-benefits { margin-top: 30px; border-top: 1px solid #ededed; display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; padding: 22px 52px; }
        .home-benefit { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 900; transition: transform .16s ease; }
        .home-benefit:hover { transform: translateY(-2px); }
        .home-benefit small { display: block; color: #777; margin-top: 3px; font-size: 10px; font-weight: 600; }
        .home-mobile-header, .home-mobile-nav { display: none; }
        @media (max-width: 1180px) {
          .home-topbar, .home-header, .home-nav { display: none; }
          .home-shell { box-shadow: none; }
          .home-mobile-header { display: block; padding: 16px; border-bottom: 1px solid #ededed; background: #fff; position: sticky; top: 0; z-index: 20; }
          .home-mobile-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
          .home-mobile-actions { display: flex; align-items: center; gap: 18px; }
          .home-mobile-header .home-brand-mark { width: 42px; height: 42px; }
          .home-mobile-header .home-brand-text { font-size: 15px; }
          .home-mobile-header .shop-search-control { height: 42px; border-radius: 5px; }
          .home-mobile-header .shop-search-submit { height: 42px; width: 48px; }
          .home-content { padding: 14px 14px 78px; }
          .home-hero { height: 170px; padding: 18px 16px; }
          .home-hero-copy { width: 52%; }
          .home-hero-kicker { font-size: 7px; }
          .home-hero h1 { margin: 8px 0 14px; font-size: 17px; }
          .home-hero-benefits { display: none; }
          .home-hero-actions { margin-top: 0; }
          .home-secondary-cta { display: none; }
          .home-hero-products { inset: 0 -5% 0 48%; }
          .home-hero-banner-media { inset: 20px -5% 12px 53%; }
          .home-hero-product { width: 30%; height: 72%; }
          .home-hero-product:nth-child(2) { height: 82%; }
          .home-hero-discount { display: none; }
          .home-hero-copy .home-primary-cta { height: 30px; padding: 0 12px; font-size: 9px; }
          .home-categories { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; margin-right: -14px; padding-right: 14px; }
          .home-categories::-webkit-scrollbar { display: none; }
          .home-category { flex: 0 0 74px; min-height: 76px; gap: 7px; font-size: 9px; }
          .home-category small { display: none; }
          .home-trending-layout { display: block; }
          .home-product-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
          .home-product-card:nth-child(n+4) { display: none; }
          .home-product-image { height: 126px; padding: 7px; }
          .home-product-info { padding: 8px; }
          .home-product-name { height: 34px; font-size: 9px; }
          .home-product-price { font-size: 13px; }
          .home-product-info button { display: none; }
          .home-offer { margin-top: 16px; min-height: 138px; padding: 18px 14px; }
          .home-offer h3 { font-size: 16px; max-width: 42%; }
          .home-offer-product { width: 48%; height: 86%; }
          .home-support { margin: 18px 14px 0; grid-template-columns: 1fr 1fr; }
          .home-support-item { min-height: 88px; padding: 14px 12px; border-right: 1px solid #ededed; border-bottom: 1px solid #ededed; }
          .home-support-item:nth-child(2n) { border-right: 0; }
          .home-support-item:nth-last-child(-n+2) { border-bottom: 0; }
          .home-support-icon { width: 30px; height: 30px; }
          .home-support-item strong { font-size: 10px; }
          .home-support-item span { font-size: 9px; }
          .home-benefits { display: none; }
          .home-mobile-nav { position: fixed; z-index: 30; display: grid; grid-template-columns: repeat(5,1fr); bottom: 0; left: 0; right: 0; height: 64px; border-top: 1px solid #ddd; background: #fff; }
          .home-mobile-nav a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: #555; text-decoration: none; font-size: 9px; font-weight: 700; }
          .home-mobile-nav a:first-child { color: #e30613; }
        }
        @media (max-width: 390px) {
          .home-product-image { height: 112px; }
          .home-product-grid { gap: 6px; }
          .home-section-head h2 { font-size: 14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-marketplace *,
          .home-marketplace *::before,
          .home-marketplace *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .001ms !important;
          }
        }
        @keyframes homeShellIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes homeRise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes homeCopyIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes homeHeroSheen {
          0%, 58% { transform: translateX(-115%); }
          78%, 100% { transform: translateX(115%); }
        }
        @keyframes homeProductFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes homeBadgePop {
          from { opacity: 0; transform: scale(.82); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes homeBadgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <div className="home-shell">
        <div className="home-topbar">
          <div className="home-topbar-group">
            <span className="home-topbar-item"><Truck className="size-4 text-red-500" /> Envíos a todo Chile</span>
            <span className="home-topbar-item"><Clock3 className="size-4" /> Despacho 24-48h en Linares</span>
          </div>
          <div className="home-topbar-group">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="home-topbar-item"><MessageCircle className="size-4" /> WhatsApp</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="home-topbar-item"><Camera className="size-4" /> Instagram</a>
          </div>
        </div>

        <header className="home-header">
          <HomeBrand />
          <HomeSearchBar />
          <div className="home-header-actions">
            <Link href="/admin/login" className="shop-header-action"><User className="size-5" /><span>Mi cuenta<small>Ingresar</small></span></Link>
            <CartHeaderLink />
          </div>
        </header>

        <nav className="home-nav">
          <Link href="/shop" className="home-all-cats"><span className="inline-flex items-center gap-3"><Menu className="size-4" /> Todas las categorías</span></Link>
          <div className="home-nav-links">
            <Link href="/shop?promo=1&page=1"><BadgePercent className="inline size-4 mr-1" /> Ofertas</Link>
            <Link href="/shop?sort=newest">Nuevos</Link>
            <Link href="/shop?sort=sales&page=1">Más vendidos</Link>
            <Link href="/shop?brand=all&page=1">Marcas</Link>
            <Link href="#blog">Blog</Link>
            {' '}
            <Link href="#contacto">Contacto</Link>
          </div>
        </nav>

        <header className="home-mobile-header">
          <div className="home-mobile-top">
            <HomeBrand />
            <div className="home-mobile-actions"><CartHeaderLink mobile /><Link href="/shop" aria-label="Abrir catálogo"><Menu className="size-6 text-black" /></Link></div>
          </div>
          <HomeSearchBar />
        </header>

        <div className="home-content">
          <section className="home-hero">
            <div className="home-hero-copy">
              <p className="home-hero-kicker">{heroBanner?.eyebrow ?? 'Tecnología que te conecta'}</p>
              {heroBanner ? (
                <h1>{heroBanner.title}<br />{heroBanner.subtitle && <span>{heroBanner.subtitle}</span>}</h1>
              ) : (
                <h1>Todo lo que necesitas,<br /><span>en un solo lugar.</span></h1>
              )}
              <div className="home-hero-benefits">
                <span className="home-hero-benefit"><Truck className="size-5" /> Envíos rápidos</span>
                <span className="home-hero-benefit"><ShieldCheck className="size-5" /> Compra segura</span>
                <span className="home-hero-benefit"><PackageCheck className="size-5" /> Garantía y cambios</span>
              </div>
              <div className="home-hero-actions">
                <Link href={heroBanner?.href ?? '/shop'} className="home-primary-cta">Comprar ahora</Link>
                <Link href={activeDiscount ? '/shop?promo=1&page=1' : '/shop?sort=newest'} className="home-secondary-cta">
                  {activeDiscount ? 'Ver ofertas' : 'Ver nuevos'}
                </Link>
              </div>
            </div>
            {heroBanner?.imageUrl || heroBanner?.mobileImageUrl ? (
              <span className="home-hero-banner-media">
                <SafeProductImage
                  src={heroBanner.imageUrl ?? heroBanner.mobileImageUrl}
                  alt={heroBanner.title}
                  fill
                  sizes="(max-width: 760px) 46vw, 420px"
                />
              </span>
            ) : (
              <div className="home-hero-products">
                {heroProducts.slice(0, 3).map((product) => (
                  <span key={product.id} className="home-hero-product">
                    <SafeProductImage src={product.imageUrl} alt={product.name} fill sizes="180px" />
                  </span>
                ))}
              </div>
            )}
            {activeDiscount && offerBadge && <span className="home-hero-discount">{offerBadge}</span>}
          </section>

          <section className="home-section" id="blog">
            <div className="home-section-head"><h2>Explora por categoría</h2><Link href="/shop">Ver todas</Link></div>
            <div className="home-categories">
              {CATEGORIES.map((category) => {
                const Icon = category.icon
                return (
                  <Link key={category.value} href={`/shop?cat=${category.value}`} className="home-category">
                    <Icon className="size-6" />
                    <span>{category.label}</span>
                    <small>{counts[category.value] ?? 0} productos</small>
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="home-section">
            <div className="home-section-head"><h2>Productos destacados</h2><Link href="/shop">Ver todos</Link></div>
            <div className="home-trending-layout">
              <div className="home-product-grid">
                {trending.map((product) => {
                  const hasVariants = product.variants.length > 0

                  return (
                    <article key={product.id} className="home-product-card">
                      <Link href={`/shop/${product.id}`} className="home-product-image">
                        <SafeProductImage src={product.imageUrl} alt={product.name} fill sizes="180px" />
                        <span className="home-stock">En stock</span>
                        <span className="home-heart"><Heart /></span>
                      </Link>
                      <div className="home-product-info">
                        <Link href={`/shop/${product.id}`} className="home-product-name">{product.name}</Link>
                        <span className="home-product-price">${product.price.toLocaleString('es-CL')}</span>
                        {hasVariants ? (
                          <Link href={`/shop/${product.id}`} className="h-10 rounded-[4px] border border-red-600 text-red-600 flex items-center justify-center text-xs font-black no-underline">
                            Ver opciones
                          </Link>
                        ) : (
                          <AddToCartButton product={{ id: product.id, name: product.name, price: product.price, stock: product.stock, imageUrl: product.imageUrl }} />
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              {(secondaryBanner || offerProduct) && (
                <aside className="home-offer">
                  <p className="home-offer-kicker">{secondaryBanner?.eyebrow ?? (activeDiscount ? 'Oferta activa' : 'Producto destacado')} <Zap className="inline size-3" /></p>
                  <h3>{secondaryBanner?.title ?? offerProduct?.name}</h3>
                  {!secondaryBanner && offerProduct && (
                    <div className="home-offer-price">
                      {activeDiscount && <del>${offerProduct.price.toLocaleString('es-CL')}</del>}
                      <strong>${offerPrice.toLocaleString('es-CL')}</strong>
                      {offerBadge && <span className="ml-2 rounded-[3px] bg-white px-2 py-1 text-[9px] font-bold text-red-600">{offerBadge}</span>}
                    </div>
                  )}
                  {secondaryBanner?.subtitle && <p className="relative z-[2] mt-3 max-w-[48%] text-xs font-bold text-zinc-600">{secondaryBanner.subtitle}</p>}
                  <Link href={secondaryBanner?.href ?? `/shop/${offerProduct?.id}`} className="home-offer-link">{secondaryBanner ? 'Ver campaña' : activeDiscount ? 'Ver oferta' : 'Ver producto'}</Link>
                  <span className="home-offer-product">
                    <SafeProductImage
                      src={secondaryBanner?.imageUrl ?? secondaryBanner?.mobileImageUrl ?? offerProduct?.imageUrl}
                      alt={secondaryBanner?.title ?? offerProduct?.name ?? 'Campaña'}
                      fill
                      sizes="180px"
                    />
                  </span>
                </aside>
              )}
            </div>
          </section>
        </div>

        <section className="home-support" aria-label="Condiciones de compra y contacto">
          <a href={MAP_CHACABUCO_479} target="_blank" rel="noreferrer" className="home-support-item">
            <span className="home-support-icon"><MapPin className="size-4" /></span>
            <p><strong>Retiro en Linares</strong><span>Chacabuco 479. Atención de lunes a sábado, 09:00 a 19:00.</span></p>
          </a>
          <a href={MAP_CHACABUCO_456} target="_blank" rel="noreferrer" className="home-support-item">
            <span className="home-support-icon"><Wrench className="size-4" /></span>
            <p><strong>Servicio técnico</strong><span>Sucursal Chacabuco 456 para soporte y revisión de equipos.</span></p>
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="home-support-item">
            <span className="home-support-icon"><MessageCircle className="size-4" /></span>
            <p><strong>WhatsApp oficial</strong><span>Escríbenos al +56 9 5310 2476 para disponibilidad y entrega.</span></p>
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="home-support-item">
            <span className="home-support-icon"><Camera className="size-4" /></span>
            <p><strong>Instagram</strong><span>Sigue novedades, atención y contenido de Multi Accesorios Linares.</span></p>
          </a>
        </section>

        <footer className="home-benefits" id="contacto">
          <div className="home-benefit"><Truck className="size-7" /><span>Envíos a todo Chile<small>Rápido y seguro</small></span></div>
          <div className="home-benefit"><Clock3 className="size-7" /><span>Despacho 24-48h en Linares<small>Compras antes de las 14:00</small></span></div>
          <div className="home-benefit"><ShieldCheck className="size-7" /><span>Compra segura<small>Sitio protegido SSL</small></span></div>
          <div className="home-benefit"><PackageCheck className="size-7" /><span>Garantía y cambios<small>Hasta 30 días</small></span></div>
        </footer>
      </div>

      <nav className="home-mobile-nav">
        <Link href="/"><HomeIcon className="size-5" />Inicio</Link>
        <Link href="/shop"><List className="size-5" />Categorías</Link>
        <Link href="/shop?promo=1&page=1"><Tag className="size-5" />Ofertas</Link>
        <Link href="/shop"><Heart className="size-5" />Favoritos</Link>
        <Link href="/admin/login"><User className="size-5" />Cuenta</Link>
      </nav>

    </div>
  )
}

function HomeBrand() {
  return (
    <Link href="/" className="home-brand">
      <BrandLogo className="home-brand-mark" priority sizes="52px" />
      <span className="home-brand-text">MULTI<br />ACCESORIOS</span>
    </Link>
  )
}

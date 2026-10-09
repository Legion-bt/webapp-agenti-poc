import React, { useEffect, useState } from 'react';
import { productImageService } from '../../services/product-image.service';
import { Product } from '../../types';

interface ProductImageProps {
  product: Product;
  className?: string;
}

/**
 * Shows the product photo from the private bucket (signed URL) or, when there is
 * none, a drawn illustration bundled with the app: no external image URLs.
 */
export const ProductImage: React.FC<ProductImageProps> = ({ product, className }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (product.imagePath) {
      productImageService.getUrl(product.imagePath).then((signed) => {
        if (active) setUrl(signed);
      });
    }
    return () => {
      active = false;
    };
  }, [product.imagePath]);

  if (url && !failed) {
    return <img src={url} alt={product.name} className={className} onError={() => setFailed(true)} />;
  }
  return <ProductIllustration product={product} className={className} />;
};

type Kind = 'oil' | 'red' | 'white' | 'box' | 'cruet';

function kindOf(product: Product): Kind {
  const text = `${product.name} ${product.categoryName}`.toUpperCase();
  if (/BAG-IN-BOX|BAG IN BOX|LT\. ?5|\b5 ?L\b/.test(text)) return 'box';
  if (/CONDIMENT|ACET/.test(text)) return 'cruet';
  if (/OLIO/.test(text)) return 'oil';
  if (/BIANCO/.test(text)) return 'white';
  return 'red';
}

const GLASS: Record<Exclude<Kind, 'box'>, { glass: string; shine: string; cap: string; label: string }> = {
  red: { glass: '#3b0d1a', shine: '#7a2a3f', cap: '#5b1222', label: '#f4ede1' },
  white: { glass: '#a9b86a', shine: '#d6e0a0', cap: '#c9a646', label: '#fbf8ef' },
  oil: { glass: '#3d4a1c', shine: '#6f7f3a', cap: '#b8962e', label: '#f6efd8' },
  cruet: { glass: '#2a1a12', shine: '#5a3a28', cap: '#8a6a3a', label: '#efe6d6' },
};

const ProductIllustration: React.FC<ProductImageProps> = ({ product, className }) => {
  const kind = kindOf(product);
  const initial = (product.brand || product.name).trim().charAt(0).toUpperCase();

  if (kind === 'box') {
    return (
      <svg viewBox="0 0 200 240" className={className} role="img" aria-label={product.name}>
        <ellipse cx="100" cy="222" rx="70" ry="7" fill="#0f172a" opacity="0.08" />
        <path d="M45 70 L100 50 L155 70 L155 210 L45 210 Z" fill="#c8a477" />
        <path d="M100 50 L155 70 L155 210 L100 216 Z" fill="#b08d62" />
        <path d="M45 70 L100 90 L155 70" fill="none" stroke="#9c7b52" strokeWidth="2" />
        <path d="M100 90 L100 216" stroke="#9c7b52" strokeWidth="2" />
        <rect x="55" y="105" width="38" height="56" rx="3" fill="#fbf8ef" />
        <text x="74" y="135" textAnchor="middle" fontSize="20" fontWeight="700" fill="#64743a" fontFamily="serif">
          {initial}
        </text>
        <rect x="61" y="145" width="26" height="3" rx="1.5" fill="#a9b86a" />
        <rect x="118" y="180" width="18" height="14" rx="2" fill="#334155" />
        <rect x="124" y="194" width="6" height="10" rx="1" fill="#475569" />
      </svg>
    );
  }

  const c = GLASS[kind];
  const isCruet = kind === 'cruet';
  const bottle = isCruet
    ? 'M88 40 L112 40 L112 92 C140 104 146 128 146 160 L146 200 C146 208 140 212 132 212 L68 212 C60 212 54 208 54 200 L54 160 C54 128 60 104 88 92 Z'
    : kind === 'oil'
      ? 'M90 20 L110 20 L110 70 C124 82 130 92 130 110 L130 204 C130 209 126 212 121 212 L79 212 C74 212 70 209 70 204 L70 110 C70 92 76 82 90 70 Z'
      : 'M91 14 L109 14 L109 74 C126 88 134 100 134 122 L134 204 C134 209 130 212 125 212 L75 212 C70 212 66 209 66 204 L66 122 C66 100 74 88 91 74 Z';
  const capY = isCruet ? 28 : kind === 'oil' ? 10 : 6;
  const labelY = isCruet ? 140 : 130;
  const labelX = isCruet ? 66 : 72;
  const labelW = isCruet ? 68 : 56;

  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label={product.name}>
      <ellipse cx="100" cy="222" rx="52" ry="7" fill="#0f172a" opacity="0.08" />
      <path d={bottle} fill={c.glass} />
      <rect x={isCruet ? 86 : 89} y={capY} width={isCruet ? 28 : 22} height={isCruet ? 16 : 30} rx="3" fill={c.cap} />
      <rect x={isCruet ? 64 : 74} y="104" width="6" height="96" rx="3" fill={c.shine} opacity="0.55" />
      <rect x={labelX} y={labelY} width={labelW} height="54" rx="3" fill={c.label} />
      <text
        x="100"
        y={labelY + 30}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill={c.glass}
        fontFamily="serif"
      >
        {initial}
      </text>
      <rect x={100 - labelW / 2 + 10} y={labelY + 40} width={labelW - 20} height="3" rx="1.5" fill={c.cap} />
    </svg>
  );
};

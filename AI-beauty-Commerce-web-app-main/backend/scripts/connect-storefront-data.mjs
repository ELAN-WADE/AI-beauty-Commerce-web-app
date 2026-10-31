import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
function initializer(source,name,replacement) {
 const ast=ts.createSourceFile('component.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX); let span;
 const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(ast)===name&&node.initializer)span=[node.initializer.getStart(ast),node.initializer.end];ts.forEachChild(node,visit);};visit(ast);
 if(!span)throw Error(`Missing initializer ${name}`);return source.slice(0,span[0])+replacement+source.slice(span[1]);
}
for(const prefix of ['src','backend/src/storefront']) {
 const edit=(relative,fn)=>{const file=path.join(root,prefix,relative);let s=fs.readFileSync(file,'utf8');fs.writeFileSync(file,fn(s));};
 edit('components/home/EditorialHero.tsx',s=>{
  s=s.replace("import React, { useState } from 'react';","import React, { useState } from 'react';\nimport { useApp } from '../../context/AppContext';");
  s=s.replace('  const [resetKey, setResetKey]',"  const { heroSlides } = useApp();\n  const published = heroSlides.filter(slide => slide.isActive);\n  const [resetKey, setResetKey]");
  s=initializer(s,'carouselItems',"published.map(slide => ({ src: slide.image, alt: slide.headline, title: slide.headline, subtitle: slide.subtext }))");
  s=s.replace('Natural Barrier Precision.',"{published[0]?.headline || 'Desla!™'}").replace('Bio-identical lipids, formulated for depth.',"{published[0]?.subtext || 'Explore our catalogue and partner network.'}").replace('<span>Explore Formulations</span>',"<span>{published[0]?.actionLabel || 'Explore Formulations'}</span>");
  const start=s.indexOf('<div className="w-full relative h-');const end=s.lastIndexOf('</div>');
  if(start<0||end<start)throw Error('Hero carousel wrapper not found');s=s.slice(0,start)+'{carouselItems.length > 0 && ('+s.slice(start,end+6)+')}'+s.slice(end+6);return s;
 });
 edit('components/home/DailyRitualShowcase.tsx',s=>{
  s=s.replace("import React, { useState } from 'react';","import React, { useState } from 'react';\nimport { useApp } from '../../context/AppContext';");
  s=s.replace('  const [activeStep, setActiveStep]',"  const { routineSteps, products } = useApp();\n  const [activeStep, setActiveStep]");
  s=initializer(s,'steps',"routineSteps.filter(step => step.isActive !== false).flatMap((step, index) => { const product = products.find(product => product.id === (step.associatedProductId || step.productId)); return product ? [{ number: step.number || String(index + 1).padStart(2, '0'), title: step.title, productName: product.name, price: product.price, image: step.image || product.image, discipline: step.tagline, description: step.description }] : []; })");
  s=s.replace('  return (',"  if (!steps.length) return null;\n  const selectedStep = steps[Math.min(activeStep, steps.length - 1)];\n  return (",1).replaceAll('steps[activeStep]','selectedStep');return s;
 });
 edit('components/home/AuthenticReviewsSection.tsx',s=>{
  s=s.replace("import React from 'react';","import React, { useEffect, useState } from 'react';\nimport { useApp } from '../../context/AppContext';\nimport { fetchProductReviewsApi } from '../../lib/owned-api';");
  s=s.replace('  // Four authentic customer testimonials with verified details',"  const { products } = useApp();\n  const [publishedReviews, setPublishedReviews] = useState<CardSpreadItem[]>([]);\n  const productKey = products.slice(0, 6).map(product => product.id).join('|');\n  useEffect(() => {\n    let cancelled = false;\n    Promise.all(products.slice(0, 6).map(product => fetchProductReviewsApi(product.id))).then(results => { if (!cancelled) setPublishedReviews(results.flatMap(rows => (rows || []).map(review => ({ ...review, city: review.city || '' }))).slice(0, 8)); });\n    return () => { cancelled = true; };\n  }, [productKey]);");
  s=initializer(s,'testimonialItems','publishedReviews');s=s.replace('  return (','  if (!testimonialItems.length) return null;\n  return (',1);return s;
 });
 edit('components/home/EditorialBrandStory.tsx',s=>{
  s=s.replace("import React from 'react';","import React from 'react';\nimport { useApp } from '../../context/AppContext';");
  s=s.replace('  return (',"  const { brandStory } = useApp();\n  if (!brandStory.heading.trim()) return null;\n  return (",1).replace('src="/hero_editorial.jpg"','src={brandStory.image}');
  s=s.replace('Lagos Laboratory Formulations','{brandStory.tagline}').replace('Unrefined Nilotica Shea','{brandStory.badge1}');
  s=s.replace(/(<h2[^>]*>)[\s\S]*?(<\/h2>)/,'$1{brandStory.heading}$2');
  const paras=[...s.matchAll(/<p>\s*([\s\S]*?)\s*<\/p>/g)];
  for(let i=Math.min(2,paras.length)-1;i>=0;i--)s=s.slice(0,paras[i].index)+`<p>{brandStory.paragraph${i+1}}</p>`+s.slice(paras[i].index+paras[i][0].length);
  const start=s.indexOf('            {/* 3 Clean Standards');const end=s.indexOf('            <div className="pt-1">',start);
  if(start>=0&&end>start)s=s.slice(0,start)+`            <div className="frosted-glass-surface rounded-xl p-4 border border-white/90 space-y-2 text-xs">{[brandStory.badge1, brandStory.badge2].filter(Boolean).map(badge => <p key={badge}>{badge}</p>)}</div>\n`+s.slice(end);return s;
 });
 edit('components/admin/NetworkPanel.tsx',s=>initializer(s,'initialNetworkOverview',"{ locations: [], stock: [], partners: [], creators: [], users: [], variants: [], transfers: [], restocks: [], banks: [], withdrawals: [], finance: false, wholesalePrices: [], wholesaleOrders: [] }"));
 edit('components/partner/shell/PartnerAppShell.tsx',s=>{
  s=s.replace("import React, { useState } from 'react';","import React, { useState } from 'react';\nimport { usePartnerRecords } from '../../../lib/use-partner-records';");
  s=s.replace('  const { isLiveBackend } = useApp();',"  const { records } = usePartnerRecords(kind);");
  s=initializer(s,'notificationsList',"records.filter(record => record.kind === 'ANNOUNCEMENT' && record.status === 'PUBLISHED').map(record => ({ id: record.id, title: record.title, desc: record.body, time: new Date(record.updatedAt).toLocaleString(), unread: false }))");
  s=s.replace("onRouteChange('notifications')","onRouteChange(isCreator ? 'notifications' : 'orders')");return s;
 });
}
console.log('Connected home and partner sections to persisted records.');

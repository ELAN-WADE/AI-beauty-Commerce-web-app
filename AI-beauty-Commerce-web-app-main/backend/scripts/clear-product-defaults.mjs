import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const emptyArrays=new Set(['whatItDoes','selectedSkinTypes','selectedConcerns','ingredients','galleryImages','hubStocks']);
const emptyStrings=new Set(['category','subCategory','routineStep','instructions','precautions','heroImage','origin','guarantee','customBadge']);
for(const prefix of ['src','backend/src/storefront']) {
 const file=path.join(root,prefix,'components/admin/ProductDrawer.tsx');let s=fs.readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), edits=[];
 function visit(node){
  if(ts.isVariableDeclaration(node)&&ts.isArrayBindingPattern(node.name)&&node.initializer&&ts.isCallExpression(node.initializer)&&node.initializer.expression.getText(ast)==='useState') {
   const name=node.name.elements[0]?.name.getText(ast), arg=node.initializer.arguments[0];
   let replacement=emptyArrays.has(name)?'[]':emptyStrings.has(name)?"''":name==='crueltyFree'?'false':name==='variants'?"[{ sku: '', sizeLabel: '', priceNgn: 0, compareAtNgn: null, stock: 0, isActive: true }]":null;
   if(replacement!==null&&arg)edits.push([arg.getStart(ast),arg.end,replacement]);
  }
  if(ts.isCallExpression(node)&&['setWhatItDoes','setIngredients','setHubStocks','setSelectedSkinTypes','setSelectedConcerns','setGalleryImages'].includes(node.expression.getText(ast))&&node.arguments[0]&&ts.isArrayLiteralExpression(node.arguments[0]))edits.push([node.arguments[0].getStart(ast),node.arguments[0].end,'[]']);
  ts.forEachChild(node,visit);
 }
 visit(ast);for(const [start,end,value] of edits.sort((a,b)=>b[0]-a[0]))s=s.slice(0,start)+value+s.slice(end);
 s=s.replace(/categoriesList = \[[\s\S]*?\]\n\}\) =>/, 'categoriesList = []\n}) =>');
 for(const [old,value] of [['Natural Serum',''],['Barrier Cream',''],['Lagos Formulation Laboratory & Paris Derm-Center',''],['100% Natural Assay Authenticity Guaranteed',''],['NAFDAC Certified',''],['Apply 2-3 drops to cleansed skin morning and evening. Pat gently with fingertips until completely absorbed.',''],['For external topical use only. Conduct a 24-hour patch test behind the ear prior to initial use.','']])s=s.replaceAll(`'${old}'`,`'${value}'`);
 s=s.replace(/\{ sku: 'DES-NEW-50ML', sizeLabel: '50ml \/ 1.7 fl oz', priceNgn: 24500, compareAtNgn: 28000, stock: \d+, isActive: true \}/g,"{ sku: '', sizeLabel: '', priceNgn: 0, compareAtNgn: null, stock: 0, isActive: true }");
 s=s.replaceAll('product.price || 24000','product.price || 0').replaceAll('product.stockCount || 50','product.stockCount || 0').replaceAll("product.image || '/product_barrier_cream.jpg'","product.image || ''").replaceAll("setHeroImage('/product_barrier_cream.jpg')","setHeroImage('')").replaceAll("product.brandInfo?.crueltyFree !== false","product.brandInfo?.crueltyFree === true").replaceAll('setCrueltyFree(true)','setCrueltyFree(false)');
 s=s.replace("setSubCategory('');", "setSubCategory('');");
 s=s.replace("priceNgn: (variants[0]?.priceNgn || 24000) + 12000",'priceNgn: variants[0]?.priceNgn || 0').replace('stock: 50,','stock: 0,');
 const marker='    setIsSubmitting(true);';
 s=s.replace(marker,"    if (!category || !categoriesList.some(item => item.slug === category)) { setErrorMsg('Choose a saved category. Create a category in Formulations & Taxonomy first if needed.'); setActiveTab('identity'); return; }\n    if (!heroImage.trim()) { setErrorMsg('Add the actual product image before publishing.'); setActiveTab('media'); return; }\n\n"+marker,1);
 fs.writeFileSync(file,s);
}
console.log('Removed invented product claims, prices and starting stock.');

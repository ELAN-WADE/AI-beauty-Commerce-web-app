import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
for(const prefix of ['src','backend/src/storefront']) {
 for(const [relative,names] of [
  ['components/partner/creator/CreatorContentLibrary.tsx',['contentItems']],
  ['components/partner/creator/CreatorCampaigns.tsx',['appliedCampaignIds']],
  ['components/partner/creator/CreatorContentEditor.tsx',['selectedProductIds']],
 ]) {
  const file=path.join(root,prefix,relative);let source=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[];
  function visit(node){if(ts.isVariableDeclaration(node)&&ts.isArrayBindingPattern(node.name)&&node.initializer&&ts.isCallExpression(node.initializer)&&names.includes(node.name.elements[0]?.name.getText(ast))){const arg=node.initializer.arguments[0];edits.push([arg.getStart(ast),arg.end,'[]']);}ts.forEachChild(node,visit);}visit(ast);
  for(const [start,end,value] of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+value+source.slice(end);fs.writeFileSync(file,source);
 }
 const file=path.join(root,prefix,'screens/catalog/Screen06Catalogue.tsx');let source=fs.readFileSync(file,'utf8');source=source.replace('    products,','    products,\n    routineSteps: publishedRoutineSteps,');
 let ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[];
 function visit(node){
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text==='routineSteps'&&node.initializer)edits.push([node.initializer.getStart(ast),node.initializer.end,"publishedRoutineSteps.filter(step => step.isActive !== false).flatMap((step, index) => { const product = products.find(product => product.id === (step.associatedProductId || step.productId)); return product ? [{ image: step.image || product.image, title: product.name, step: step.title, price: product.price, skinType: step.tagline, product }] : []; })"]);
  if(ts.isArrowFunction(node)&&node.parent&&ts.isVariableDeclaration(node.parent)&&node.parent.name.getText(ast)==='handleAddCompleteRoutine')edits.push([node.getStart(ast),node.end,"() => { for (const step of routineSteps) addToCart(step.product, step.product.sizes[0] || 'Standard', 1); if (routineSteps.length) navigateTo('cart'); }"]);
  if(ts.isJsxElement(node)&&node.openingElement.attributes.properties.some(prop=>ts.isJsxAttribute(prop)&&prop.name.getText(ast)==='className'&&prop.initializer?.getText(ast).includes('lg:col-span-6 space-y-3 lg:border-l')))edits.push([node.getStart(ast),node.end,'{routineSteps.length > 0 && ('+node.getText(ast).replaceAll('routineSteps[activeRoutineIndex]','routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)]').replace('Recommended Routine: 3-Step Daily Ritual','Published Routine')+')}']);
  ts.forEachChild(node,visit);
 }visit(ast);for(const [start,end,value] of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+value+source.slice(end);fs.writeFileSync(file,source);
 const admin=path.join(root,prefix,'screens/admin/ScreenAdminConsole.tsx');source=fs.readFileSync(admin,'utf8');ast=ts.createSourceFile(admin,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const chartEdits=[];
 function chart(node){if(ts.isConditionalExpression(node)&&node.condition.getText(ast)==='isLiveBackend'&&node.whenTrue.getText(ast).includes('The latest recorded orders'))chartEdits.push([node.getStart(ast),node.end,node.whenTrue.getText(ast)]);ts.forEachChild(node,chart);}chart(ast);for(const[start,end,value]of chartEdits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+value+source.slice(end);fs.writeFileSync(admin,source);
}
console.log('Removed remaining fabricated content and routine fallbacks.');

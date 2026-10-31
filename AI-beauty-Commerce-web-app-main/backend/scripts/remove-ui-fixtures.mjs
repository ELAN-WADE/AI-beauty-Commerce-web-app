import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = fileURLToPath(new URL('../../', import.meta.url));
if (JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name !== 'glowly-beauty') throw new Error('Unexpected workspace root.');
const backup = path.join(root, 'backend/.local/fixture-audit/source');
fs.mkdirSync(backup, { recursive: true });
const adminStates = new Set(['cryptoTransactions', 'creatorsList', 'creatorApps', 'prRequests', 'ugcSubmissions', 'customerReviews', 'customersList', 'skinScanLogs', 'orders', 'transferClaims', 'inventoryItems', 'auditLogs']);
const appStates = new Set(['heroSlides','routineSteps','products','communityMessages','distributorsList','creatorsList','communityPostsList','reviewsList','categoriesList','prBoxesList','creatorCampaignsList','wholesaleCartonsList','labShipmentsList','incidentTicketsList','couponRulesList','inventoryItemsList','stockMovementLogsList','creatorLinksList','creatorLedgerList','creatorPRRequestsList','creatorSubmissionsList','creatorStorefrontProducts','distributorLedgerList']);
const exportsToClear = new Set(['products','categories','creators','distributors','reviews','initialOrders','initialVouchers','initialPointsActivity','initialCommunityMessages','communityPosts']);
let changed = 0;
for (const prefix of ['src', 'backend/src/storefront']) {
  const files = [path.join(prefix,'context/AppContext.tsx'), path.join(prefix,'screens/admin/ScreenAdminConsole.tsx'), ...fs.readdirSync(path.join(root,prefix,'data')).filter(name=>name.endsWith('.ts')).map(name=>path.join(prefix,'data',name))];
  for (const relative of files) {
    const filename=path.join(root,relative), source=fs.readFileSync(filename,'utf8');
    const ast=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,filename.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    const edits=[];
    function visit(node) {
      if (ts.isVariableDeclaration(node) && node.initializer) {
        if (ts.isArrayBindingPattern(node.name) && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(ast)==='useState') {
          const key=node.name.elements[0]?.name.getText(ast);
          const names=relative.includes('ScreenAdminConsole')?adminStates:appStates;
          const arg=node.initializer.arguments[0];
          if (names.has(key) && arg && arg.getText(ast)!=='[]') edits.push([arg.getStart(ast),arg.end,'[]']);
        } else if (ts.isIdentifier(node.name) && exportsToClear.has(node.name.text) && ts.isArrayLiteralExpression(node.initializer)) {
          if (node.initializer.elements.length) edits.push([node.initializer.getStart(ast),node.initializer.end,'[]']);
        } else if (ts.isIdentifier(node.name) && node.name.text==='initialUserProfile') {
          edits.push([node.initializer.getStart(ast),node.initializer.end,"{ name: '', email: '', phone: '', avatar: '', points: 0, savedAddresses: [] }"]);
        }
      }
      ts.forEachChild(node,visit);
    }
    visit(ast);
    if (edits.length) {
      const saved=path.join(backup,relative.replaceAll('\\','__').replaceAll('/','__')+'.txt');
      if (!fs.existsSync(saved)) fs.writeFileSync(saved,source);
      let result=source; for(const [start,end,value] of edits.sort((a,b)=>b[0]-a[0]))result=result.slice(0,start)+value+result.slice(end);
      fs.writeFileSync(filename,result); changed++;
    }
  }
}
console.log(JSON.stringify({sourceFilesCleared:changed,backup:'backend/.local/fixture-audit/source',databaseChanged:false}));

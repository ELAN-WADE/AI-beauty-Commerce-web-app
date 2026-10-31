import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
for(const prefix of ['src','backend/src/storefront']) {
 const file=path.join(root,prefix,'context/AppContext.tsx'); let source=fs.readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[];
 const liveOnly = new Set(['login','register','requestPasswordReset','resetPassword','verifyEmail']);
 function visit(node) {
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer&&ts.isArrowFunction(node.initializer)) {
   const name=node.name.text, fn=node.initializer;
   if(liveOnly.has(name)&&ts.isBlock(fn.body))for(const statement of fn.body.statements)if(ts.isIfStatement(statement)&&statement.expression.getText(ast)==='!isOwnedApiConfigured')edits.push([statement.getStart(ast),statement.end,'']);
   if(name==='setSimulatedUserRole')edits.push([fn.getStart(ast),fn.end,"(_role: string) => { setAuthError('Partner and staff access requires administrator approval.'); navigateTo('login'); }"]);
   if(name==='loginAsDemoRole')edits.push([fn.getStart(ast),fn.end,"(role: 'CUSTOMER' | 'CREATOR' | 'DISTRIBUTOR' | 'SUPER_ADMIN') => { navigateTo(role === 'CREATOR' ? 'creators' : role === 'DISTRIBUTOR' ? 'distributor-portal' : 'login'); }"]);
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);for(const[start,end,value]of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+value+source.slice(end);
 source=source.replace("      if (authUser?.id?.startsWith('usr-demo-')) return;\n",'');
 const marker="  const [authError, setAuthError] = useState('');";
 const sync=`
  const profileOwner = useRef<string | null>(null);
  useEffect(() => {
    const owner = authUser?.id || null;
    const sameOwner = owner !== null && profileOwner.current === owner;
    profileOwner.current = owner;
    setUserProfile(previous => ({ ...(sameOwner ? previous : { points: 0, savedAddresses: [] }), name: authUser?.profile?.displayName || '', email: authUser?.email || '', phone: authUser?.profile?.phone || '', avatar: authUser?.profile?.avatarUrl || '' }));
    if (!sameOwner) { setOrders([]); setWishlist([]); setSkinProfile(null); setVouchers([]); setPointsActivity([]); }
  }, [authUser?.id, authUser?.email, authUser?.profile?.displayName, authUser?.profile?.phone, authUser?.profile?.avatarUrl]);
`;
 if(!source.includes('const profileOwner ='))source=source.replace(marker,marker+sync);
 fs.writeFileSync(file,source);
}
console.log('Removed simulated identities and connected profile state to the authenticated account.');

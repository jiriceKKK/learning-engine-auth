const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const id='ab1cd2efghijklmn3opqrst4uvwxyzab'; // shape of a real Supabase authorization_id (32 lowercase letters and digits)
const page=f=>Object.fromEntries([...fs.readFileSync(require('node:path').join(__dirname,'..',f),'utf8').matchAll(/<meta name="(le-[a-z-]+)" content="([^"]*)">/g)].map(m=>[m[1],m[2]]));
async function setup({search='?authorization_id='+id,user=true,callback='https://claude.ai/callback',detailsError=false,metas=page('index.html')}={}){
 const elements={}; const calls=[];let signed=user;const redirects=[];
 const element=()=>({hidden:true,value:'',textContent:'',disabled:false,children:[],events:{},addEventListener(t,fn){this.events[t]=fn},replaceChildren(){this.children=[]},append(c){this.children.push(c)}});
 const document={getElementById(k){return elements[k]??=element()},createElement:element,querySelector(q){const n=q.match(/name="([^"]+)"/)[1];return n in metas?{getAttribute:()=>metas[n]}:null}};
 const oauth={getAuthorizationDetails:async()=>({data:detailsError?null:{authorization_id:id,client:{id:'client-1',name:'<img src=x onerror=alert(1)>'},redirect_uri:callback,scope:'openid email'},error:detailsError?{}:null})};
 for(const action of ['approve','deny'])oauth[action+'Authorization']=async(...args)=>{calls.push([action,...args]);return{data:{redirect_url:callback},error:null}};
 const client={auth:{getUser:async()=>({data:{user:signed?{id:'user-1',email:'owner@example.com'}:null},error:null}),oauth,signInWithPassword:async()=>{signed=true;return{error:null}},signOut:async()=>{signed=false;return{error:null}}}};
 const window={};window.top=window.self=window;window.supabase={createClient(u,k,o){calls.push(['createClient',u,k,o.auth.storageKey]);return client}};
 vm.runInNewContext(source,{document,window,location:{search,assign:u=>redirects.push(u)},URL,URLSearchParams,sessionStorage:{}});
 await new Promise(setImmediate);
 return{elements,calls,redirects,async event(el,type='click'){await elements[el].events[type]({preventDefault(){}});await new Promise(setImmediate)}};
}
test('missing or duplicate authorization ID never initializes auth',async()=>{for(const search of ['', '?authorization_id='+id+'&authorization_id='+id,'?authorization_id=../bad']){const x=await setup({search});assert.equal(x.calls.length,0);assert.equal(x.elements.login,undefined)}});
test('Supabase-format and UUID authorization IDs both start the request',async()=>{for(const v of [id,'11111111-1111-4111-8111-111111111111']){const x=await setup({search:'?authorization_id='+v});assert.equal(x.calls[0][0],'createClient')}});
test('untrusted client name is text; nothing auto-approves',async()=>{const x=await setup();assert.equal(x.elements['client-name'].textContent,'<img src=x onerror=alert(1)>');assert.equal(x.elements.consent.hidden,false);assert.equal(x.calls.length,1);assert.equal(x.elements.scopes.children.length,2)});
test('login retains the request and clears password',async()=>{const x=await setup({user:false});assert.equal(x.elements.login.hidden,false);x.elements.email={value:'owner@example.com'};x.elements.password={value:'test-only'};await x.event('login-form','submit');assert.equal(x.elements.password.value,'');assert.equal(x.elements.consent.hidden,false)});
test('approve and deny use matching SDK method and server callback',async()=>{for(const action of ['approve','deny']){const x=await setup();await x.event(action);assert.equal(x.calls[1][0],action);assert.equal(x.calls[1][1],id);assert.equal(x.calls[1][2].skipBrowserRedirect,true);assert.deepEqual(x.redirects,['https://claude.ai/callback'])}});
test('unsafe server callback is refused',async()=>{const x=await setup({callback:'javascript:alert(1)'});await x.event('approve');assert.equal(x.redirects.length,0);assert.equal(x.elements.error.hidden,false)});
test('expired request exposes no consent controls',async()=>{const x=await setup({detailsError:true});assert.equal(x.elements.consent.hidden,true);await x.event('approve');assert.equal(x.calls.length,1)});
test('each page connects only to its own project, allowed by its CSP',async()=>{for(const [f,env,ref] of [['index.html','dev','lchqaaapvdthqkukpksm'],['prod/index.html','prod','tuyrksrubpqycosozawu']]){const m=page(f);const x=await setup({metas:m});assert.deepEqual(x.calls[0],['createClient','https://'+ref+'.supabase.co',m['le-publishable-key'],'learning-engine-'+env+'-consent']);const html=fs.readFileSync(require('node:path').join(__dirname,'..',f),'utf8');assert.match(html,new RegExp('connect-src https://'+ref+'\\.supabase\\.co;'));assert.equal(html.includes(env==='prod'?'lchqaaapvdthqkukpksm':'tuyrksrubpqycosozawu'),false)}});
test('missing or foreign page configuration never initializes auth',async()=>{for(const metas of [{},{...page('index.html'),'le-supabase-url':'https://evil.example.com'},{...page('index.html'),'le-publishable-key':'sb_secret_x'}]){const x=await setup({metas});assert.equal(x.calls.length,0)}});

import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const offline=process.argv.includes('--offline');
const env={...process.env};for(const key of ['GIT_INDEX_FILE','GIT_DIR','GIT_COMMON_DIR','GIT_WORK_TREE','GIT_PREFIX'])delete env[key];
function git(cwd,args){const r=spawnSync('git',args,{cwd,env,encoding:'utf8',windowsHide:true});if(r.status!==0)throw new Error(r.stderr?.trim()||'Git no disponible');return r.stdout.trim();}
const common=git(path.dirname(root),['rev-parse','--path-format=absolute','--git-common-dir']);
const originalWeb=path.dirname(common);
const saas=process.env.CRIPTON_SAAS_REPO||path.join(path.dirname(originalWeb),'pos_saas');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'research','context-baseline.json'),'utf8'));
const rows=[];let failed=false;
for(const repo of [{name:'pagina_pos',cwd:originalWeb,branch:'codex/pagina-pos-landing'},{name:'pos_saas',cwd:saas,branch:'feature/saas-foundation'}]){
 try{
  if(!offline)git(repo.cwd,['fetch','--no-tags','origin',`+refs/heads/${repo.branch}:refs/remotes/origin/${repo.branch}`]);
  const ref=`refs/remotes/origin/${repo.branch}`;const sha=git(repo.cwd,['rev-parse',ref]);const expected=baseline[repo.name];
  const changed=sha!==expected;const files=changed?git(repo.cwd,['diff','--name-only',expected,sha]).split(/\r?\n/).filter(Boolean):[];
  rows.push({repo:repo.name,branch:repo.branch,sha,baseline:expected,changed,files,unpublishedFiles:git(repo.cwd,['status','--porcelain']).split(/\r?\n/).filter(Boolean).length});
  failed ||= changed;
 }catch(e){failed=true;rows.push({repo:repo.name,error:String(e.message)});}
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),mode:offline?'offline-not-remote-certified':'remote-checked',repositories:rows,action:failed?'Revisar cambios y actualizar afirmaciones/baseline sólo después de leer diffs. No fusionar historias.':'Fuentes publicadas coinciden con el baseline revisado.'},null,2));
process.exitCode=failed?1:0;

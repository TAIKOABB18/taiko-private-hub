import { DurableObject } from "cloudflare:workers";
interface ItemStoreEnv {}
export type UserRole="OWNER"|"COLLABORATOR";
export interface User { id:number; email:string; name:string; role:UserRole; createdAt:string; }
export interface AuthUser extends User { passwordHash:string; }
export interface Session { token:string; userId:number; expiresAt:string; }
export interface ProjectMember { projectId:number; userId:number; role:"COLLABORATOR"; createdAt:string; }
export interface Project { id:number; name:string; description:string; status:"active"|"archived"; createdAt:string; }
export interface Message { id:number; projectId:number; author:"admin"|"guest"; body:string; createdAt:string; }
export interface Invite { id:number; projectId:number; label:string; token:string; active:number; createdAt:string; }
export interface VaultFile { id:number; projectId:number; name:string; storageKey:string; size:number; mime:string; favorite:number; deleted:number; createdAt:string; updatedAt:string; }
export interface Tag { id:number; fileId:number; name:string; }
export interface Share { id:number; fileId:number; token:string; expiresAt:string|null; revoked:number; createdAt:string; }
export interface AgentJob { id:number; projectId:number|null; kind:string; status:"queued"|"blocked"; policy:string; createdAt:string; }
type Row<T> = Record<string, SqlStorageValue> & T;
const OWNER_EMAIL="tramiteshbc@gmail.com";
export class ItemStore extends DurableObject<ItemStoreEnv> {
  constructor(ctx: DurableObjectState, env: ItemStoreEnv) { super(ctx, env); ctx.storage.sql.exec(`
CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER NOT NULL,author TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS invites (id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER NOT NULL,label TEXT NOT NULL,token TEXT NOT NULL UNIQUE,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER NOT NULL,name TEXT NOT NULL,storage_key TEXT NOT NULL,size INTEGER NOT NULL DEFAULT 0,mime TEXT NOT NULL DEFAULT 'application/octet-stream',favorite INTEGER NOT NULL DEFAULT 0,deleted INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT,file_id INTEGER NOT NULL,name TEXT NOT NULL,UNIQUE(file_id,name));
CREATE TABLE IF NOT EXISTS shares (id INTEGER PRIMARY KEY AUTOINCREMENT,file_id INTEGER NOT NULL,token TEXT NOT NULL UNIQUE,expires_at TEXT,revoked INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS agent_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER,kind TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'blocked',policy TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE COLLATE NOCASE,name TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('OWNER','COLLABORATOR')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS project_members (project_id INTEGER NOT NULL,user_id INTEGER NOT NULL,role TEXT NOT NULL DEFAULT 'COLLABORATOR' CHECK(role='COLLABORATOR'),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(project_id,user_id));
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
`); }
  getUserByEmail(email:string):AuthUser|null{return this.ctx.storage.sql.exec<Row<AuthUser>>("SELECT id,email,name,password_hash AS passwordHash,role,created_at AS createdAt FROM users WHERE email=? COLLATE NOCASE",email.trim().toLowerCase()).toArray()[0]??null;}
  getUserById(id:number):User|null{return this.ctx.storage.sql.exec<Row<User>>("SELECT id,email,name,role,created_at AS createdAt FROM users WHERE id=?",id).toArray()[0]??null;}
  registerOwner(email:string,name:string,passwordHash:string):User{const normalized=email.trim().toLowerCase();if(normalized!==OWNER_EMAIL)throw new Error("owner_email_not_allowed");const existing=this.getUserByEmail(normalized);if(existing)throw new Error("email_already_registered");return this.ctx.storage.sql.exec<Row<User>>("INSERT INTO users(email,name,password_hash,role) VALUES (?,?,?,'OWNER') RETURNING id,email,name,role,created_at AS createdAt",normalized,name.trim(),passwordHash).one();}
  registerInvitedUser(inviteToken:string,email:string,name:string,passwordHash:string):User{const normalized=email.trim().toLowerCase();if(normalized===OWNER_EMAIL)throw new Error("owner_must_use_owner_registration");const invite=this.getInvite(inviteToken);if(!invite)throw new Error("invalid_or_consumed_invite");if(this.getUserByEmail(normalized))throw new Error("email_already_registered");const user=this.ctx.storage.sql.exec<Row<User>>("INSERT INTO users(email,name,password_hash,role) VALUES (?,?,?,'COLLABORATOR') RETURNING id,email,name,role,created_at AS createdAt",normalized,name.trim(),passwordHash).one();this.ctx.storage.sql.exec("INSERT INTO project_members(project_id,user_id,role) VALUES (?,?,'COLLABORATOR')",invite.projectId,user.id);this.ctx.storage.sql.exec("UPDATE invites SET active=0 WHERE id=?",invite.id);return user;}
  createSession(userId:number,tokenHash:string,expiresAt:string):void{this.ctx.storage.sql.exec("DELETE FROM sessions WHERE expires_at<=CURRENT_TIMESTAMP");this.ctx.storage.sql.exec("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)",tokenHash,userId,expiresAt);}
  getUserBySession(tokenHash:string):User|null{return this.ctx.storage.sql.exec<Row<User>>("SELECT u.id,u.email,u.name,u.role,u.created_at AS createdAt FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP",tokenHash).toArray()[0]??null;}
  deleteSession(tokenHash:string):void{this.ctx.storage.sql.exec("DELETE FROM sessions WHERE token_hash=?",tokenHash);}
  listMemberships(userId:number):ProjectMember[]{return this.ctx.storage.sql.exec<Row<ProjectMember>>("SELECT project_id AS projectId,user_id AS userId,role,created_at AS createdAt FROM project_members WHERE user_id=?",userId).toArray();}
  canAccessProject(user:User,projectId:number):boolean{if(user.role==="OWNER")return true;return !!this.ctx.storage.sql.exec("SELECT 1 FROM project_members WHERE user_id=? AND project_id=?",user.id,projectId).toArray().length;}
  listProjectsForUser(user:User):Project[]{if(user.role==="OWNER")return this.listProjects();return this.ctx.storage.sql.exec<Row<Project>>("SELECT p.id,p.name,p.description,p.status,p.created_at AS createdAt FROM projects p JOIN project_members pm ON pm.project_id=p.id WHERE pm.user_id=? ORDER BY p.id DESC",user.id).toArray();}
  listProjects():Project[]{return this.ctx.storage.sql.exec<Row<Project>>("SELECT id,name,description,status,created_at AS createdAt FROM projects ORDER BY id DESC").toArray();}
  createProject(name:string,description:string):Project{return this.ctx.storage.sql.exec<Row<Project>>("INSERT INTO projects (name,description) VALUES (?,?) RETURNING id,name,description,status,created_at AS createdAt",name,description).one();}
  getProject(id:number):Project|null{return this.ctx.storage.sql.exec<Row<Project>>("SELECT id,name,description,status,created_at AS createdAt FROM projects WHERE id=?",id).toArray()[0]??null;}
  archiveProject(id:number):void{this.ctx.storage.sql.exec("UPDATE projects SET status='archived' WHERE id=?",id);}
  listMessages(projectId:number):Message[]{return this.ctx.storage.sql.exec<Row<Message>>("SELECT id,project_id AS projectId,author,body,created_at AS createdAt FROM messages WHERE project_id=? ORDER BY id ASC",projectId).toArray();}
  addMessage(projectId:number,author:Message["author"],body:string):Message{return this.ctx.storage.sql.exec<Row<Message>>("INSERT INTO messages (project_id,author,body) VALUES (?,?,?) RETURNING id,project_id AS projectId,author,body,created_at AS createdAt",projectId,author,body).one();}
  listInvites():Invite[]{return this.ctx.storage.sql.exec<Row<Invite>>("SELECT id,project_id AS projectId,label,token,active,created_at AS createdAt FROM invites ORDER BY id DESC").toArray();}
  createInvite(projectId:number,label:string,token:string):Invite{return this.ctx.storage.sql.exec<Row<Invite>>("INSERT INTO invites (project_id,label,token) VALUES (?,?,?) RETURNING id,project_id AS projectId,label,token,active,created_at AS createdAt",projectId,label,token).one();}
  getInvite(token:string):Invite|null{return this.ctx.storage.sql.exec<Row<Invite>>("SELECT id,project_id AS projectId,label,token,active,created_at AS createdAt FROM invites WHERE token=? AND active=1",token).toArray()[0]??null;}
  revokeInvite(id:number):void{this.ctx.storage.sql.exec("UPDATE invites SET active=0 WHERE id=?",id);}
  listFiles(projectId:number,search="",deleted=0):VaultFile[]{const q=`SELECT id,project_id AS projectId,name,storage_key AS storageKey,size,mime,favorite,deleted,created_at AS createdAt,updated_at AS updatedAt FROM files WHERE project_id=? AND deleted=? ${search?"AND name LIKE ?":""} ORDER BY favorite DESC,updated_at DESC`; return this.ctx.storage.sql.exec<Row<VaultFile>>(q,...(search?[projectId,deleted,`%${search}%`]:[projectId,deleted])).toArray();}
  renameFile(id:number,name:string):void{this.ctx.storage.sql.exec("UPDATE files SET name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",name,id);}
  trashFile(id:number):void{this.ctx.storage.sql.exec("UPDATE files SET deleted=1,updated_at=CURRENT_TIMESTAMP WHERE id=?",id);}
  restoreFile(id:number):void{this.ctx.storage.sql.exec("UPDATE files SET deleted=0,updated_at=CURRENT_TIMESTAMP WHERE id=?",id);}
  favoriteFile(id:number,value:boolean):void{this.ctx.storage.sql.exec("UPDATE files SET favorite=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",value?1:0,id);}
  addTag(fileId:number,name:string):void{this.ctx.storage.sql.exec("INSERT OR IGNORE INTO tags(file_id,name) VALUES (?,?)",fileId,name);}
  removeTag(fileId:number,name:string):void{this.ctx.storage.sql.exec("DELETE FROM tags WHERE file_id=? AND name=?",fileId,name);}
  listTags(fileId:number):Tag[]{return this.ctx.storage.sql.exec<Row<Tag>>("SELECT id,file_id AS fileId,name FROM tags WHERE file_id=? ORDER BY name",fileId).toArray();}
  createShare(fileId:number,token:string,expiresAt:string|null):Share{return this.ctx.storage.sql.exec<Row<Share>>("INSERT INTO shares(file_id,token,expires_at) VALUES (?,?,?) RETURNING id,file_id AS fileId,token,expires_at AS expiresAt,revoked,created_at AS createdAt",fileId,token,expiresAt).one();}
  listShares(fileId?:number):Share[]{return this.ctx.storage.sql.exec<Row<Share>>(fileId?"SELECT id,file_id AS fileId,token,expires_at AS expiresAt,revoked,created_at AS createdAt FROM shares WHERE file_id=? ORDER BY id DESC":"SELECT id,file_id AS fileId,token,expires_at AS expiresAt,revoked,created_at AS createdAt FROM shares ORDER BY id DESC",...(fileId?[fileId]:[])).toArray();}
  revokeShare(id:number):void{this.ctx.storage.sql.exec("UPDATE shares SET revoked=1 WHERE id=?",id);}
  enqueueAgentJob(projectId:number|null,kind:string,policy:string):AgentJob{return this.ctx.storage.sql.exec<Row<AgentJob>>("INSERT INTO agent_jobs(project_id,kind,policy) VALUES (?,?,?) RETURNING id,project_id AS projectId,kind,status,policy,created_at AS createdAt",projectId,kind,policy).one();}
  listAgentJobs():AgentJob[]{return this.ctx.storage.sql.exec<Row<AgentJob>>("SELECT id,project_id AS projectId,kind,status,policy,created_at AS createdAt FROM agent_jobs ORDER BY id DESC").toArray();}
}
export function randomToken(bytes=18):string{const data=new Uint8Array(bytes);crypto.getRandomValues(data);return Array.from(data,b=>b.toString(16).padStart(2,"0")).join("");}
export type { Row };

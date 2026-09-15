import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
export const hashToken=(value:string)=>createHash("sha256").update(value).digest("hex");
export const createOpaqueToken=()=>randomBytes(32).toString("base64url");
export const hashPassword=(password:string)=>bcrypt.hash(password,12);
export const verifyPassword=(password:string,digest:string)=>bcrypt.compare(password,digest);

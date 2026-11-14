import {creators} from '../creators/schema';
import {and,eq} from 'drizzle-orm';
import type {Db} from '@/db/client';
import {Errors} from '@/lib/errors';
import {partnerReferrals} from './schema';
import {walletAccounts} from '../ledger/schema';
export async function configureReferral(db:Db,membershipId:string,userId:string,bps:number){
 if(!Number.isInteger(bps)||bps<0||bps>5000)throw Errors.badRequest('Commission rate must be between 0 and 50 percent.');
 const code='IA'+membershipId.replaceAll('-','').toUpperCase();
 const [collision]=await db.select({id:creators.id}).from(creators).where(eq(creators.promoCode,code));
 if(collision)throw Errors.conflict('This referral code conflicts with a creator code.');
 const [row]=await db.insert(partnerReferrals).values({membershipId,userId,code,commissionBps:bps}).onConflictDoUpdate({target:partnerReferrals.membershipId,set:{commissionBps:bps,updatedAt:new Date()}}).returning();return row;
}
export async function validateReferral(db:Db,code:string){
 const [row]=await db.select().from(partnerReferrals).where(eq(partnerReferrals.code,code.trim().toUpperCase())).for('share');
 if(!row)throw Errors.notFound('Partner code not found.');
 const {requireProgrammeAccess}=await import('../partners/programme-memberships');
 try{await requireProgrammeAccess(db,row.userId,'INFLUENCER');}catch(error){if(error&&typeof error==='object'&&'status' in error&&error.status===403)throw Errors.notFound('Partner code is not active.');throw error;}
 return row;
}
export async function referralWallet(db:Db,referralId:string,userId:string){
 const [referral]=await db.select().from(partnerReferrals).where(and(eq(partnerReferrals.id,referralId),eq(partnerReferrals.userId,userId)));
 if(!referral)throw Errors.notFound();
 const [created]=await db.insert(walletAccounts).values({userId,referralId}).onConflictDoNothing().returning();
 const wallet=created??(await db.select().from(walletAccounts).where(eq(walletAccounts.referralId,referralId)))[0];
 if(!wallet||wallet.userId!==userId)throw Errors.conflict('Partner wallet ownership requires reconciliation.');return wallet;
}

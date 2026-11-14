import {pgTable,uuid,text,integer,timestamp,check} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
import {workspaceRecords} from '../workspaces/schema';
import {users} from '../auth/schema';
import {orders} from '../orders/schema';
export const partnerReferrals=pgTable('partner_referrals',{
 id:uuid('id').primaryKey().defaultRandom(),membershipId:uuid('membership_id').notNull().unique().references(()=>workspaceRecords.id,{onDelete:'restrict'}),userId:uuid('user_id').notNull().references(()=>users.id,{onDelete:'restrict'}),code:text('code').notNull().unique(),commissionBps:integer('commission_bps').notNull().default(0),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow(),
},()=>[check('partner_referral_rate',sql`commission_bps between 0 and 5000`)]);
export const orderPartnerAttributions=pgTable('order_partner_attributions',{
 orderId:uuid('order_id').primaryKey().references(()=>orders.id,{onDelete:'restrict'}),referralId:uuid('referral_id').notNull().references(()=>partnerReferrals.id,{onDelete:'restrict'}),commissionBps:integer('commission_bps').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
},()=>[check('order_partner_rate',sql`commission_bps between 0 and 5000`)]);

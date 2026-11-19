export const PARTNER_TERMS_VERSION = '2026-11-18-draft-1';
export type PartnerTermsKind = 'CREATOR' | 'DISTRIBUTOR' | 'INFLUENCER';
export function partnerTerms(kind: PartnerTermsKind): string {
  const role = kind === 'CREATOR' ? 'Creator' : kind === 'DISTRIBUTOR' ? 'Distributor' : 'Influencer / Ambassador';
  return `Desla ${role} Programme — Interim Draft Agreement
Version: ${PARTNER_TERMS_VERSION}
Draft for review. This document does not replace an individually approved programme agreement. Commercial schedules and the legal contracting entity must be confirmed before execution.

1. Application and appointment
Applying does not create an appointment, employment relationship, agency, exclusivity or guaranteed income. Desla reviews the information supplied and communicates its decision through your account and email. An application reference is not a partner authorisation. Only an approved account may access programme activities; influencer/ambassador activation also requires acceptance of its current approved agreement.

2. Accurate information and account security
Supply accurate identity, business, contact and social-profile information. Keep your account secure and report unauthorised access. You may not transfer programme access or represent yourself as authorised before approval.

3. Programme responsibilities
${kind === 'DISTRIBUTOR' ? 'Sell genuine, authorised products only. Follow product storage, expiry, batch and handling instructions. Do not alter labels, repackage products, invent availability or make unapproved territorial or delivery promises. Keep accurate stock and fulfilment records. Wholesale prices, credit, allocation, shipping responsibilities and territory require a separate written commercial schedule.' : 'Follow each approved campaign brief and submission deadline. Disclose paid, gifted and affiliate relationships clearly. Publish honest experiences and approved product information. Do not claim medical treatment, guaranteed results, unsupported certification or fabricated reviews. Obtain required advertising approvals before publication. Campaign deliverables, fees, revision limits and usage rights must be agreed in writing.'}

4. Compensation and refunds
Only the rate and eligibility rules recorded in your approved commercial schedule apply. A referral link or pending balance is not a guarantee of payment. Commission is subject to verified eligible sales, delivery, the applicable hold period, refunds and documented payout review. Do not assume that delivery charges, cancelled orders or refunded goods earn commission. No amount, payment date or minimum earnings is promised by this draft.

5. Content and brand permissions
You retain ownership of your original content. No perpetual, exclusive or paid-advertising licence is granted by this draft. Any permitted reuse must specify the content, channels, duration and compensation in a separate written agreement. Use Desla assets only for authorised programme activity; respect third-party intellectual property and obtain necessary permissions for identifiable people.

6. Privacy and confidentiality
Use customer and business information only for the authorised purpose. Do not export customer lists, publish personal information or disclose non-public commercial information. Report suspected misuse and comply with applicable data-protection obligations.

7. Review, suspension and ending participation
Desla may request corrections or pause access while investigating inaccurate information, unsafe claims, fraud or material programme breaches. Explain the reason and allow a response where practicable. Either party may request to end participation through programme support. Outstanding valid compensation and existing customer obligations remain subject to the agreed schedule; termination does not automatically forfeit earned amounts.

8. Questions and disputes
Use the signed-in programme support channel and retain the application reference and relevant records. Seek a good-faith written resolution before escalating. Applicable law, dispute forum, notice addresses, legal entity, effective date and authorised signatories must be confirmed in the final agreement. Nothing in this draft removes mandatory consumer rights or permits misleading advertising.

Execution schedule (complete before signing): legal entity; partner legal name and reference; effective date; scope; commission/fees; payment and hold periods; territory if relevant; content rights; termination notice; governing law and signatures.
`;
}

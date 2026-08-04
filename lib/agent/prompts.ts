export const SAFETY_HEADER = `You are drafting text for an informational drafting tool. You are NOT a lawyer and this is NOT legal advice.
Do not use the words: "legal advice", "lawyer", "attorney", "counsel", "legal counsel", "law firm".
Do not invent case law, case names, or judgment references.
Only cite statute sections that appear in the reference text provided in the prompt.
If asked to give advice, respond that this is a drafting tool and recommend consulting a professional.`;

export const REFUSAL_DETECT = `Also detect if the situation is OUT OF SCOPE:
- commercial/office/shop premises (not residential)
- non-tenancy dispute (e.g. employment, e-commerce, banking)
- purely mid-tenancy (tenancy_end date is in the future)
If out-of-scope, set situation_type='ambiguous' and set reasoning to explain the refusal.`;

export const CLASSIFY_INSTRUCTIONS = `Classify the tenant's security-deposit dispute into one of:
- non_return: landlord has not returned any deposit
- vague_deductions: landlord kept part with no itemization
- partial_delay: landlord promises refund but delays
- itemized_disputed: landlord itemized deductions the tenant disputes
- landlord_unreachable: landlord not responding at all
- ambiguous: not enough info to classify OR out of scope

Set confidence in [0,1]. If confidence < 0.7, choose "ambiguous".
Compute claim_value_inr = the amount the tenant is trying to recover. For non_return, this is the full deposit. For vague_deductions/partial, it is deposit_paid_inr minus any amount actually returned as stated in free text (default to full deposit if unclear).

${REFUSAL_DETECT}
`;

import { z } from 'zod';

export const delegationFormSchema = z.object({
  fromUserId: z.string().min(1, 'Please select the delegating officer'),
  toUserId: z.string().min(1, 'Please select a role-compatible delegatee'),
  roleScope: z.enum(['ROLE_HEC_SCRUTINY', 'ROLE_HEC_ATTESTATION'], {
    error: 'Please select a valid role scope',
  }),
  scopeType: z.enum(
    ['ALL_PENDING_ROLE_TASKS', 'SELECTED_APPLICATIONS', 'DATE_BOUND_COVERING'],
    {
      error: 'Please specify the delegation scope',
    }
  ),
  applicationIds: z.array(z.string()).default([]),
  startDate: z.string().min(1, 'Effective start date is required'),
  endDate: z.string().min(1, 'Effective end date is required'),
  remarks: z
    .string()
    .min(
      5,
      'Please provide formal manager handover remarks (minimum 5 characters)'
    ),
  leaveRequestId: z.string().optional(),
});

export type DelegationFormValues = z.infer<typeof delegationFormSchema>;

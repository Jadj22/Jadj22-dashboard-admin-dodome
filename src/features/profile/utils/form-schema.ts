import * as z from 'zod';

export const userProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email(),
  telephone: z.string().optional()
});

export type UserProfileFormValues = z.infer<typeof userProfileSchema>;

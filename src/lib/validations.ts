import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  address: z.string().optional(),
  directions: z.string().optional(),
  wifi_name: z.string().optional(),
  wifi_password: z.string().optional(),
  house_rules: z.string().optional(),
  check_in_instructions: z.string().optional(),
});

export const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  description: z.string().optional(),
  max_occupancy: z.number().min(1, 'At least 1 guest'),
});

export const invitationSchema = z.object({
  guest_email: z.string().email('Enter a valid email'),
  guest_name: z.string().optional(),
  type: z.enum(['standing', 'date_offer', 'prix_fixe']),
  message: z.string().optional(),
  expires_at: z.string().optional(),
  room_ids: z.array(z.string()).min(1, 'Select at least one room'),
  windows: z
    .array(
      z.object({
        start_date: z.string(),
        end_date: z.string(),
      })
    )
    .optional(),
});

export const bookingRequestSchema = z.object({
  invitation_token: z.string().uuid(),
  check_in: z.string().min(1, 'Check-in date is required'),
  check_out: z.string().min(1, 'Check-out date is required'),
  room_ids: z.array(z.string()).min(1, 'Select at least one room'),
  party_size: z.number().min(1, 'At least 1 guest'),
  notes: z.string().optional(),
  guest_name: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

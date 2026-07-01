import { z } from 'zod';

export const loginSchema = z.object({
    nik: z.string().min(3, { message: 'NIK harus diisi minimal 3 karakter' }),
    password: z.string().min(6, { message: 'Password harus diisi minimal 6 karakter' }),
    rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

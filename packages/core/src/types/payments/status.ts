import type z from 'zod';
import type { SchemaPaymentStatus } from '../../schemas/payments/status';

type PaymentStatus = z.infer<typeof SchemaPaymentStatus>;

export type { PaymentStatus };

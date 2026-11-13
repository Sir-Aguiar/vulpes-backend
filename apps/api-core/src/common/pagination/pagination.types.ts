import { z } from 'zod';

/**
 * Schema Zod reaproveitável para query params de paginação.
 * `coerce.number()` converte automaticamente strings ("10") em números,
 * já que query strings chegam sempre como texto em HTTP.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Monta o envelope padrão de resposta paginada. `totalPages` é calculado
 * aqui, garantindo no mínimo 1 (mesmo com 0 resultados, para o front não
 * tratar caso "totalPages=0" como erro).
 */
export const paginate = <T>(
  data: T[],
  total: number,
  pagination: PaginationQuery,
): PaginatedResult<T> => ({
  data,
  total,
  page: pagination.page,
  limit: pagination.limit,
  totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
});

import { request } from './client';
import type {
  EvaluationKernelListResponse,
  EvaluationKernelStatus,
} from './types';

export interface EvaluationKernelsQuery {
  core_type?: string;
  category_code?: string;
  language?: string;
  status?: EvaluationKernelStatus;
}

/** Product metadata only. Pricing remains authoritative in billing APIs. */
export function evaluationKernels(
  query: EvaluationKernelsQuery = {},
): Promise<EvaluationKernelListResponse> {
  return request<EvaluationKernelListResponse>('/catalog/evaluation-kernels', { query });
}

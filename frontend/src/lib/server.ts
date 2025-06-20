import { Allocation } from '@/api/types';

export function getPrimaryAllocation(allocations: Allocation[]) {
  return allocations.find(allocation => allocation.isDefault);
}

export function formatAllocation(allocation: Allocation) {
  return `${allocation.alias || allocation.ip}:${allocation.port}`;
}

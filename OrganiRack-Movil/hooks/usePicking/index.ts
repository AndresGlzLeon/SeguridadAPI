/**
 * Exports centralizados para todos los hooks de picking
 *
 * Uso:
 * import { usePickingFlow, usePickingOrder, useAvailabilityCheck } from '@hooks/usePicking';
 */

export {
    useAvailabilityCheck,
    type AvailabilityResult
} from "./useAvailabilityCheck";
export { useLocationInput } from "./useLocationInput";
export {
    usePickingConfirm,
    type ConfirmPickPayload
} from "./usePickingConfirm";
export { usePickingDetails } from "./usePickingDetails";
export { usePickingFlow } from "./usePickingFlow";
export { usePickingOrder } from "./usePickingOrder";
export { usePickingUIState } from "./usePickingUIState";

// Re-export de tipos útiles
export type { DetalleSurtido, OrdenSurtido } from "@models/orders";


/**
 * Thin re-export so existing posts imports continue to work unchanged.
 * The canonical implementation lives in @/components/DateTimePickerModal.
 */
export {
  DateTimePickerModal as SchedulePickerModal,
  formatPickerDate as formatScheduleDate,
} from "@/components/DateTimePickerModal";
export type { DateTimePickerModalProps as SchedulePickerModalProps } from "@/components/DateTimePickerModal";

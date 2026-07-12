export const Z_INDEX = {
  MODAL: 110,
  FLOATING_BUBBLE: 999,
  TOAST: 1000,
  TIMER_OVERLAY: 1001,
  // Achievements can be deep-linked from a toast tap while another
  // body-portaled overlay (e.g. ShareModal) is already open, so it must
  // stack above every such overlay to actually be reachable/visible.
  ACHIEVEMENTS: 1100,
  DELETE_OVERLAY: 9999,
  DELETE_MODAL: 10000,
};

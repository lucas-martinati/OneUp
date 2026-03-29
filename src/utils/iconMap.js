import {
  Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
  Flame, Activity, MoveDown, MoveDiagonal
} from 'lucide-react';

// Maps exercise icon name strings (from config/exercises.js, config/weights.js)
// to their lucide-react component. Single source of truth — used by 11+ files.
const ICON_MAP = {
  Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
  Flame, Square: Activity, MoveDown, MoveDiagonal,
};

export default ICON_MAP;

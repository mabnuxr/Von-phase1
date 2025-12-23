import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Funnel, SortAscending, CaretDown, Check, CursorClick } from '@phosphor-icons/react';

export type InteractionType = 'filter' | 'sort' | 'select-row' | 'hover';

export interface SimulatedInteractionProps {
  /**
   * Type of interaction to simulate
   */
  type: InteractionType;

  /**
   * Whether the interaction is active
   */
  isActive: boolean;

  /**
   * Position for the interaction indicator (relative to parent)
   */
  position?: { top?: number; left?: number; right?: number; bottom?: number };

  /**
   * Callback when interaction animation completes
   */
  onComplete?: () => void;

  /**
   * Label for the filter value being selected
   */
  filterValue?: string;

  /**
   * Column name for sort interaction
   */
  sortColumn?: string;
}

/**
 * CursorIndicator - Animated cursor that moves and clicks
 */
const CursorIndicator: React.FC<{
  onClick?: boolean;
}> = ({ onClick = false }) => {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 1 }}
      animate={onClick ? { scale: [1, 0.8, 1] } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <CursorClick size={24} weight="duotone" className="text-purple-600" />
      {onClick && (
        <motion.div
          className="absolute inset-0 rounded-full bg-purple-500"
          initial={{ scale: 0.5, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.div>
  );
};

/**
 * FilterInteraction - Simulates opening a filter dropdown and selecting a value
 */
const FilterInteraction: React.FC<{
  isActive: boolean;
  filterValue: string;
  onComplete?: () => void;
}> = ({ isActive, filterValue, onComplete }) => {
  const [phase, setPhase] = useState<'cursor' | 'dropdown' | 'select' | 'applied' | 'done'>('cursor');

  React.useLayoutEffect(() => {
    if (!isActive) return;

    const t1 = setTimeout(() => setPhase('dropdown'), 500);
    const t2 = setTimeout(() => setPhase('select'), 1200);
    const t3 = setTimeout(() => setPhase('applied'), 1800);
    const t4 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isActive, onComplete]);

  if (!isActive || phase === 'done') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute z-50"
      style={{ top: 8, right: 120 }}
    >
      {/* Filter button highlight */}
      <div className="relative">
        <motion.div
          className="flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-purple-400 rounded-lg shadow-lg"
          animate={phase === 'cursor' ? { boxShadow: '0 0 0 4px rgba(128, 57, 233, 0.2)' } : {}}
        >
          <Funnel size={14} weight="duotone" className="text-gray-600" />
          <span className="text-sm text-gray-700">Risk Level</span>
          <CaretDown size={12} className="text-gray-400" />
        </motion.div>

        {/* Cursor */}
        {phase === 'cursor' && (
          <motion.div
            className="absolute -right-6 -bottom-4"
            initial={{ x: 20, y: -20, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CursorIndicator onClick={true} />
          </motion.div>
        )}

        {/* Dropdown */}
        <AnimatePresence>
          {(phase === 'dropdown' || phase === 'select' || phase === 'applied') && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
            >
              {['All', 'Critical', 'High', 'Medium'].map((option, i) => (
                <motion.div
                  key={option}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${
                    option === filterValue
                      ? phase === 'select' || phase === 'applied'
                        ? 'bg-purple-100 text-purple-700'
                        : 'hover:bg-gray-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option}
                  {option === filterValue && (phase === 'select' || phase === 'applied') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <Check size={14} weight="bold" className="text-purple-600" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Applied indicator */}
      <AnimatePresence>
        {phase === 'applied' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-10 left-0 right-0 flex justify-center"
          >
            <div className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Check size={12} weight="bold" />
              Filter Applied
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * SortInteraction - Simulates clicking a column header to sort
 */
const SortInteraction: React.FC<{
  isActive: boolean;
  columnName: string;
  onComplete?: () => void;
}> = ({ isActive, columnName, onComplete }) => {
  const [phase, setPhase] = useState<'cursor' | 'click' | 'sorted' | 'done'>('cursor');

  React.useLayoutEffect(() => {
    if (!isActive) return;

    const t1 = setTimeout(() => setPhase('click'), 600);
    const t2 = setTimeout(() => setPhase('sorted'), 1000);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isActive, onComplete]);

  if (!isActive || phase === 'done') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute z-50"
      style={{ top: 60, left: 200 }}
    >
      {/* Column header highlight */}
      <motion.div
        className="relative inline-flex items-center gap-1 px-3 py-2 bg-white border-2 border-purple-400 rounded-lg shadow-lg"
        animate={
          phase === 'click'
            ? { scale: [1, 0.95, 1], backgroundColor: ['#fff', '#f3e8ff', '#fff'] }
            : {}
        }
        transition={{ duration: 0.2 }}
      >
        <span className="text-xs font-semibold text-gray-700 uppercase">{columnName}</span>
        <motion.div
          initial={{ rotate: 0 }}
          animate={phase === 'sorted' ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SortAscending size={14} className="text-purple-600" />
        </motion.div>
      </motion.div>

      {/* Cursor */}
      {phase === 'cursor' && (
        <motion.div
          className="absolute -right-4 -bottom-2"
          initial={{ x: 30, y: -20, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CursorIndicator />
        </motion.div>
      )}

      {phase === 'click' && (
        <motion.div
          className="absolute -right-4 -bottom-2"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 0.8, 1] }}
        >
          <CursorIndicator onClick={true} />
        </motion.div>
      )}

      {/* Sorted indicator */}
      <AnimatePresence>
        {phase === 'sorted' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2"
          >
            <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full whitespace-nowrap">
              Sorted Descending
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * RowSelectInteraction - Simulates hovering and selecting a row
 */
const RowSelectInteraction: React.FC<{
  isActive: boolean;
  onComplete?: () => void;
}> = ({ isActive, onComplete }) => {
  const [phase, setPhase] = useState<'move' | 'hover' | 'select' | 'done'>('move');

  React.useLayoutEffect(() => {
    if (!isActive) return;

    const t1 = setTimeout(() => setPhase('hover'), 600);
    const t2 = setTimeout(() => setPhase('select'), 1200);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isActive, onComplete]);

  if (!isActive || phase === 'done') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute z-50"
      style={{ top: 120, left: 50 }}
    >
      {/* Row highlight */}
      <motion.div
        className="w-[600px] h-10 rounded-lg"
        style={{
          background:
            phase === 'select'
              ? 'linear-gradient(90deg, rgba(128, 57, 233, 0.15), rgba(255, 144, 66, 0.15))'
              : phase === 'hover'
                ? 'rgba(128, 57, 233, 0.08)'
                : 'transparent',
          border: phase === 'select' ? '2px solid rgba(128, 57, 233, 0.4)' : 'none',
        }}
        animate={
          phase === 'select'
            ? { boxShadow: '0 0 0 4px rgba(128, 57, 233, 0.1)' }
            : {}
        }
      />

      {/* Cursor */}
      <motion.div
        className="absolute"
        initial={{ left: -30, top: 20, opacity: 0 }}
        animate={{
          left: phase === 'move' ? 50 : 100,
          top: 20,
          opacity: 1,
        }}
        transition={{ duration: 0.5 }}
      >
        <CursorIndicator onClick={phase === 'select'} />
      </motion.div>

      {/* Selection indicator */}
      <AnimatePresence>
        {phase === 'select' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -right-24 top-1/2 -translate-y-1/2"
          >
            <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Check size={12} weight="bold" />
              Selected
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * SimulatedInteraction - Container component for different interaction types
 */
export const SimulatedInteraction: React.FC<SimulatedInteractionProps> = ({
  type,
  isActive,
  onComplete,
  filterValue = 'Critical',
  sortColumn = 'Health Score',
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <>
          {type === 'filter' && (
            <FilterInteraction
              isActive={isActive}
              filterValue={filterValue}
              onComplete={onComplete}
            />
          )}
          {type === 'sort' && (
            <SortInteraction
              isActive={isActive}
              columnName={sortColumn}
              onComplete={onComplete}
            />
          )}
          {type === 'select-row' && (
            <RowSelectInteraction isActive={isActive} onComplete={onComplete} />
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default SimulatedInteraction;

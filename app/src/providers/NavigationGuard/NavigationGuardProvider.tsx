import { useCallback, useRef, useState, useMemo } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { UnsavedChangesModal } from "../../components/Analytics/UnsavedChangesModal";
import {
  NavigationGuardContext,
  type GuardCheckFn,
  type NavigationGuardConfig,
  type NavigationGuardContextValue,
} from "./NavigationGuardContext";

export function NavigationGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const routerNavigate = useRouterNavigate();
  const guardCheckRef = useRef<GuardCheckFn | null>(null);

  // Modal state
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [modalConfig, setModalConfig] = useState<NavigationGuardConfig | null>(
    null,
  );

  const setGuardCheck = useCallback((check: GuardCheckFn | null) => {
    guardCheckRef.current = check;
  }, []);

  const navigate = useCallback(
    (to: string, onNavigate?: () => void) => {
      const check = guardCheckRef.current;
      if (check) {
        const config = check();
        if (config) {
          setModalConfig(config);
          setPendingAction(() => () => {
            onNavigate?.();
            routerNavigate(to);
          });
          return;
        }
      }
      onNavigate?.();
      routerNavigate(to);
    },
    [routerNavigate],
  );

  const guard = useCallback(
    (action: () => void, modalOverride: NavigationGuardConfig): boolean => {
      const check = guardCheckRef.current;
      if (check && check()) {
        setModalConfig(modalOverride);
        setPendingAction(() => action);
        return true;
      }
      return false;
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    const action = pendingAction;
    setPendingAction(null);
    setModalConfig(null);
    action?.();
  }, [pendingAction]);

  const handleCancel = useCallback(() => {
    setPendingAction(null);
    setModalConfig(null);
  }, []);

  const value = useMemo<NavigationGuardContextValue>(
    () => ({ navigate, guard, setGuardCheck }),
    [navigate, guard, setGuardCheck],
  );

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
      <UnsavedChangesModal
        isOpen={pendingAction !== null && modalConfig !== null}
        title={modalConfig?.title ?? ""}
        body={modalConfig?.body ?? ""}
        confirmLabel={modalConfig?.confirmLabel ?? "Confirm"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </NavigationGuardContext.Provider>
  );
}

import React, { useRef, useState, useEffect, createContext, useContext, useCallback } from 'react';

interface SelectionContextType<T> {
  registerSelectable: (id: string, element: HTMLElement, item: T) => void;
  unregisterSelectable: (id: string) => void;
}

const SelectionContext = createContext<SelectionContextType<any> | null>(null);

type SelectionAreaProps<T> = {
  children: React.ReactNode;
  onSelectedStart?: (event: React.MouseEvent | MouseEvent) => void;
  onSelected?: (items: T[]) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

interface SelectableProps<T> {
  item: T;
  children: (ref: React.Ref<any>) => React.ReactElement;
}

function hasSelectionChanged<T>(oldSelection: T[], newSelection: T[]) {
  if (oldSelection.length !== newSelection.length) return true;
  const oldSet = new Set(oldSelection);
  return newSelection.some((item) => !oldSet.has(item));
}

function SelectionArea<T>({
  children,
  onSelectedStart,
  onSelected,
  className = '',
  style = {},
  disabled = false,
}: SelectionAreaProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectablesMap = useRef(new Map<string, { element: HTMLElement; item: T }>());
  const selectionBoxRef = useRef<HTMLDivElement>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [currentlySelected, setCurrentlySelected] = useState<T[]>([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [mouseDown, setMouseDown] = useState(false);

  const SELECTION_THRESHOLD = 5;

  const registerSelectable = useCallback((id: string, element: HTMLElement, item: T) => {
    selectablesMap.current.set(id, { element, item });
  }, []);

  const unregisterSelectable = useCallback((id: string) => {
    selectablesMap.current.delete(id);
  }, []);

  const doIntersect = (rect1: DOMRect, rect2: DOMRect) => {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  };

  const getSelectedItems = (selectionRect: DOMRect): T[] => {
    const selectedItems: T[] = [];
    selectablesMap.current.forEach(({ element, item }) => {
      const elementRect = element.getBoundingClientRect();
      if (doIntersect(selectionRect, elementRect)) {
        selectedItems.push(item);
      }
    });
    return selectedItems;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;

    const containerRect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    setStartPoint({ x, y });
    setEndPoint({ x, y });
    setMouseDown(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!mouseDown || disabled) return;

    const containerRect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    const dx = Math.abs(x - startPoint.x);
    const dy = Math.abs(y - startPoint.y);

    if (!isSelecting && (dx > SELECTION_THRESHOLD || dy > SELECTION_THRESHOLD)) {
      setIsSelecting(true);
      onSelectedStart?.(e);
    }

    if (isSelecting) {
      setEndPoint({ x, y });
      const newlySelectedItems = getSelectedItems(selectionBoxRef.current!.getBoundingClientRect());
      if (hasSelectionChanged(currentlySelected, newlySelectedItems)) {
        setCurrentlySelected(newlySelectedItems);
        onSelected?.(newlySelectedItems);
      }
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (disabled) return;

    if (!isSelecting && mouseDown) {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (target) {
        const newEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
          button: e.button,
        });
        target.dispatchEvent(newEvent);
      }
    }

    setIsSelecting(false);
    setMouseDown(false);
  };

  useEffect(() => {
    if (mouseDown) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mouseDown, isSelecting, startPoint, currentlySelected]);

  const getSelectionBoxStyle = (): React.CSSProperties => {
    const left = Math.min(startPoint.x, endPoint.x);
    const top = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    return {
      position: 'absolute',
      left,
      top,
      width,
      height,
      backgroundColor: 'rgba(0, 123, 255, 0.2)',
      border: '1px solid rgba(0, 123, 255, 0.5)',
      pointerEvents: 'none',
      zIndex: 1000,
    };
  };

  return (
    <SelectionContext.Provider value={{ registerSelectable, unregisterSelectable }}>
      <div
        ref={containerRef}
        className={`selection-area ${className}`}
        style={{ position: 'relative', ...style }}
        onMouseDown={handleMouseDown}
      >
        {children}
        {isSelecting && <div ref={selectionBoxRef} className={'selection-box'} style={getSelectionBoxStyle()} />}
      </div>
    </SelectionContext.Provider>
  );
}

function Selectable<T>({ item, children }: SelectableProps<T>) {
  const elementRef = useRef<HTMLElement | null>(null);
  const idRef = useRef(`selectable-${Math.random().toString(36).substr(2, 9)}`);
  const context = useContext(SelectionContext) as SelectionContextType<T>;

  useEffect(() => {
    if (elementRef.current && context) {
      context.registerSelectable(idRef.current, elementRef.current, item);
    }

    return () => {
      if (context) {
        context.unregisterSelectable(idRef.current);
      }
    };
  }, [item, context]);

  const setRef = useCallback(
    (element: HTMLElement | null) => {
      elementRef.current = element;
      if (element && context) {
        context.registerSelectable(idRef.current, element, item);
      }
    },
    [item, context],
  );

  return children(setRef);
}

SelectionArea.Selectable = Selectable;

export default SelectionArea;

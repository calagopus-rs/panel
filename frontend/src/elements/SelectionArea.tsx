import React, { Component, createContext, PureComponent } from 'react';

interface SelectionContextType<T> {
  registerSelectable: (id: string, element: HTMLElement, item: T) => void;
  unregisterSelectable: (id: string) => void;
}

const SelectionContext = createContext<SelectionContextType<unknown> | null>(null);

interface SelectionAreaProps<T> {
  children: React.ReactNode;
  onSelectedStart?: (event: React.MouseEvent | MouseEvent) => void;
  onSelected?: (items: T[]) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

interface SelectionAreaState {
  isSelecting: boolean;
  selectionBoxStyle: React.CSSProperties;
}

interface SelectableProps<T> {
  item: T;
  children: (ref: React.Ref<HTMLElement>) => React.ReactElement;
}

function hasSelectionChanged<T>(oldSelection: T[], newSelection: T[]): boolean {
  if (oldSelection.length !== newSelection.length) return true;
  const oldSet = new Set(oldSelection);
  return newSelection.some((item) => !oldSet.has(item));
}

class SelectionBox extends PureComponent<{ style: React.CSSProperties; isVisible: boolean }> {
  render() {
    if (!this.props.isVisible) return null;
    return <div className={'selection-box'} style={this.props.style} />;
  }
}

class Selectable<T> extends PureComponent<SelectableProps<T>> {
  static contextType = SelectionContext;
  declare context: React.ContextType<typeof SelectionContext>;

  private elementRef: HTMLElement | null = null;
  private readonly id = `selectable-${Math.random().toString(36).substr(2, 9)}`;

  componentDidMount(): void {
    if (this.elementRef && this.context) {
      this.context.registerSelectable(this.id, this.elementRef, this.props.item);
    }
  }

  componentWillUnmount(): void {
    if (this.context) {
      this.context.unregisterSelectable(this.id);
    }
  }

  componentDidUpdate(prevProps: SelectableProps<T>): void {
    if (prevProps.item !== this.props.item && this.elementRef && this.context) {
      this.context.registerSelectable(this.id, this.elementRef, this.props.item);
    }
  }

  private readonly setRef = (element: HTMLElement | null): void => {
    this.elementRef = element;
    if (element && this.context) {
      this.context.registerSelectable(this.id, element, this.props.item);
    }
  };

  render(): React.ReactElement {
    return this.props.children(this.setRef);
  }
}

class SelectionArea<T> extends Component<SelectionAreaProps<T>, SelectionAreaState> {
  static Selectable = Selectable;

  private containerRef = React.createRef<HTMLDivElement>();
  private selectablesMap = new Map<string, { element: HTMLElement; item: T }>();
  private currentlySelected: T[] = [];
  private startPoint = { x: 0, y: 0 };
  private endPoint = { x: 0, y: 0 };
  private mouseDown = false;
  private readonly SELECTION_THRESHOLD = 5;

  private readonly registerSelectable = (id: string, element: HTMLElement, item: T): void => {
    this.selectablesMap.set(id, { element, item });
  };

  private readonly unregisterSelectable = (id: string): void => {
    this.selectablesMap.delete(id);
  };

  private readonly handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (this.props.disabled || e.button !== 0) return;

    const containerRect = this.containerRef.current!.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    this.startPoint = { x, y };
    this.endPoint = { x, y };
    this.mouseDown = true;

    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  };

  private readonly handleMouseMove = (e: MouseEvent): void => {
    if (!this.mouseDown || this.props.disabled) return;

    const containerRect = this.containerRef.current!.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    const dx = Math.abs(x - this.startPoint.x);
    const dy = Math.abs(y - this.startPoint.y);

    if (!this.state.isSelecting && (dx > this.SELECTION_THRESHOLD || dy > this.SELECTION_THRESHOLD)) {
      this.setState({ isSelecting: true });
      this.props.onSelectedStart?.(e);
    }

    if (this.state.isSelecting || dx > this.SELECTION_THRESHOLD || dy > this.SELECTION_THRESHOLD) {
      this.endPoint = { x, y };

      const selectionBoxStyle = this.getSelectionBoxStyle();
      this.setState({ selectionBoxStyle });

      const selectionRect = this.getSelectionRect();
      const newlySelectedItems = this.getSelectedItems(selectionRect);

      if (hasSelectionChanged(this.currentlySelected, newlySelectedItems)) {
        this.currentlySelected = newlySelectedItems;
        this.props.onSelected?.(newlySelectedItems);
      }
    }
  };

  private readonly handleMouseUp = (e: MouseEvent): void => {
    if (this.props.disabled) return;

    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);

    if (!this.state.isSelecting && this.mouseDown) {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (target && !(target instanceof HTMLInputElement)) {
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

    this.setState({
      isSelecting: false,
      selectionBoxStyle: { display: 'none' },
    });
    this.mouseDown = false;
  };

  constructor(props: SelectionAreaProps<T>) {
    super(props);
    this.state = {
      isSelecting: false,
      selectionBoxStyle: { display: 'none' },
    };
  }

  componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  private doIntersect(rect1: DOMRect, rect2: DOMRect): boolean {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }

  private getSelectedItems(selectionRect: DOMRect): T[] {
    const selectedItems: T[] = [];
    this.selectablesMap.forEach(({ element, item }) => {
      const elementRect = element.getBoundingClientRect();
      if (this.doIntersect(selectionRect, elementRect)) {
        selectedItems.push(item);
      }
    });
    return selectedItems;
  }

  private getSelectionRect(): DOMRect {
    const containerRect = this.containerRef.current!.getBoundingClientRect();
    const left = Math.min(this.startPoint.x, this.endPoint.x) + containerRect.left;
    const top = Math.min(this.startPoint.y, this.endPoint.y) + containerRect.top;
    const width = Math.abs(this.endPoint.x - this.startPoint.x);
    const height = Math.abs(this.endPoint.y - this.startPoint.y);

    return new DOMRect(left, top, width, height);
  }

  private getSelectionBoxStyle(): React.CSSProperties {
    const left = Math.min(this.startPoint.x, this.endPoint.x);
    const top = Math.min(this.startPoint.y, this.endPoint.y);
    const width = Math.abs(this.endPoint.x - this.startPoint.x);
    const height = Math.abs(this.endPoint.y - this.startPoint.y);

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
  }

  render(): React.ReactNode {
    const { children, className = '', style = {} } = this.props;
    const contextValue = {
      registerSelectable: this.registerSelectable,
      unregisterSelectable: this.unregisterSelectable,
    };

    return (
      <SelectionContext.Provider value={contextValue}>
        <div
          ref={this.containerRef}
          className={`selection-area ${className}`}
          style={{ position: 'relative', ...style }}
          onMouseDown={this.handleMouseDown}
        >
          {children}
          <SelectionBox style={this.state.selectionBoxStyle} isVisible={this.state.isSelecting} />
        </div>
      </SelectionContext.Provider>
    );
  }
}

export default SelectionArea;

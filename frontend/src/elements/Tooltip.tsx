import { EventsType, PlacesType, Tooltip as ReactTooltip, VariantType } from 'react-tooltip';

interface TooltipProps {
  children: React.ReactNode;
  content: string;

  place?: PlacesType;
  variant?: VariantType;
  event?: EventsType;
  delayShow?: number;
  delayHide?: number;
  noArrow?: boolean;
  float?: boolean;
}

export default function Tooltip({ children, content, ...tooltipProps }: TooltipProps) {
  return (
    <>
      <span data-tooltip-id="tooltip" data-tooltip-content={content}>
        {children}
      </span>
      <ReactTooltip
        id="tooltip"
        className="bg-gray-900 px-3 py-2 rounded pointer-events-none max-w-[24rem]"
        {...tooltipProps}
      />
    </>
  );
}

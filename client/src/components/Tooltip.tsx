import * as RadixTooltip from "@radix-ui/react-tooltip";
import type React from "react";

const Tooltip: React.FC<React.PropsWithChildren<{ content: string }>> = ({
  children,
  content,
}) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className="m-2 p-2 bg-black/40 leading-none rounded-md shadow-lg text-sm">
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default Tooltip;

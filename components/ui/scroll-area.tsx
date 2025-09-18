import * as React from 'react'
import { cn } from '../../lib/utils'

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative overflow-hidden', className)} {...props} />
  )
)
ScrollArea.displayName = 'ScrollArea'

export const ScrollViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('h-full w-full overflow-y-auto', className)} {...props} />
  )
)
ScrollViewport.displayName = 'ScrollViewport'



import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-pale-oak/50 bg-white text-stone-900 shadow-sm',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-5 pb-0', className)} {...props} />
  )
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-stone-500', className)} {...props} />
}

function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-4', className)} {...props} />
}

function CardFooter({ className, ...props }) {
  return (
    <div className={cn('flex items-center border-t border-pale-oak/30 p-5 pt-4', className)} {...props} />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  )
}

// Predefined skeletons para uso comum
function CardSkeleton() {
  return (
    <div className="card-athlete animate-pulse">
      <div className="p-4">
        <Skeleton className="h-16 w-16 rounded-full mb-4 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-3 w-1/2 mx-auto mb-4" />
        <div className="flex justify-center gap-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3 animate-pulse">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex animate-pulse py-3 border-b border-border">
      <Skeleton className="h-4 w-1/4 mr-2" />
      <Skeleton className="h-4 w-1/4 mr-2" />
      <Skeleton className="h-4 w-1/4 mr-2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4 mb-1" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4 mb-1" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4 mb-1" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <Skeleton className="h-10 w-1/4 rounded-md" />
    </div>
  );
}

export { Skeleton, CardSkeleton, ListItemSkeleton, TableRowSkeleton, FormSkeleton }

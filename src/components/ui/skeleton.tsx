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
    <div className="animate-pulse border rounded-lg h-[320px] flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex flex-col items-center gap-4 mb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="text-center">
            <Skeleton className="h-6 w-40 mx-auto mb-2" />
            <Skeleton className="h-4 w-28 mx-auto" />
          </div>
        </div>
        
        <div className="space-y-4 px-2 mt-4">
          <div>
            <div className="flex justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2.5 w-full" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2.5 w-full" />
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="p-2 rounded-md bg-muted/30">
              <Skeleton className="h-3 w-12 mx-auto mb-1" />
              <Skeleton className="h-5 w-6 mx-auto" />
            </div>
            <div className="p-2 rounded-md bg-muted/30">
              <Skeleton className="h-3 w-12 mx-auto mb-1" />
              <Skeleton className="h-5 w-6 mx-auto" />
            </div>
            <div className="p-2 rounded-md bg-muted/30">
              <Skeleton className="h-3 w-12 mx-auto mb-1" />
              <Skeleton className="h-5 w-6 mx-auto" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t p-3 flex justify-center">
        <Skeleton className="h-9 w-28 rounded-md" />
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

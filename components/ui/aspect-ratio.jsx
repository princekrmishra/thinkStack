"use client"

<<<<<<< HEAD
import { AspectRatio as AspectRatioPrimitive } from "radix-ui"
=======
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
>>>>>>> origin/main

function AspectRatio({
  ...props
}) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio }

"use client"
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const {setTheme} = useTheme()
  return (
    <div>
      <h2>Prince</h2>
      <Button>Suscribe</Button>
      <Button onClick={()=>setTheme("light")}>Light</Button>
      <Button onClick={()=>setTheme("dark")}>Dark</Button>
    </div>
  );
}

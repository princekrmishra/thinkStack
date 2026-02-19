<<<<<<< HEAD
"use client";
import { Button } from "@/components/ui/button";
=======
"use client"
import { Button } from "@/components/ui/button"
>>>>>>> origin/main
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
<<<<<<< HEAD
} from "@/components/ui/sidebar";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Bolt, Moon, Sun, User2, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import React from "react";
import UsageCreditProgress from "./UsageCreditProgress";

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const {user} = useUser();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Sidebar>
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter />
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="logo"
                width={60}
                height={60}
                className="w-[40px] h-[40px]"
              />
              <h2 className="font-bold text-xl">ThinkStack</h2>
            </div>

            <Button
              variant="ghost"
              onClick={() =>
                setTheme(theme === "light" ? "dark" : "light")
              }
            >
              {theme === "light" ? <Sun /> : <Moon />}
            </Button>
          </div>
        {user ?
          <Button className="mt-7 w-full" size="lg">
            + New Chat
          </Button>
          :
          <SignInButton>
          <Button className="mt-7 w-full" size="lg">
            + New Chat
          </Button>
          </SignInButton>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="p-3">
            <h2 className="font-bold text-lg">Chat</h2>
         {!user && <p className="text-sm text-gray-400">
            Sign in to start chatting with multiple AI
          </p>}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-3 mb-10">
          {!user ? <SignInButton mode="modal">
          <Button className={'w-full'} size='lg'>Sign In / Sign Up</Button>
          </SignInButton> :
          <div>
            <UsageCreditProgress />
            <Button className={'w-full mb-3'}><Zap />Upgrade to Premium</Button>
          <Button className="flex gap-5 w-full" variant="ghost">
            <User2 /><h2>Settings</h2>
        </Button>
        </div>
}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
=======
} from "@/components/ui/sidebar"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

export function AppSidebar() {
  const {theme, setTheme} = useTheme()
  const [mounted, setMounted] = useState(false)
  //for SSR rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // ⛔ Prevent SSR/CSR mismatch
  if (!mounted) return null;

  return (
    <Sidebar>
      <SidebarHeader />
      <div className="p-3">
      <div className="p-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Image src="/logo.svg" alt="logo" width={60} height={60} className="w-[40px] h-[40px]"/>
        <h2 className="font-bold text-xl">ThinkStack</h2>
      </div>
      <div>
        {theme=='light' ? <Button variant="ghost" onClick={() => setTheme('dark')}> <Sun /></Button>
        :
        <Button variant="ghost" onClick={() => setTheme('light')}> <Moon /></Button>
        }
      </div>
      </div>
      <Button className={'mt-7 w-full'} size="lg">+ New Chat</Button>
      </div>
      <SidebarContent>
        <SidebarGroup className={'p-3'}>
          <h2 className="font-bold text-lg">Chat</h2>
          <p className="text-sm text-gray-400">Sign in to start chatting with multiple AI model</p>
        </ SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-3 mb-10">
          <Button className={'w-full'} size="lg">Sign In / Sign Up</Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
>>>>>>> origin/main

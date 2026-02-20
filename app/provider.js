"use client";
import React, { useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AppSidebar } from '@/app/_components/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppHeader from './_components/AppHeader'
import { useUser } from '@clerk/nextjs'
import { AISelectedModelContext } from '@/context/AISelectedModelContext';
import { DefaultModel } from '@/shared/AIModelsShared';
import { UserDetailContext } from '@/context/UserDetailContext';

 
function Provider({
  children,
  ...props
}) {
    const {user} = useUser();
    const [aISelectedModels, setAISelectedModels] = useState(DefaultModel);
    const [userDetail, setUserDetail] = useState();
    const [messages, setMessages] = useState({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    useEffect(() => {
  if (!user) return;

  const init = async () => {
  // 1️⃣ Ensure user exists
  await createUserInDB();

  try {
    // 2️⃣ Load preferences
    const prefRes = await fetch("/api/preferences");
    const prefData = await prefRes.json();

    if (prefData.preferences) {
  setAISelectedModels(prefData.preferences);
}
setIsInitialized(true);

    // 3️⃣ Load user details
    const userRes = await fetch("/api/users");
    const userData = await userRes.json();

    if (!userData.error) {
      setUserDetail(userData);
    }

  } catch (error) {
    console.error("Init error:", error);
  }
};

  init();
}, [user]);

const createUserInDB = async () => {
  try {
    await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: user?.fullName,
        email: user?.primaryEmailAddress?.emailAddress,
      }),
    });
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  if (!user || !isInitialized) return;

  const serialized = JSON.stringify(aISelectedModels);

  if (serialized === lastSaved) return;

  const savePreferences = async () => {
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: aISelectedModels,
        }),
      });

      setLastSaved(serialized);
    } catch (error) {
      console.error("Save preferences error:", error);
    }
  };

  savePreferences();
}, [aISelectedModels, isInitialized]);


  return (
    <NextThemesProvider {...props}
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange>
            <UserDetailContext.Provider value={{userDetail, setUserDetail}}>
            <AISelectedModelContext.Provider value={{aISelectedModels, setAISelectedModels, messages, setMessages}}>
            <SidebarProvider>
                <AppSidebar />
                <div className='w-full'>
                    <AppHeader />
                    
        {children}
        </div>
        </SidebarProvider>
        </AISelectedModelContext.Provider>
        </UserDetailContext.Provider>
    </NextThemesProvider>
  )
}

export default Provider
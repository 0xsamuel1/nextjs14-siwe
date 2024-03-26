"use client";

import "@rainbow-me/rainbowkit/styles.css";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";

import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "@/trpc/react";

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "3f83fcc511419202a952a1f7aced2eac",
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});

export const Provider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient({}));

  return (
    <WagmiProvider config={config}>
      <SessionProvider>
        <TRPCReactProvider>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </QueryClientProvider>
        </TRPCReactProvider>
      </SessionProvider>
    </WagmiProvider>
  );
};

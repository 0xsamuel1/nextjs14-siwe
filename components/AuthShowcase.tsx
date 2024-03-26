"use client";

import { useEffect, useState } from "react";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { SiweMessage } from "siwe";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useChainId,
} from "wagmi";
import { api } from "@/trpc/react";
import { injected } from "wagmi/connectors";

// Auth Component
// ========================================================
export const AuthShowcase: React.FC = () => {
  // Hooks
  const { data: sessionData } = useSession();
  console.log(`sessionData?.user`, sessionData?.user);
  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  console.log(`secretMessage`, secretMessage);

  const [showConnection, setShowConnection] = useState(false);

  // Wagmi Hooks
  const { signMessageAsync } = useSignMessage();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  // Functions
  /**
   * Attempts SIWE and establish session
   */
  const onClickSignIn = async () => {
    try {
      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: await getCsrfToken(),
      });
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });
      await signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature,
      });
    } catch (error) {
      window.alert(error);
    }
  };

  /**
   * Sign user out
   */
  const onClickSignOut = async () => {
    await signOut();
  };

  // Hooks
  /**
   * Handles hydration issue
   * only show after the window has finished loading
   */
  useEffect(() => {
    setShowConnection(true);
  }, []);

  // Render
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {sessionData ? (
        <div className="mb-4 text-center">
          {sessionData ? (
            <div className="mb-4">
              <label className="mb-2 block text-white/80">Logged in as</label>

              <code className="block rounded bg-black/20 p-4 text-white">
                {JSON.stringify(sessionData)}
              </code>
            </div>
          ) : null}
          {secretMessage ? (
            <p className="mb-4">
              <label className="mb-2 block text-white/80">Secret Message</label>
              <code className="block rounded bg-black/20 p-4 text-white">
                {secretMessage}
              </code>
            </p>
          ) : null}

          <button
            className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
            onClick={onClickSignOut as () => void}
          >
            Sign Out
          </button>
        </div>
      ) : showConnection ? (
        <div className="mb-4">
          {isConnected ? (
            <button
              className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
              onClick={onClickSignIn as () => void}
            >
              Sign In
            </button>
          ) : null}
        </div>
      ) : null}
      {showConnection ? (
        <div className="text-center">
          {address ? (
            <p className="mb-4">
              <code className="block rounded bg-black/20 p-4 text-white">
                {address}
              </code>
            </p>
          ) : null}
          <button
            className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
            onClick={() =>
              !isConnected ? connect({ connector: injected() }) : disconnect()
            }
          >
            {!isConnected ? "Connect Wallet" : "Disconnect"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

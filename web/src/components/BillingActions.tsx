"use client";

import { useState } from "react";

type BillingActionsProps = {
  isActive: boolean;
  cancelAtPeriodEnd: boolean;
};

export default function BillingActions({
  isActive,
  cancelAtPeriodEnd,
}: BillingActionsProps) {
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      const payload = await response.json();
      if (payload?.url) {
        window.location.href = payload.url;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (action: "cancel" | "resume") => {
    setLoading(true);
    try {
      await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <button type="button" onClick={startCheckout} disabled={loading}>
        {loading ? "Redirecting..." : "Subscribe"}
      </button>
    );
  }

  return cancelAtPeriodEnd ? (
    <button
      type="button"
      onClick={() => updateSubscription("resume")}
      disabled={loading}
    >
      {loading ? "Working..." : "Resume subscription"}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => updateSubscription("cancel")}
      disabled={loading}
    >
      {loading ? "Working..." : "Cancel subscription"}
    </button>
  );
}

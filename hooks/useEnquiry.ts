"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useEnquiry() {
  const [isLoading, setIsLoading] = useState(false);

  const submitEnquiry = async (data: any, onSuccess?: () => void) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Enquiry sent successfully!");
        onSuccess?.();
        return true;
      } else {
        toast.error(result.error || "Failed to send enquiry.");
        return false;
      }
    } catch {
      toast.error("Network error. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitEnquiry, isLoading };
}

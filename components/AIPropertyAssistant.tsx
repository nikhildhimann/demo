"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage, type ChatMessageData, type SuggestedProperty } from "@/components/chatbot/ChatMessage";
import { buildChatbotWhatsAppMessage, buildWhatsAppUrl, getStackronWhatsAppUrl } from "@/lib/whatsapp";

const GREETING =
  "Hi 👋 Looking for a property? I can help you find the best options based on your budget and location.";

type InterestType = "buy" | "rent" | "exploring";
type Step =
  | "interest"
  | "location"
  | "budget"
  | "customBudget"
  | "propertyType"
  | "leadConsent"
  | "name"
  | "phone"
  | "saving"
  | "done";

type Answers = {
  interestType: InterestType | "";
  location: string;
  budget: string;
  propertyType: string;
  name: string;
  phone: string;
};

type PropertyApiItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  city: string;
  address: string;
  images?: { url: string }[];
};

const interestOptions = [
  { label: "Buy Property", value: "buy" },
  { label: "Rent Property", value: "rent" },
  { label: "Just Exploring", value: "exploring" },
];

const budgetOptions = [
  { label: "Under $500k", value: "under_500k" },
  { label: "$500k – $1M", value: "500k_1m" },
  { label: "$1M+", value: "above_1m" },
  { label: "Custom Budget", value: "custom" },
];

const propertyTypeOptions = [
  { label: "Apartment", value: "APARTMENT" },
  { label: "Villa", value: "VILLA" },
  { label: "Plot", value: "HOUSE" },
  { label: "Commercial", value: "COMMERCIAL" },
];

const leadConsentOptions = [
  { label: "Yes, contact me", value: "yes" },
  { label: "No, thanks", value: "no" },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInterestLabel(value: InterestType | "") {
  if (value === "buy") return "Buy Property";
  if (value === "rent") return "Rent Property";
  if (value === "exploring") return "Just Exploring";
  return "";
}

function getPropertyTypeLabel(value: string) {
  const found = propertyTypeOptions.find((item) => item.value === value);
  return found?.label || value;
}

function isValidPhone(value: string) {
  const cleaned = value.replace(/\D/g, "");
  return cleaned.length >= 10;
}

function budgetToQuery(budgetValue: string) {
  if (budgetValue === "Under $500k") return { maxPrice: "500000" };
  if (budgetValue === "$500k – $1M") return { minPrice: "500000", maxPrice: "1000000" };
  if (budgetValue === "$1M+") return { minPrice: "1000000" };
  return {};
}

export default function AIPropertyAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [step, setStep] = useState<Step>("interest");
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: makeId(),
      role: "bot",
      text: GREETING,
      quickReplies: interestOptions,
    },
  ]);
  const [answers, setAnswers] = useState<Answers>({
    interestType: "",
    location: "",
    budget: "",
    propertyType: "",
    name: "",
    phone: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [typing, setTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState(getStackronWhatsAppUrl());
  const [leadSaved, setLeadSaved] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);

  const showTextInput = useMemo(
    () => ["location", "customBudget", "name", "phone"].includes(step),
    [step]
  );

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, typing, error, isLoading]);

  const addMessage = (message: ChatMessageData) => {
    setMessages((prev) => [...prev, message]);
  };

  const addUserMessage = (text: string) => {
    addMessage({ id: makeId(), role: "user", text });
  };

  const addBotMessage = (text: string, quickReplies?: ChatMessageData["quickReplies"], properties?: SuggestedProperty[]) => {
    addMessage({ id: makeId(), role: "bot", text, quickReplies, properties });
  };

  const askNext = async (next: () => void) => {
    setTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    setTyping(false);
    next();
  };

  const fetchMatchingProperties = async (nextAnswers: Answers) => {
    const params = new URLSearchParams({ status: "AVAILABLE", limit: "8", location: nextAnswers.location });
    const range = budgetToQuery(nextAnswers.budget);
    if (range.minPrice) params.set("minPrice", range.minPrice);
    if (range.maxPrice) params.set("maxPrice", range.maxPrice);
    if (nextAnswers.propertyType) params.set("type", nextAnswers.propertyType);

    const response = await fetch(`/api/properties?${params.toString()}`);
    if (!response.ok) throw new Error("Unable to fetch matching properties");
    const data = await response.json();

    const properties: SuggestedProperty[] = (data.properties || []).slice(0, 3).map((property: PropertyApiItem) => ({
      id: property.id,
      slug: property.slug,
      title: property.title,
      price: property.price,
      city: property.city,
      address: property.address,
      image: property.images?.[0]?.url,
    }));

    return properties;
  };

  const submitLead = async (nextAnswers: Answers) => {
    const message = `Chatbot requirement - Type: ${getInterestLabel(nextAnswers.interestType)} | Location: ${nextAnswers.location} | Budget: ${nextAnswers.budget} | Property Type: ${getPropertyTypeLabel(nextAnswers.propertyType)}`;

    const response = await fetch("/api/chatbot-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nextAnswers.name,
        phone: nextAnswers.phone,
        interestType: nextAnswers.interestType,
        location: nextAnswers.location,
        budget: nextAnswers.budget,
        propertyType: getPropertyTypeLabel(nextAnswers.propertyType),
        message,
        source: "chatbot",
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to save lead");
    }
  };

  const handleQuickReply = async (value: string, label: string) => {
    if (isLoading) return;
    setError("");
    addUserMessage(label);

    if (step === "interest") {
      const interestType = value as InterestType;
      const nextAnswers = { ...answers, interestType };
      setAnswers(nextAnswers);
      setStep("location");
      await askNext(() => {
        addBotMessage("Which location are you interested in?");
      });
      return;
    }

    if (step === "budget") {
      if (value === "custom") {
        setStep("customBudget");
        await askNext(() => {
          addBotMessage("Please type your custom budget.");
        });
        return;
      }

      const nextAnswers = { ...answers, budget: label };
      setAnswers(nextAnswers);
      setStep("propertyType");
      await askNext(() => {
        addBotMessage("What type of property are you looking for?", propertyTypeOptions);
      });
      return;
    }

    if (step === "propertyType") {
      const nextAnswers = { ...answers, propertyType: value };
      setAnswers(nextAnswers);
      setIsLoading(true);
      setStep("saving");

      try {
        const matches = await fetchMatchingProperties(nextAnswers);
        await askNext(() => {
          if (matches.length > 0) {
            addBotMessage("Here are some matching options for you:", undefined, matches);
          } else {
            addBotMessage("I couldn’t find an exact match, but our team can help you with the best available options.");
          }
          addBotMessage("Would you like our agent to contact you with the best options?", leadConsentOptions);
        });
        setStep("leadConsent");
      } catch (err: any) {
        setError(err.message || "Failed to fetch matching properties");
        setStep("propertyType");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === "leadConsent") {
      if (value === "yes") {
        setStep("name");
        await askNext(() => {
          addBotMessage("Great! Please share your name.");
        });
      } else {
        setStep("done");
        await askNext(() => {
          addBotMessage("No worries. You can continue browsing properties, and we’re here when you need us.");
        });
      }
    }
  };

  const handleTextSubmit = async () => {
    if (isLoading) return;
    setError("");

    const value = inputValue.trim();
    if (!value) {
      setError("Please enter a value to continue.");
      return;
    }

    if (step === "phone" && !isValidPhone(value)) {
      setError("Please enter a valid phone number.");
      return;
    }

    addUserMessage(value);
    setInputValue("");

    if (step === "location") {
      const nextAnswers = { ...answers, location: value };
      setAnswers(nextAnswers);
      setStep("budget");
      await askNext(() => {
        addBotMessage("What is your budget range?", budgetOptions);
      });
      return;
    }

    if (step === "customBudget") {
      const nextAnswers = { ...answers, budget: value };
      setAnswers(nextAnswers);
      setStep("propertyType");
      await askNext(() => {
        addBotMessage("What type of property are you looking for?", propertyTypeOptions);
      });
      return;
    }

    if (step === "name") {
      const nextAnswers = { ...answers, name: value };
      setAnswers(nextAnswers);
      setStep("phone");
      await askNext(() => {
        addBotMessage("Please share your phone number.");
      });
      return;
    }

    if (step === "phone") {
      const nextAnswers = { ...answers, phone: value };
      setAnswers(nextAnswers);
      setStep("saving");
      setIsLoading(true);

      try {
        await submitLead(nextAnswers);
        const message = buildChatbotWhatsAppMessage({
          interestType: getInterestLabel(nextAnswers.interestType),
          location: nextAnswers.location,
          budget: nextAnswers.budget,
          propertyType: getPropertyTypeLabel(nextAnswers.propertyType),
          name: nextAnswers.name,
          phone: nextAnswers.phone,
        });
        setWhatsAppUrl(buildWhatsAppUrl(message));
        setLeadSaved(true);

        await askNext(() => {
          addBotMessage(`Thanks, ${nextAnswers.name}! Our agent will contact you within 10 minutes.`);
        });
        setStep("done");
      } catch (err: any) {
        setError(err.message || "Unable to save your requirement. Please try again.");
        setStep("phone");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetChat = () => {
    setStep("interest");
    setMessages([
      {
        id: makeId(),
        role: "bot",
        text: GREETING,
        quickReplies: interestOptions,
      },
    ]);
    setAnswers({ interestType: "", location: "", budget: "", propertyType: "", name: "", phone: "" });
    setInputValue("");
    setError("");
    setTyping(false);
    setIsLoading(false);
    setWhatsAppUrl(getStackronWhatsAppUrl());
    setLeadSaved(false);
  };

  return (
    <>
      {!open && (
        <Button
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          className="fixed bottom-6 right-4 z-[9997] h-14 w-14 rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-950/25 hover:bg-emerald-600 focus-visible:ring-emerald-500 md:h-14 md:w-auto md:rounded-full md:px-5 lg:px-5"
          aria-label="Open AI Property Assistant"
        >
          <Bot className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">AI Property Assistant</span>
        </Button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-3 right-3 z-[10000] w-[calc(100vw-1.5rem)] max-w-sm sm:bottom-4 sm:right-4"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-2xl shadow-slate-950/25">
              <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Property Assistant</p>
                    <p className="text-xs font-medium text-slate-300">Online now</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMinimized((prev) => !prev)}
                    className="rounded-md p-1.5 text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    aria-label="Minimize chatbot"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1.5 text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    aria-label="Close chatbot"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!minimized && (
                <>
                  <div ref={scrollerRef} className="max-h-[min(520px,calc(100vh-220px))] min-h-[320px] space-y-3 overflow-y-auto px-3 py-3 sm:h-[60vh]">
                    {messages.map((message, idx) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLast={idx === messages.length - 1}
                        disabled={isLoading}
                        onQuickReply={handleQuickReply}
                      />
                    ))}

                    {typing && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    {error && <p className="px-1 text-xs font-medium text-red-600">{error}</p>}
                  </div>

                  <div className="border-t border-slate-200 bg-white px-3 py-2 text-slate-950">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Button size="xs" variant="outline" className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100" asChild>
                        <Link href="/properties">Browse Properties</Link>
                      </Button>
                      <Button size="xs" variant="outline" className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100" asChild>
                        <a href={getStackronWhatsAppUrl()} target="_blank" rel="noreferrer">
                          Talk on WhatsApp
                        </a>
                      </Button>
                      <Button size="xs" variant="outline" className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100" asChild>
                        <a href="tel:+919464402648">Call Now</a>
                      </Button>
                    </div>

                    {step === "done" && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" asChild>
                          <a href={whatsAppUrl} target="_blank" rel="noreferrer">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            Continue on WhatsApp
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100" asChild>
                          <Link href="/properties">Browse Properties</Link>
                        </Button>
                      </div>
                    )}

                    {showTextInput && step !== "done" && (
                      <div className="flex items-center gap-2">
                        <Input
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleTextSubmit();
                            }
                          }}
                          placeholder={
                            step === "location"
                              ? "Enter city or area"
                              : step === "customBudget"
                                ? "Enter budget (e.g. $750k)"
                                : step === "name"
                                  ? "Enter your name"
                                  : "Enter your phone number"
                          }
                          className="h-10 bg-white text-slate-950"
                          disabled={isLoading}
                        />
                        <Button size="icon" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => void handleTextSubmit()} disabled={isLoading}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={resetChat}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        Restart chat
                      </button>
                      {leadSaved && <span className="text-xs font-medium text-emerald-700">Lead saved successfully</span>}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

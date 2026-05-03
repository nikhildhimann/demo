import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/data/siteConfig";
import { Button } from "@/components/ui/button";
import { QuickReply, type QuickReplyOption } from "@/components/chatbot/QuickReply";

export type SuggestedProperty = {
  id: string;
  slug: string;
  title: string;
  price: number;
  city: string;
  address: string;
  image?: string;
};

export type ChatMessageData = {
  id: string;
  role: "bot" | "user";
  text: string;
  quickReplies?: QuickReplyOption[];
  properties?: SuggestedProperty[];
};

type ChatMessageProps = {
  message: ChatMessageData;
  isLast?: boolean;
  disabled?: boolean;
  onQuickReply: (value: string, label: string) => void;
};

export function ChatMessage({ message, isLast = false, disabled = false, onQuickReply }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[90%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className={[
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-slate-900 text-white rounded-br-md shadow-sm"
              : "bg-slate-100 border border-slate-200 text-slate-900 rounded-bl-md shadow-sm",
          ].join(" ")}
        >
          {message.text}
        </div>

        {message.properties && message.properties.length > 0 && (
          <div className="w-full space-y-2">
            {message.properties.map((property) => (
              <div key={property.id} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                <div className="flex gap-3">
                  <div className="relative h-16 w-20 overflow-hidden rounded-lg bg-slate-100 shrink-0">
                    {property.image ? (
                      <Image
                        src={property.image}
                        alt={property.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-100" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{property.title}</p>
                    <p className="text-xs font-medium text-emerald-700">{formatPrice(property.price, siteConfig.currency)}</p>
                    <p className="line-clamp-1 text-xs text-slate-600">{property.city || property.address}</p>
                    <Button size="sm" className="mt-2 h-7 rounded-md bg-slate-900 px-2 text-white hover:bg-slate-800" asChild>
                      <Link href={`/properties/${property.slug}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLast && message.quickReplies && message.quickReplies.length > 0 && (
          <QuickReply options={message.quickReplies} onSelect={onQuickReply} disabled={disabled} />
        )}
      </div>
    </div>
  );
}

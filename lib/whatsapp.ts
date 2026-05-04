type ChatbotLeadPayload = {
  businessName: string;
  whatsappNumber: string;
  interestType: string;
  location: string;
  budget: string;
  propertyType: string;
  name: string;
  phone: string;
};

export function buildChatbotWhatsAppMessage(payload: ChatbotLeadPayload) {
  return [
    `Hi ${payload.businessName}, I am interested in properties.`,
    "My requirement:",
    `Type: ${payload.interestType}`,
    `Location: ${payload.location}`,
    `Budget: ${payload.budget}`,
    `Property Type: ${payload.propertyType}`,
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
  ].join("\n");
}

export function buildWhatsAppUrl(whatsappNumber: string, message = "") {
  const phone = whatsappNumber.replace(/\D/g, "");
  if (!phone) return "";
  return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

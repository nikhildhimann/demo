type ChatbotLeadPayload = {
  interestType: string;
  location: string;
  budget: string;
  propertyType: string;
  name: string;
  phone: string;
};

const WHATSAPP_NUMBER = "919464402648";

export function buildChatbotWhatsAppMessage(payload: ChatbotLeadPayload) {
  return [
    "Hi Stackron Real Estate, I am interested in properties.",
    "My requirement:",
    `Type: ${payload.interestType}`,
    `Location: ${payload.location}`,
    `Budget: ${payload.budget}`,
    `Property Type: ${payload.propertyType}`,
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
  ].join("\n");
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getStackronWhatsAppUrl() {
  return `https://wa.me/${WHATSAPP_NUMBER}`;
}

import { sendEmailNotification } from "./email-notify-client.js";

const form = document.getElementById("contactForm");
const status = document.getElementById("contactStatus");
const topicPicker = document.getElementById("contactTopicPicker");
const topicTrigger = document.getElementById("contactTopicTrigger");
const topicMenu = document.getElementById("contactTopicMenu");
const topicInput = document.getElementById("contactTopic");
const topicSelected = document.getElementById("contactTopicSelected");

const contactRoutes = {
  "Account support": "support@rankmyprop.in",
  "Research correction": "listing@rankmyprop.in",
  "Prop firm listing": "office@rankmyprop.in",
  "Partnership inquiry": "marketing@rankmyprop.in",
  "General inquiry": "support@rankmyprop.in",
  "Legal or privacy request": "legal@rankmyprop.in",
};

function closeTopicMenu() {
  if (!topicMenu || !topicTrigger) return;
  topicMenu.hidden = true;
  topicTrigger.setAttribute("aria-expanded", "false");
  topicPicker?.classList.remove("is-open");
}

function openTopicMenu() {
  if (!topicMenu || !topicTrigger) return;
  topicMenu.hidden = false;
  topicTrigger.setAttribute("aria-expanded", "true");
  topicPicker?.classList.add("is-open");
}

if (topicTrigger && topicMenu && topicInput) {
  topicTrigger.addEventListener("click", () => {
    if (topicMenu.hidden) openTopicMenu();
    else closeTopicMenu();
  });

  topicMenu.querySelectorAll("[role='option']").forEach((option) => {
    option.addEventListener("click", () => {
      const topic = String(option.dataset.topic || "Account support");
      topicInput.value = topic;
      if (topicSelected) topicSelected.textContent = topic;
      topicMenu.querySelectorAll("[role='option']").forEach((row) => row.setAttribute("aria-selected", String(row === option)));
      closeTopicMenu();
      topicTrigger.focus();
    });
  });

  document.addEventListener("click", (event) => {
    if (!topicPicker?.contains(event.target)) closeTopicMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTopicMenu();
      topicTrigger.focus();
    }
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const topic = String(data.get("topic") || "General inquiry").trim();
    const message = String(data.get("message") || "").trim();
    const website = String(data.get("website") || "").trim();
    const submitButton = form.querySelector("button[type='submit']");

    if (!name || !email || !message) {
      if (status) status.textContent = "Please complete your name, email and message.";
      return;
    }

    if (message.length > 5000) {
      if (status) status.textContent = "Please keep your message under 5,000 characters.";
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending…";
    }
    if (status) status.textContent = "Sending your message securely…";

    const result = await sendEmailNotification("contact_message", {
      userEmail: email,
      senderName: name,
      topic,
      message,
      website,
      source: "contact_page"
    });

    if (result.ok) {
      if (status) status.textContent = `Message sent to the ${topic.toLowerCase()} team.`;
      form.reset();
      topicInput.value = "Account support";
      if (topicSelected) topicSelected.textContent = "Account support";
      topicMenu?.querySelectorAll("[role='option']").forEach((row, index) => row.setAttribute("aria-selected", String(index === 0)));
    } else if (status) {
      status.textContent = "Message could not be sent right now. Please try again.";
    }

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Send message";
    }
  });
}

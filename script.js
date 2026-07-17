// Set the footer year automatically
document.getElementById("year").textContent = new Date().getFullYear();

// Simple interaction for the call-to-action button
document.getElementById("cta").addEventListener("click", () => {
  alert("Hello from Coffee & Laptop! ☕💻");
});
